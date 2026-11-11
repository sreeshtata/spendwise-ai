import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AiService } from '../services/ai.service.js';
import { DbService } from '../services/db.service.js';

export const aiRouter = Router();
const aiService = new AiService();
const db = DbService.getInstance();

aiRouter.get('/explain-budget/:budgetId', async (req: AuthenticatedRequest, res: Response) => {
  const budgetId = req.params.budgetId;
  const budget = db.budgets.get(budgetId);

  const totalEnvelopeMinor = budget?.totalIncomeEnvelopeMinor || 520000;
  const potentialSavingsMinor = budget?.plannedSavingsMinor || 100000;

  const result = await aiService.explainBudgetAdjustment(budgetId, {
    totalEnvelopeMinor,
    potentialSavingsMinor,
    topExpenseCategory: 'Dining & Drinks',
  });

  res.json(result);
});

aiRouter.post('/explain-tradeoffs', async (req: AuthenticatedRequest, res: Response) => {
  const { primaryTitle, primaryPriceMinor, alternativeTitle, alternativePriceMinor, purpose } = req.body;

  const result = await aiService.explainProductTradeoffs(
    primaryTitle || 'Sony WH-1000XM5',
    primaryPriceMinor || 36299,
    alternativeTitle || 'Anker Space Q45',
    alternativePriceMinor || 12039,
    purpose || 'Work Productivity & Focus'
  );

  res.json(result);
});
