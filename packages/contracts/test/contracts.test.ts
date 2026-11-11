import { describe, it, expect } from 'vitest';
import {
  PayPalCreateOrderSchema,
  PayPalCaptureOrderSchema,
  CreateTransactionSchema,
  TransactionFilterSchema,
  CreateBudgetSchema,
  BudgetRecommendationItemSchema,
  RecommendationFeedbackSchema,
  PeerSpendingRequestSchema,
  ProductSearchQuerySchema,
} from '../src/index.js';

describe('Contracts Schema Validation Suite', () => {
  it('validates PayPalCreateOrderSchema with string IDs and minor units', () => {
    const validPayload = {
      amountMinor: 12039,
      currency: 'USD',
      itemDescription: 'Anker Space Q45 Headphones',
      purposeId: 'purp-productivity',
      categoryId: 'cat-tech',
      idempotencyKey: 'test-key-123',
    };
    const parsed = PayPalCreateOrderSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);

    // Negative amounts must fail
    const invalidPayload = { ...validPayload, amountMinor: -500 };
    expect(PayPalCreateOrderSchema.safeParse(invalidPayload).success).toBe(false);

    // Zero amount must fail
    const zeroPayload = { ...validPayload, amountMinor: 0 };
    expect(PayPalCreateOrderSchema.safeParse(zeroPayload).success).toBe(false);
  });

  it('validates PayPalCaptureOrderSchema requires valid non-empty order ID', () => {
    expect(PayPalCaptureOrderSchema.safeParse({ paypalOrderId: 'PAYPAL-TEST-123' }).success).toBe(true);
    expect(PayPalCaptureOrderSchema.safeParse({ paypalOrderId: '' }).success).toBe(false);
  });

  it('validates CreateTransactionSchema rejects zero or negative amounts', () => {
    const baseTx = {
      amountMinor: 5000,
      currency: 'INR',
      transactionType: 'expense',
      merchant: 'Local Mart',
      occurredAt: '2026-03-01T12:00:00Z',
    };
    expect(CreateTransactionSchema.safeParse(baseTx).success).toBe(true);
    expect(CreateTransactionSchema.safeParse({ ...baseTx, amountMinor: 0 }).success).toBe(false);
    expect(CreateTransactionSchema.safeParse({ ...baseTx, amountMinor: -100 }).success).toBe(false);
  });

  it('validates TransactionFilterSchema bounds pagination and accepts string IDs', () => {
    const filter = {
      page: 1,
      limit: 50,
      categoryId: 'cat-tech',
      purposeId: 'purp-productivity',
      minAmountMinor: 1000,
    };
    const parsed = TransactionFilterSchema.safeParse(filter);
    expect(parsed.success).toBe(true);

    // Limit over 100 fails
    expect(TransactionFilterSchema.safeParse({ limit: 101 }).success).toBe(false);
  });

  it('validates CreateBudgetSchema enforces positive income envelope and allocation structure', () => {
    const budget = {
      periodYear: 2026,
      periodMonth: 3,
      currency: 'INR',
      totalIncomeEnvelopeMinor: 2000000,
      plannedSavingsMinor: 500000,
      allocations: [
        {
          categoryId: 'cat-food',
          allocatedAmountMinor: 500000,
          essentialMinimumMinor: 400000,
          isEssential: true,
        },
      ],
    };
    expect(CreateBudgetSchema.safeParse(budget).success).toBe(true);
  });

  it('validates RecommendationFeedbackSchema accepts accepted, rejected, modified actions', () => {
    expect(RecommendationFeedbackSchema.safeParse({ recommendationId: 'rec-1', feedbackAction: 'accepted' }).success).toBe(true);
    expect(RecommendationFeedbackSchema.safeParse({ recommendationId: 'rec-1', feedbackAction: 'rejected' }).success).toBe(true);
    expect(RecommendationFeedbackSchema.safeParse({ recommendationId: 'rec-1', feedbackAction: 'invalid' }).success).toBe(false);
  });

  it('validates PeerSpendingRequestSchema defaults and bounds', () => {
    const req = { purposeSlug: 'sustenance' };
    const parsed = PeerSpendingRequestSchema.safeParse(req);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.periodPreset).toBe('monthly');
      expect(parsed.data.currency).toBe('USD');
    }
  });

  it('validates ProductSearchQuerySchema requires non-empty query description', () => {
    expect(ProductSearchQuerySchema.safeParse({ queryDescription: 'headphones' }).success).toBe(true);
    expect(ProductSearchQuerySchema.safeParse({ queryDescription: '' }).success).toBe(false);
  });
});
