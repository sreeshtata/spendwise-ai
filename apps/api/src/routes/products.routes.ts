import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Channel3Service } from '../services/channel3.service.js';
import { ProductSearchQuerySchema } from '@spendwise/contracts';

export const productsRouter = Router();
const channel3Service = new Channel3Service();

productsRouter.post('/search', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const parseResult = ProductSearchQuerySchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid product search criteria.',
      details: parseResult.error.format(),
    });
  }

  try {
    const results = await channel3Service.searchProducts(userId, parseResult.data);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({
      code: 'PRODUCT_SEARCH_ERROR',
      message: err.message || 'Failed to complete product discovery.',
    });
  }
});
