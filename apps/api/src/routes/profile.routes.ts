import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { DbService } from '../services/db.service.js';
import { UpdateProfileSchema } from '@spendwise/contracts';

export const profileRouter = Router();
const db = DbService.getInstance();

profileRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const profile = db.profiles.get(userId);
  const preferences = db.preferences.get(userId);

  if (!profile) {
    return res.status(404).json({ code: 'PROFILE_NOT_FOUND', message: 'Profile not found.' });
  }

  res.json({
    ...profile,
    preferences,
  });
});

profileRouter.patch('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const profile = db.profiles.get(userId);

  if (!profile) {
    return res.status(404).json({ code: 'PROFILE_NOT_FOUND', message: 'Profile not found.' });
  }

  const parseResult = UpdateProfileSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid profile update payload',
      details: parseResult.error.format(),
    });
  }

  const updated = {
    ...profile,
    ...parseResult.data,
    updatedAt: new Date().toISOString(),
  };

  db.profiles.set(userId, updated);
  res.json(updated);
});

profileRouter.patch('/preferences', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const current = db.preferences.get(userId) || {
    userId,
    peerComparisonConsent: false,
    aiFinancialInsightsConsent: true,
    analyticsSharingConsent: false,
    theme: 'light' as const,
  };

  const updated = {
    ...current,
    ...req.body,
    userId, // enforce ownership
  };

  db.preferences.set(userId, updated);
  res.json(updated);
});

profileRouter.get('/export', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const profile = db.profiles.get(userId);
  const preferences = db.preferences.get(userId);
  const userTxs = Array.from(db.transactions.values()).filter(t => t.userId === userId);
  const userBudgets = Array.from(db.budgets.values()).filter(b => b.userId === userId);

  res.json({
    exportDate: new Date().toISOString(),
    profile,
    preferences,
    transactionCount: userTxs.length,
    transactions: userTxs,
    budgetCount: userBudgets.length,
    budgets: userBudgets,
  });
});

profileRouter.delete('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  // Clean up user data
  db.profiles.delete(userId);
  db.preferences.delete(userId);

  // Clean up user transactions
  for (const [id, tx] of db.transactions.entries()) {
    if (tx.userId === userId) {
      db.transactions.delete(id);
    }
  }

  // Clean up user budgets
  for (const [id, b] of db.budgets.entries()) {
    if (b.userId === userId) {
      db.budgets.delete(id);
    }
  }

  res.json({
    success: true,
    message: 'User account and all associated private financial records successfully deleted.',
  });
});
