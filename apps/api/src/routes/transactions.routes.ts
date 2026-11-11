import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { DbService } from '../services/db.service.js';
import { ElasticsearchService } from '../services/elasticsearch.service.js';
import {
  CreateTransactionSchema,
  TransactionFilterSchema,
  Transaction,
  CsvImportCommitSchema,
} from '@spendwise/contracts';
import { v4 as uuidv4 } from 'uuid';

export const transactionsRouter = Router();
const db = DbService.getInstance();
const searchService = new ElasticsearchService();

transactionsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  
  // Clean empty string query params so empty values do not fail min(1) validation
  const cleanQuery: Record<string, any> = {};
  for (const [key, val] of Object.entries(req.query)) {
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      cleanQuery[key] = val;
    }
  }

  const filterParse = TransactionFilterSchema.safeParse(cleanQuery);

  if (!filterParse.success) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid filter parameters.',
      details: filterParse.error.format(),
    });
  }

  const filter = filterParse.data;

  // Validate date logic
  if (filter.dateFrom && isNaN(new Date(filter.dateFrom).getTime())) {
    return res.status(400).json({ code: 'INVALID_DATE', message: 'dateFrom is not a valid date' });
  }
  if (filter.dateTo && isNaN(new Date(filter.dateTo).getTime())) {
    return res.status(400).json({ code: 'INVALID_DATE', message: 'dateTo is not a valid date' });
  }
  if (filter.dateFrom && filter.dateTo && new Date(filter.dateFrom) > new Date(filter.dateTo)) {
    return res.status(400).json({
      code: 'INVALID_DATE_RANGE',
      message: 'dateFrom cannot be greater than dateTo (reversed range).',
    });
  }

  const searchResults = await searchService.search(userId, filter);
  res.json(searchResults);
});

transactionsRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const parseResult = CreateTransactionSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid transaction payload.',
      details: parseResult.error.format(),
    });
  }

  const data = parseResult.data;
  const id = uuidv4();
  const nowIso = new Date().toISOString();

  // Resolve category and purpose names
  const categoryName = data.categoryId ? db.categories.get(data.categoryId)?.name : undefined;
  const purposeName = data.purposeId ? db.paymentPurposes.get(data.purposeId)?.name : undefined;

  const transaction: Transaction = {
    id,
    userId,
    amountMinor: data.amountMinor,
    currency: data.currency,
    transactionType: data.transactionType,
    status: data.status || 'completed',
    categoryId: data.categoryId || null,
    categoryName,
    purposeId: data.purposeId || null,
    purposeName,
    merchant: data.merchant,
    description: data.description || null,
    occurredAt: data.occurredAt,
    source: data.source || 'manual',
    externalReference: data.externalReference || null,
    refundParentId: data.refundParentId || null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  db.transactions.set(id, transaction);
  searchService.syncFromDb();

  res.status(201).json(transaction);
});

transactionsRouter.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const txId = req.params.id;
  const tx = db.transactions.get(txId);

  if (!tx) {
    return res.status(404).json({ code: 'TRANSACTION_NOT_FOUND', message: 'Transaction not found.' });
  }

  // User ownership check
  if (tx.userId !== userId) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'You do not have permission to delete this transaction.' });
  }

  db.transactions.delete(txId);
  searchService.syncFromDb();

  res.json({ success: true, message: 'Transaction deleted successfully.' });
});

/**
 * CSV Import Preview with Formula Injection Defense & Validation
 */
transactionsRouter.post('/csv-preview', (req: AuthenticatedRequest, res: Response) => {
  const { csvContent } = req.body;

  if (!csvContent || typeof csvContent !== 'string') {
    return res.status(400).json({ code: 'INVALID_CSV', message: 'csvContent string is required.' });
  }

  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    return res.status(400).json({ code: 'EMPTY_CSV', message: 'CSV must contain a header and at least one data row.' });
  }

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = [];
  let validCount = 0;
  let errorCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const cols = rawLine.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    const errors: string[] = [];

    // Map columns
    const merchantRaw = cols[0] || '';
    const amountRaw = cols[1] || '';
    const currencyRaw = (cols[2] || 'USD').toUpperCase();
    const typeRaw = (cols[3] || 'expense').toLowerCase();
    const dateRaw = cols[4] || new Date().toISOString();

    // 1. Formula Injection Guard: sanitize cells starting with '=', '+', '-', '@', '\t', '\r'
    const sanitizeFormula = (str: string) => {
      if (/^[=+\-@\t\r]/.test(str)) {
        return `'${str}`; // Prefix with quote
      }
      return str;
    };
    const merchant = sanitizeFormula(merchantRaw);

    if (!merchant) errors.push('Merchant name is required.');

    const amountNum = parseFloat(amountRaw);
    if (isNaN(amountNum) || amountNum <= 0) {
      errors.push('Amount must be a positive number.');
    }
    const amountMinor = Math.round(amountNum * 100);

    const validTypes = ['income', 'expense', 'transfer', 'refund'];
    if (!validTypes.includes(typeRaw)) {
      errors.push(`Invalid type "${typeRaw}". Must be one of: income, expense, transfer, refund.`);
    }

    const occurredAt = new Date(dateRaw).toISOString();
    if (isNaN(new Date(occurredAt).getTime())) {
      errors.push('Invalid date format.');
    }

    const isValid = errors.length === 0;
    if (isValid) validCount++;
    else errorCount++;

    rows.push({
      rowIndex: i,
      merchant,
      amountMinor: isNaN(amountMinor) ? 0 : amountMinor,
      currency: currencyRaw,
      transactionType: typeRaw,
      occurredAt,
      isValid,
      validationErrors: errors,
    });
  }

  res.json({ rows, validCount, errorCount, totalRows: rows.length });
});

/**
 * CSV Import Commit
 */
transactionsRouter.post('/csv-commit', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const parseResult = CsvImportCommitSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Invalid commit payload', details: parseResult.error.format() });
  }

  const { transactions } = parseResult.data;
  const committed: Transaction[] = [];
  const nowIso = new Date().toISOString();

  for (const item of transactions) {
    const id = uuidv4();
    const categoryName = item.categoryId ? db.categories.get(item.categoryId)?.name : undefined;
    const purposeName = item.purposeId ? db.paymentPurposes.get(item.purposeId)?.name : undefined;

    const tx: Transaction = {
      id,
      userId,
      amountMinor: item.amountMinor,
      currency: item.currency,
      transactionType: item.transactionType,
      status: item.status || 'completed',
      categoryId: item.categoryId || null,
      categoryName,
      purposeId: item.purposeId || null,
      purposeName,
      merchant: item.merchant,
      description: item.description || null,
      occurredAt: item.occurredAt,
      source: 'import',
      externalReference: item.externalReference || null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.transactions.set(id, tx);
    committed.push(tx);
  }

  searchService.syncFromDb();
  res.status(201).json({ importedCount: committed.length, data: committed });
});
