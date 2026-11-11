import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { BudgetService } from '../services/budget.service.js';
import { CreateBudgetSchema, RecommendationFeedbackSchema } from '@spendwise/contracts';

export const budgetsRouter = Router();
const budgetService = new BudgetService();

budgetsRouter.get('/active', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
  const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;

  const budget = budgetService.getActiveBudget(userId, year, month);
  res.json(budget);
});

budgetsRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const parseResult = CreateBudgetSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid budget payload.',
      details: parseResult.error.format(),
    });
  }

  try {
    const saved = budgetService.saveBudget(userId, parseResult.data);
    res.status(200).json(saved);
  } catch (err: any) {
    res.status(400).json({
      code: 'BUDGET_RULE_VIOLATION',
      message: err.message,
    });
  }
});

budgetsRouter.get('/recommendations', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
  const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
  const envelope = req.query.envelope ? parseInt(req.query.envelope as string, 10) : undefined;

  const recommendations = budgetService.generateRecommendations(userId, year, month, envelope);
  res.json(recommendations);
});

budgetsRouter.post('/feedback', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const parseResult = RecommendationFeedbackSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Invalid feedback payload' });
  }

  budgetService.submitFeedback(userId, parseResult.data);
  res.json({ success: true, message: 'Feedback recorded.' });
});
