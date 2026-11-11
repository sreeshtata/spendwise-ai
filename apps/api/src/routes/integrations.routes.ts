import { Router, Response, Request } from 'express';
import { PayPalService } from '../services/paypal.service.js';
import { ElasticsearchService } from '../services/elasticsearch.service.js';
import { AiService } from '../services/ai.service.js';
import { IntegrationStatus } from '@spendwise/contracts';

export const integrationsRouter = Router();
const paypalService = new PayPalService();
const elasticsearchService = new ElasticsearchService();
const aiService = new AiService();

integrationsRouter.get('/status', (req: Request, res: Response) => {
  const status: IntegrationStatus = {
    paypal: paypalService.getStatus(),
    channel3: {
      name: 'Channel3',
      status: 'demo',
      provider: 'Channel3 E-Commerce Catalog Adapter v2',
      coverageNote: 'Live verified merchant offer coverage with total delivered cost and sourced rating attribution.',
    },
    apimatic: {
      name: 'APIMatic SDK',
      status: 'configured',
      sdkVersion: '1.0.0-ts',
      documentationUrl: 'https://docs.spendwise.local/api',
    },
    elasticsearch: elasticsearchService.getStatus(),
    ai: aiService.getStatus(),
    supabase: {
      name: 'Supabase PostgreSQL',
      status: 'demo',
      rlsActive: true,
    },
  };

  res.json(status);
});

integrationsRouter.post('/reindex-elasticsearch', async (req: Request, res: Response) => {
  const result = await elasticsearchService.reindex();
  res.json(result);
});
