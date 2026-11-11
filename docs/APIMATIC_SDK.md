# SpendWise AI — APIMatic Generated SDK Integration

SpendWise AI includes a fully typed TypeScript client SDK structured according to APIMatic's SDK generation design patterns.

The SDK is published within the repository under `@spendwise/contracts` and generated directly from the OpenAPI 3.1 specification at [`packages/contracts/src/openapi/openapi.json`](file:///c:/Users/tavig/Desktop/paypal/packages/contracts/src/openapi/openapi.json).

---

## 1. APIMatic SDK Architecture

The client adopts APIMatic's standard layered controller architecture:

```
SpendWiseClient
├── transactions: TransactionsController
├── budgets: BudgetsController
├── products: ProductsController
├── spending: SpendingController
├── paypal: PayPalController
├── ai: AiController
├── profile: ProfileController
└── integrations: IntegrationsController
```

### Key SDK Characteristics:
- **Type-Safe Models**: Inferred from runtime Zod schemas matching OpenAPI models.
- **Custom Error Hierarchy**: Rejection wrapped in `SpendWiseApiError` with HTTP status codes, machine-readable codes, and request tracking IDs.
- **Configurable HTTP Layer**: Configurable base URL, timeout management with `AbortController`, and automatic `Authorization: Bearer <token>` injection.
- **Dual Runtime Support**: Built as a pure ES Module (`"type": "module"`) compatible with Node.js 18+ and browser runtimes.

---

## 2. Quickstart & Usage

```typescript
import { SpendWiseClient } from '@spendwise/contracts';

// 1. Initialize client
const client = new SpendWiseClient({
  baseUrl: 'http://localhost:3001/api/v1',
  authToken: 'demo-user-1',
  timeoutMs: 15000,
});

// 2. Fetch Active Budget
const activeBudget = await client.budgets.getActive();
console.log('Active Envelope:', activeBudget.totalIncomeEnvelopeMinor);

// 3. Search Products with Delivered Cost & Budget Impact
const searchResult = await client.products.search({
  queryDescription: 'noise cancelling wireless headphones',
  purchasePurposeId: 'purp-productivity',
  maxBudgetMinor: 40000,
  currency: 'USD',
  deliveryCountry: 'US',
  quantity: 1,
});
console.log('Same Product Merchants:', searchResult.sameProductOffers.length);
console.log('Alternative Vetted Options:', searchResult.alternativeOffers.length);

// 4. Create and Capture PayPal Sandbox Test Order
const order = await client.paypal.createOrder({
  itemDescription: 'Anker Space Q45 Headphones',
  amountMinor: 12039,
  currency: 'USD',
  purposeId: 'purp-productivity',
  categoryId: 'cat-tech',
});

const capture = await client.paypal.captureOrder({
  paypalOrderId: order.paypalOrderId,
});
console.log('Verified Transaction ID:', capture.transactionId);
```

---

## 3. APIMatic Generation Commands

To regenerate the SDK from the OpenAPI contract using APIMatic CLI or CodeGen API:

```bash
# Export OpenAPI 3.1 contract
cat packages/contracts/src/openapi/openapi.json

# APIMatic CodeGen CLI invocation
apimatic generate --spec packages/contracts/src/openapi/openapi.json --language typescript --output packages/contracts/src/sdk/
```
