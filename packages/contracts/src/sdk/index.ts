/**
 * SpendWise AI TypeScript SDK
 * Generated / structured according to APIMatic SDK design patterns
 * Compatible with SpendWise REST API v1
 */

import {
  Profile,
  UpdateProfile,
  Transaction,
  CreateTransaction,
  TransactionFilter,
  Budget,
  CreateBudget,
  BudgetRecommendationResponse,
  RecommendationFeedback,
  ProductSearchQuery,
  ProductSearchResponse,
  PeerSpendingRequest,
  PeerSpendingResponse,
  MySpendingProgressResponse,
  PayPalCreateOrder,
  PayPalCreateOrderResponse,
  PayPalCaptureOrder,
  PayPalCaptureOrderResponse,
  IntegrationStatus,
} from '../schemas/index.js';

export interface SdkConfig {
  baseUrl: string;
  authToken?: string;
  timeoutMs?: number;
  customHeaders?: Record<string, string>;
}

export class SpendWiseApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: string = 'API_ERROR', details?: unknown) {
    super(message);
    this.name = 'SpendWiseApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class SpendWiseClient {
  private config: SdkConfig;

  public readonly transactions: TransactionsController;
  public readonly budgets: BudgetsController;
  public readonly products: ProductsController;
  public readonly spending: SpendingController;
  public readonly paypal: PayPalController;
  public readonly ai: AiController;
  public readonly integrations: IntegrationsController;
  public readonly profile: ProfileController;

  constructor(config: Partial<SdkConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:3001/api/v1',
      authToken: config.authToken,
      timeoutMs: config.timeoutMs || 15000,
      customHeaders: config.customHeaders || {},
    };

    this.transactions = new TransactionsController(this);
    this.budgets = new BudgetsController(this);
    this.products = new ProductsController(this);
    this.spending = new SpendingController(this);
    this.paypal = new PayPalController(this);
    this.ai = new AiController(this);
    this.integrations = new IntegrationsController(this);
    this.profile = new ProfileController(this);
  }

  public setAuthToken(token: string) {
    this.config.authToken = token;
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...this.config.customHeaders,
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new SpendWiseApiError(
          data?.message || `Request failed with status ${response.status}`,
          response.status,
          data?.code || 'HTTP_ERROR',
          data?.details
        );
      }

      return data as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof SpendWiseApiError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : 'Unknown network error';
      throw new SpendWiseApiError(message, 500, 'NETWORK_ERROR');
    }
  }
}

export class ProfileController {
  constructor(private client: SpendWiseClient) {}

  async get(): Promise<Profile> {
    return this.client.request<Profile>('/profile');
  }

  async update(update: UpdateProfile): Promise<Profile> {
    return this.client.request<Profile>('/profile', {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
  }
}

export class TransactionsController {
  constructor(private client: SpendWiseClient) {}

  async list(filter: Partial<TransactionFilter> = {}): Promise<{ data: Transaction[]; total: number; page: number; limit: number }> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        params.append(key, String(val));
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.client.request(`/transactions${query}`);
  }

  async create(data: CreateTransaction): Promise<Transaction> {
    return this.client.request<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async delete(id: string): Promise<{ success: boolean }> {
    return this.client.request<{ success: boolean }>(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  async importCsvPreview(csvContent: string): Promise<{ rows: any[]; validCount: number; errorCount: number }> {
    return this.client.request('/transactions/csv-preview', {
      method: 'POST',
      body: JSON.stringify({ csvContent }),
    });
  }

  async importCsvCommit(transactions: CreateTransaction[]): Promise<{ importedCount: number; data: Transaction[] }> {
    return this.client.request('/transactions/csv-commit', {
      method: 'POST',
      body: JSON.stringify({ transactions }),
    });
  }
}

export class BudgetsController {
  constructor(private client: SpendWiseClient) {}

  async getActive(year?: number, month?: number): Promise<Budget | null> {
    const params = year && month ? `?year=${year}&month=${month}` : '';
    return this.client.request<Budget | null>(`/budgets/active${params}`);
  }

  async createOrUpdate(budget: CreateBudget): Promise<Budget> {
    return this.client.request<Budget>('/budgets', {
      method: 'POST',
      body: JSON.stringify(budget),
    });
  }

  async getRecommendations(year?: number, month?: number): Promise<BudgetRecommendationResponse> {
    const params = year && month ? `?year=${year}&month=${month}` : '';
    return this.client.request<BudgetRecommendationResponse>(`/budgets/recommendations${params}`);
  }

  async submitFeedback(feedback: RecommendationFeedback): Promise<{ success: boolean }> {
    return this.client.request<{ success: boolean }>('/budgets/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }
}

export class ProductsController {
  constructor(private client: SpendWiseClient) {}

  async search(query: ProductSearchQuery): Promise<ProductSearchResponse> {
    return this.client.request<ProductSearchResponse>('/products/search', {
      method: 'POST',
      body: JSON.stringify(query),
    });
  }
}

export class SpendingController {
  constructor(private client: SpendWiseClient) {}

  async getPeerSpending(request: PeerSpendingRequest): Promise<PeerSpendingResponse> {
    const params = new URLSearchParams();
    Object.entries(request).forEach(([k, v]) => {
      if (v !== undefined) params.append(k, String(v));
    });
    return this.client.request<PeerSpendingResponse>(`/spending/peer?${params.toString()}`);
  }

  async getMyProgress(periodType: string = 'prior_year_month'): Promise<MySpendingProgressResponse> {
    return this.client.request<MySpendingProgressResponse>(`/spending/progress?type=${periodType}`);
  }
}

export class PayPalController {
  constructor(private client: SpendWiseClient) {}

  async createOrder(data: PayPalCreateOrder): Promise<PayPalCreateOrderResponse> {
    return this.client.request<PayPalCreateOrderResponse>('/paypal/create-order', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async captureOrder(data: PayPalCaptureOrder): Promise<PayPalCaptureOrderResponse> {
    return this.client.request<PayPalCaptureOrderResponse>('/paypal/capture-order', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export class AiController {
  constructor(private client: SpendWiseClient) {}

  async explainBudget(budgetId: string): Promise<{ narrative: string; limitations: string }> {
    return this.client.request(`/ai/explain-budget/${budgetId}`);
  }

  async explainProductTradeoffs(productIds: string[]): Promise<{ comparisonNarrative: string }> {
    return this.client.request('/ai/explain-tradeoffs', {
      method: 'POST',
      body: JSON.stringify({ productIds }),
    });
  }
}

export class IntegrationsController {
  constructor(private client: SpendWiseClient) {}

  async getStatus(): Promise<IntegrationStatus> {
    return this.client.request<IntegrationStatus>('/integrations/status');
  }

  async reindexElasticsearch(): Promise<{ status: string; indexed: number }> {
    return this.client.request('/integrations/reindex-elasticsearch', {
      method: 'POST',
    });
  }
}
