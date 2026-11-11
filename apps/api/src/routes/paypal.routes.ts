import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { PayPalService } from '../services/paypal.service.js';
import { PayPalCreateOrderSchema, PayPalCaptureOrderSchema } from '@spendwise/contracts';

export const paypalRouter = Router();
const paypalService = new PayPalService();

paypalRouter.post('/create-order', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const parseResult = PayPalCreateOrderSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid PayPal order request payload.',
      details: parseResult.error.format(),
    });
  }

  try {
    const orderResponse = await paypalService.createOrder(userId, parseResult.data);
    res.status(201).json(orderResponse);
  } catch (err: any) {
    res.status(400).json({
      code: 'PAYPAL_ORDER_ERROR',
      message: err.message,
    });
  }
});

paypalRouter.post('/capture-order', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const parseResult = PayPalCaptureOrderSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid PayPal capture request.',
      details: parseResult.error.format(),
    });
  }

  try {
    const captureResult = await paypalService.captureOrder(userId, parseResult.data);
    res.status(200).json(captureResult);
  } catch (err: any) {
    res.status(400).json({
      code: 'PAYPAL_CAPTURE_ERROR',
      message: err.message,
    });
  }
});

paypalRouter.post('/webhook', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await paypalService.handleWebhook(req.headers as Record<string, string>, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ code: 'WEBHOOK_ERROR', message: err.message });
  }
});
