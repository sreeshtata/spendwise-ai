import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { authMiddleware } from './middleware/auth.middleware.js';
import { profileRouter } from './routes/profile.routes.js';
import { transactionsRouter } from './routes/transactions.routes.js';
import { budgetsRouter } from './routes/budgets.routes.js';
import { productsRouter } from './routes/products.routes.js';
import { spendingRouter } from './routes/spending.routes.js';
import { paypalRouter } from './routes/paypal.routes.js';
import { aiRouter } from './routes/ai.routes.js';
import { integrationsRouter } from './routes/integrations.routes.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createApp() {
  const app = express();

  // Basic security and parsing
  app.use(helmet({
    contentSecurityPolicy: false, // Allow Swagger UI and API exploration
  }));
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));
  app.use(express.json({ limit: '5mb' }));

  // Attach unique requestId
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = `req-${uuidv4().substring(0, 8)}`;
    res.setHeader('X-Request-Id', requestId);
    (req as any).requestId = requestId;
    next();
  });

  // Load OpenAPI specification
  let openApiSpec = {};
  try {
    const specPath = join(__dirname, '../../contracts/src/openapi/openapi.json');
    openApiSpec = JSON.parse(readFileSync(specPath, 'utf8'));
  } catch (err) {
    try {
      const fallbackPath = join(__dirname, '../openapi.json');
      openApiSpec = JSON.parse(readFileSync(fallbackPath, 'utf8'));
    } catch {
      openApiSpec = { openapi: '3.1.0', info: { title: 'SpendWise API', version: '1.0.0' } };
    }
  }

  // Swagger Documentation endpoint
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get('/api/v1/openapi.json', (req: Request, res: Response) => {
    res.json(openApiSpec);
  });

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'UP',
      service: 'SpendWise AI Backend API',
      timestamp: new Date().toISOString(),
    });
  });

  // API v1 Routers (Authenticated with user ownership verification)
  const apiV1 = express.Router();
  apiV1.use(authMiddleware);

  apiV1.use('/profile', profileRouter);
  apiV1.use('/transactions', transactionsRouter);
  apiV1.use('/budgets', budgetsRouter);
  apiV1.use('/products', productsRouter);
  apiV1.use('/spending', spendingRouter);
  apiV1.use('/paypal', paypalRouter);
  apiV1.use('/ai', aiRouter);
  apiV1.use('/integrations', integrationsRouter);

  app.use('/api/v1', apiV1);

  // Fallback 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
      requestId: (req as any).requestId || 'req-unknown',
    });
  });

  // Central Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled API Error:', err);
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred.',
      requestId: (req as any).requestId || 'req-unknown',
      details: err.details || undefined,
    });
  });

  return app;
}
