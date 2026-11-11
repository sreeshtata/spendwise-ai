import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { DEMO_USER_ID, SECOND_USER_ID } from '../src/services/db.service.js';

describe('SpendWise AI API Integration Tests', () => {
  const app = createApp();

  it('GET /health returns UP status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
  });

  it('GET /api/v1/profile returns authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', 'Bearer demo-user-1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(DEMO_USER_ID);
    expect(res.body.fullName).toBe('Alex Morgan');
    expect(res.body.currency).toBe('USD');
  });

  it('Strict Cross-User Isolation: User 2 cannot access or delete User 1 private transactions', async () => {
    // 1. Fetch user 1 transactions
    const u1Res = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', 'Bearer demo-user-1');

    expect(u1Res.status).toBe(200);
    const u1Tx = u1Res.body.data[0];
    expect(u1Tx.userId).toBe(DEMO_USER_ID);

    // 2. User 2 attempts to delete User 1's transaction
    const delRes = await request(app)
      .delete(`/api/v1/transactions/${u1Tx.id}`)
      .set('Authorization', 'Bearer demo-user-2'); // Jordan Lee

    expect(delRes.status).toBe(403);
    expect(delRes.body.code).toBe('FORBIDDEN');

    // 3. User 2 listing transactions should NOT see user 1 transactions
    const u2Res = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', 'Bearer demo-user-2');

    expect(u2Res.status).toBe(200);
    for (const tx of u2Res.body.data) {
      expect(tx.userId).toBe(SECOND_USER_ID);
    }
  });

  it('Elasticsearch Fallback: Search functions seamlessly even without external cluster', async () => {
    const res = await request(app)
      .get('/api/v1/transactions?query=Bistro')
      .set('Authorization', 'Bearer demo-user-1');

    expect(res.status).toBe(200);
    expect(res.body.sourceDriver).toBe('postgresql_fallback');
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].merchant).toContain('Bistro');
  });

  it('Budget Infeasibility: Essential minimum obligations cannot be silently cut', async () => {
    // Attempt to save a budget where planned allocations exceed total income envelope
    const invalidBudget = {
      periodYear: 2024,
      periodMonth: 12,
      currency: 'USD',
      totalIncomeEnvelopeMinor: 200000, // $2,000 envelope
      plannedSavingsMinor: 50000, // $500 savings
      allocations: [
        {
          categoryId: 'cat-housing',
          categoryName: 'Housing',
          allocatedAmountMinor: 170000, // $1,700
          essentialMinimumMinor: 165000,
          isEssential: true,
        },
        {
          categoryId: 'cat-groceries',
          categoryName: 'Groceries',
          allocatedAmountMinor: 60000, // $600 -> Total planned is 1700+600+500 = 2800 > 2000!
          essentialMinimumMinor: 50000,
          isEssential: true,
        },
      ],
    };

    const res = await request(app)
      .post('/api/v1/budgets')
      .set('Authorization', 'Bearer demo-user-1')
      .send(invalidBudget);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BUDGET_RULE_VIOLATION');
    expect(res.body.message).toContain('exceed total income envelope');
  });

  it('Peer Spending Context: Cohort size < 30 returns "Insufficient comparable data"', async () => {
    const res = await request(app)
      .get('/api/v1/spending/peer?purposeSlug=niche-specialty')
      .set('Authorization', 'Bearer demo-user-1');

    expect(res.status).toBe(200);
    expect(res.body.cohortDefinition.isSufficientCohort).toBe(false);
    expect(res.body.insufficientDataExplanation).toContain('Insufficient comparable data');
    expect(res.body.benchmark).toBeNull();
  });

  it('Peer Spending Context: Cohort size >= 30 returns median and synthetic disclosure', async () => {
    const res = await request(app)
      .get('/api/v1/spending/peer?purposeSlug=sustenance')
      .set('Authorization', 'Bearer demo-user-1');

    expect(res.status).toBe(200);
    expect(res.body.cohortDefinition.isSufficientCohort).toBe(true);
    expect(res.body.benchmark.medianAmountMinor).toBe(64000);
    expect(res.body.benchmark.isSynthetic).toBe(true);
  });

  it('Product Search: Returns same-product offers and vetted alternatives with budget impact', async () => {
    const res = await request(app)
      .post('/api/v1/products/search')
      .set('Authorization', 'Bearer demo-user-1')
      .send({
        queryDescription: 'noise cancelling wireless headphones for focus',
        purchasePurposeId: 'purp-productivity',
        quantity: 1,
        deliveryCountry: 'US',
        currency: 'USD',
      });

    expect(res.status).toBe(200);
    expect(res.body.sameProductOffers.length).toBeGreaterThan(0);
    expect(res.body.alternativeOffers.length).toBeGreaterThan(0);
    expect(res.body.budgetImpact.currentBudgetMinor).toBeGreaterThan(0);
    expect(res.body.budgetImpact.remainingBudgetBeforePurchaseMinor).toBeDefined();
    expect(res.body.budgetImpact.differenceFromBaselineMinor).toBeDefined();
  });

  it('PayPal Sandbox: Creates order, captures order, and records transaction exactly once (idempotent)', async () => {
    // 1. Create order
    const createRes = await request(app)
      .post('/api/v1/paypal/create-order')
      .set('Authorization', 'Bearer demo-user-1')
      .send({
        amountMinor: 12039, // $120.39 for Anker Q45
        currency: 'USD',
        itemDescription: 'Anker Space Q45 Headphones (Sandbox Demonstration)',
        idempotencyKey: 'idemp-test-key-999',
      });

    expect(createRes.status).toBe(201);
    const { paypalOrderId } = createRes.body;
    expect(paypalOrderId).toBeDefined();

    // 2. Capture order
    const captureRes = await request(app)
      .post('/api/v1/paypal/capture-order')
      .set('Authorization', 'Bearer demo-user-1')
      .send({ paypalOrderId });

    expect(captureRes.status).toBe(200);
    expect(captureRes.body.status).toBe('COMPLETED');
    const firstTxId = captureRes.body.transactionId;

    // 3. Re-capture the exact same order (Idempotency test!)
    const duplicateRes = await request(app)
      .post('/api/v1/paypal/capture-order')
      .set('Authorization', 'Bearer demo-user-1')
      .send({ paypalOrderId });

    expect(duplicateRes.status).toBe(200);
    expect(duplicateRes.body.status).toBe('COMPLETED');
    expect(duplicateRes.body.transactionId).toBe(firstTxId);
    expect(duplicateRes.body.message).toContain('Idempotent');
  });

  it('CSV Import: Escapes formula injection triggers and flags row errors', async () => {
    const maliciousCsv = `Merchant,Amount,Currency,Type,Date\n=cmd|' /C calc'!A0,45.00,USD,expense,2024-03-12\nValid Store,12.50,USD,invalid_type,2024-03-13\nCoffee Shop,-5.00,USD,expense,2024-03-14`;

    const res = await request(app)
      .post('/api/v1/transactions/csv-preview')
      .set('Authorization', 'Bearer demo-user-1')
      .send({ csvContent: maliciousCsv });

    expect(res.status).toBe(200);
    expect(res.body.rows.length).toBe(3);

    // Formula injection check: cell starting with '=' must be prepended with a single quote
    expect(res.body.rows[0].merchant.startsWith("'=")).toBe(true);

    // Row 2 error: invalid_type
    expect(res.body.rows[1].isValid).toBe(false);
    expect(res.body.rows[1].validationErrors[0]).toContain('Invalid type');

    // Row 3 error: negative amount
    expect(res.body.rows[2].isValid).toBe(false);
    expect(res.body.rows[2].validationErrors[0]).toContain('positive number');
  });
});
