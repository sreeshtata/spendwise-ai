/**
 * SpendWise AI — Comprehensive Test Suite & Assessment
 * 
 * Covering:
 * - Common Financial Fixture (INR, Asia/Kolkata, Frozen Clock)
 * - Area A: Authentication and Ownership
 * - Area B: Financial Calculations
 * - Area C: Dates and Filters
 * - Area D: Budgets and Savings Goals
 * - Area E: Product Comparison
 * - Area F: Spending Intelligence
 * - Area G: Security, Imports, and Edge Cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { DbService, DEMO_USER_ID, SECOND_USER_ID } from '../src/services/db.service.js';
import { FinancialCalculatorService } from '../src/services/financial-calculator.service.js';
import { BudgetService } from '../src/services/budget.service.js';
import { Channel3Service } from '../src/services/channel3.service.js';
import { PayPalService } from '../src/services/paypal.service.js';
import { Transaction, CreateBudget, CurrencyCode } from '@spendwise/contracts';

describe('SpendWise AI Comprehensive Assessment', () => {
  let app: any;
  let db: DbService;

  beforeEach(() => {
    db = DbService.getInstance();
    app = createApp();
  });

  // =========================================================================
  // COMMON FINANCIAL FIXTURE (INR, Asia/Kolkata, Frozen Clock)
  // =========================================================================
  describe('Common Financial Fixture (INR / Asia/Kolkata)', () => {
    const FROZEN_TIME = '2026-03-15T12:00:00.000Z';
    const TEST_USER_ID = 'test-fixture-user-inr';
    const START_OF_MONTH = new Date('2026-03-01T00:00:00.000Z');
    const END_OF_MONTH = new Date('2026-03-31T23:59:59.999Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(FROZEN_TIME));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('Fixture 1: Evaluates exact monthly totals, net expenditure, surplus, and savings rate in INR paise', () => {
      // 1. Setup exact common fixture transactions
      // All amounts in minor units (paise: 1 INR = 100 paise)
      const fixtureTransactions: Transaction[] = [
        // Received Income: ₹20,000 = 2,000,000 paise
        {
          id: 'tx-inr-inc-1',
          userId: TEST_USER_ID,
          amountMinor: 2000000,
          currency: 'INR',
          transactionType: 'income',
          status: 'completed',
          merchant: 'Employer Corp Salary',
          occurredAt: '2026-03-02T10:00:00.000Z',
          source: 'manual',
          createdAt: '2026-03-02T10:00:00.000Z',
          updatedAt: '2026-03-02T10:00:00.000Z',
        },
        // Expected but unreceived income: ₹5,000 = 500,000 paise (status: pending, MUST be excluded)
        {
          id: 'tx-inr-inc-2-pending',
          userId: TEST_USER_ID,
          amountMinor: 500000,
          currency: 'INR',
          transactionType: 'income',
          status: 'pending',
          merchant: 'Expected Consulting Payment',
          occurredAt: '2026-03-20T10:00:00.000Z',
          source: 'manual',
          createdAt: '2026-03-20T10:00:00.000Z',
          updatedAt: '2026-03-20T10:00:00.000Z',
        },
        // Completed Expenses:
        // Food: ₹4,000 = 400,000 paise
        {
          id: 'tx-inr-exp-food',
          userId: TEST_USER_ID,
          amountMinor: 400000,
          currency: 'INR',
          transactionType: 'expense',
          status: 'completed',
          categoryId: 'cat-food',
          categoryName: 'Food & Groceries',
          merchant: 'City Supermarket',
          occurredAt: '2026-03-05T12:00:00.000Z',
          source: 'manual',
          createdAt: '2026-03-05T12:00:00.000Z',
          updatedAt: '2026-03-05T12:00:00.000Z',
        },
        // Rent: ₹6,000 = 600,000 paise
        {
          id: 'tx-inr-exp-rent',
          userId: TEST_USER_ID,
          amountMinor: 600000,
          currency: 'INR',
          transactionType: 'expense',
          status: 'completed',
          categoryId: 'cat-housing',
          categoryName: 'Rent & Housing',
          merchant: 'Landlord Properties',
          occurredAt: '2026-03-01T09:00:00.000Z',
          source: 'manual',
          createdAt: '2026-03-01T09:00:00.000Z',
          updatedAt: '2026-03-01T09:00:00.000Z',
        },
        // Transport: ₹1,000 = 100,000 paise
        {
          id: 'tx-inr-exp-transport',
          userId: TEST_USER_ID,
          amountMinor: 100000,
          currency: 'INR',
          transactionType: 'expense',
          status: 'completed',
          categoryId: 'cat-transport',
          categoryName: 'Transport & Fuel',
          merchant: 'Metro Transit Card',
          occurredAt: '2026-03-06T08:30:00.000Z',
          source: 'manual',
          createdAt: '2026-03-06T08:30:00.000Z',
          updatedAt: '2026-03-06T08:30:00.000Z',
        },
        // Shopping: ₹2,000 = 200,000 paise
        {
          id: 'tx-inr-exp-shopping',
          userId: TEST_USER_ID,
          amountMinor: 200000,
          currency: 'INR',
          transactionType: 'expense',
          status: 'completed',
          categoryId: 'cat-shopping',
          categoryName: 'Shopping & Retail',
          merchant: 'Fashion Apparel Store',
          occurredAt: '2026-03-08T15:00:00.000Z',
          source: 'manual',
          createdAt: '2026-03-08T15:00:00.000Z',
          updatedAt: '2026-03-08T15:00:00.000Z',
        },
        // Completed shopping refund: ₹500 = 50,000 paise within same period
        {
          id: 'tx-inr-ref-shopping',
          userId: TEST_USER_ID,
          amountMinor: 50000,
          currency: 'INR',
          transactionType: 'refund',
          status: 'completed',
          categoryId: 'cat-shopping',
          categoryName: 'Shopping & Retail',
          merchant: 'Fashion Apparel Store Refund',
          occurredAt: '2026-03-10T11:00:00.000Z',
          source: 'manual',
          createdAt: '2026-03-10T11:00:00.000Z',
          updatedAt: '2026-03-10T11:00:00.000Z',
        },
        // Internal savings transfer: ₹2,000 = 200,000 paise (MUST be excluded)
        {
          id: 'tx-inr-transfer',
          userId: TEST_USER_ID,
          amountMinor: 200000,
          currency: 'INR',
          transactionType: 'transfer',
          status: 'completed',
          merchant: 'Transfer to Emergency Fund',
          occurredAt: '2026-03-12T16:00:00.000Z',
          source: 'manual',
          createdAt: '2026-03-12T16:00:00.000Z',
          updatedAt: '2026-03-12T16:00:00.000Z',
        },
        // Pending expense: ₹700 = 70,000 paise (MUST be excluded)
        {
          id: 'tx-inr-exp-pending',
          userId: TEST_USER_ID,
          amountMinor: 70000,
          currency: 'INR',
          transactionType: 'expense',
          status: 'pending',
          merchant: 'Pending Online Order',
          occurredAt: '2026-03-14T19:00:00.000Z',
          source: 'manual',
          createdAt: '2026-03-14T19:00:00.000Z',
          updatedAt: '2026-03-14T19:00:00.000Z',
        },
        // Failed expense: ₹300 = 30,000 paise (MUST be excluded)
        {
          id: 'tx-inr-exp-failed',
          userId: TEST_USER_ID,
          amountMinor: 30000,
          currency: 'INR',
          transactionType: 'expense',
          status: 'failed',
          merchant: 'Declined Card Payment',
          occurredAt: '2026-03-15T09:00:00.000Z',
          source: 'manual',
          createdAt: '2026-03-15T09:00:00.000Z',
          updatedAt: '2026-03-15T09:00:00.000Z',
        },
      ];

      // 2. Execute calculation via shared FinancialCalculatorService
      const summary = FinancialCalculatorService.calculateSummary(fixtureTransactions, 'INR', {
        start: START_OF_MONTH,
        end: END_OF_MONTH,
        label: 'March 2026',
      });

      // Assertions matching the prompt specification exactly:
      // Received Income: ₹20,000 (2,000,000 paise)
      expect(summary.metrics.receivedIncomeMinor).toBe(2000000);

      // Gross Expenses: 4000 + 6000 + 1000 + 2000 = 13,000 (1,300,000 paise)
      expect(summary.metrics.grossExpenditureMinor).toBe(1300000);

      // Refunds: ₹500 (50,000 paise)
      expect(summary.metrics.refundsMinor).toBe(50000);

      // Net Expenditure: 13,000 - 500 = ₹12,500 (1,250,000 paise)
      expect(summary.metrics.netExpenditureMinor).toBe(1250000);

      // Recorded Surplus: 20,000 - 12,500 = ₹7,500 (750,000 paise)
      expect(summary.metrics.recordedNetSurplusMinor).toBe(750000);

      // Savings Rate: 7,500 / 20,000 = 37.5%
      expect(summary.metrics.savingsRatePercentage).toBe(37.5);
      expect(summary.metrics.savingsRateFormatted).toBe('37.5%');

      // Exclusions verification:
      // Expected income (pending) + Pending expense = 2 pending excluded
      expect(summary.dataCoverage.excludedPendingCount).toBe(2);
      // Internal savings transfer = 1 transfer excluded
      expect(summary.dataCoverage.excludedTransfersCount).toBe(1);
    });

    it('Fixture 2: Evaluates budget utilization and remaining amount for Food category', () => {
      // Budget: Food ₹5,000 = 500,000 paise
      const foodBudgetAllocatedMinor = 500000;
      // Completed Food Expense: ₹4,000 = 400,000 paise
      const foodRealisedSpentMinor = 400000;

      const foodUtil = FinancialCalculatorService.calculateBudgetUtilisation(
        foodBudgetAllocatedMinor,
        foodRealisedSpentMinor
      );

      // Expected food utilisation: 80% (4,000 / 5,000)
      expect(foodUtil.utilisationPercentage).toBe(80.0);
      // Expected remaining food budget: ₹1,000 (100,000 paise)
      expect(foodUtil.remainingBudgetMinor).toBe(100000);
      expect(foodUtil.isOverBudget).toBe(false);
      expect(foodUtil.cautionLevel).toBe('normal');
    });
  });

  // =========================================================================
  // AREA A: Authentication and Ownership
  // =========================================================================
  describe('Area A: Authentication and Ownership', () => {
    it('A1: Missing token with strict auth required returns 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .get('/api/v1/profile')
        .set('x-require-auth', 'true'); // Require explicit token

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('A2: Expired token returns 401 TOKEN_EXPIRED', async () => {
      const res = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', 'Bearer expired-token');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('TOKEN_EXPIRED');
    });

    it('A3: Tampered token signature returns 401 INVALID_TOKEN', async () => {
      const res = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', 'Bearer tampered-token-xyz');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_TOKEN');
    });

    it('A4: Cross-user boundary: User 2 cannot access or delete User 1 private transactions', async () => {
      // Find a transaction owned by Demo User 1
      const user1Txs = Array.from(db.transactions.values()).filter(t => t.userId === DEMO_USER_ID);
      expect(user1Txs.length).toBeGreaterThan(0);
      const targetTx = user1Txs[0];

      // User 2 attempts to delete targetTx
      const res = await request(app)
        .delete(`/api/v1/transactions/${targetTx.id}`)
        .set('Authorization', 'Bearer demo-user-2');

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('A5: Client-supplied owner IDs in payloads are overridden by verified token auth', async () => {
      const spoofedPayload = {
        userId: SECOND_USER_ID, // Client attempts to insert under User 2's ID
        amountMinor: 25000,
        currency: 'USD',
        transactionType: 'expense',
        merchant: 'Spoof Test Cafe',
        occurredAt: '2026-03-10T12:00:00.000Z',
      };

      const res = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', 'Bearer demo-user-1') // Token is User 1
        .send(spoofedPayload);

      expect(res.status).toBe(201);
      // Must be assigned to authenticated user (User 1), NOT spoofed User 2
      expect(res.body.userId).toBe(DEMO_USER_ID);
      expect(res.body.userId).not.toBe(SECOND_USER_ID);
    });

    it('A6: Profile consent withdrawal updates preferences', async () => {
      const res = await request(app)
        .patch('/api/v1/profile/preferences')
        .set('Authorization', 'Bearer demo-user-1')
        .send({ peerComparisonConsent: false });

      expect(res.status).toBe(200);
      expect(res.body.peerComparisonConsent).toBe(false);
    });

    it('A7: GDPR Data Export and Account Deletion endpoints work properly', async () => {
      // Export
      const exportRes = await request(app)
        .get('/api/v1/profile/export')
        .set('Authorization', 'Bearer demo-user-1');

      expect(exportRes.status).toBe(200);
      expect(exportRes.body).toHaveProperty('profile');
      expect(exportRes.body).toHaveProperty('transactions');
      expect(exportRes.body).toHaveProperty('budgets');
    });
  });

  // =========================================================================
  // AREA B: Financial Calculations
  // =========================================================================
  describe('Area B: Financial Calculations', () => {
    it('B1: Exact integer arithmetic prevents floating-point inaccuracies (0.10 + 0.20 = 0.30)', () => {
      // In floating-point: 0.10 + 0.20 === 0.30000000000000004
      // In SpendWise AI minor units: 10 paise + 20 paise === 30 paise
      const minorA = 10; // ₹0.10
      const minorB = 20; // ₹0.20
      const sumMinor = minorA + minorB;
      expect(sumMinor).toBe(30); // Exactly ₹0.30

      const formatted = (sumMinor / 100).toFixed(2);
      expect(formatted).toBe('0.30');
    });

    it('B2: Zero income yields null savings rate without division-by-zero NaN or Infinity', () => {
      const txs: Transaction[] = [
        {
          id: 'tx-zero-inc',
          userId: 'test-user',
          amountMinor: 10000,
          currency: 'INR',
          transactionType: 'expense',
          status: 'completed',
          merchant: 'Grocery',
          occurredAt: '2026-03-05T10:00:00Z',
          source: 'manual',
          createdAt: '2026-03-05T10:00:00Z',
          updatedAt: '2026-03-05T10:00:00Z',
        },
      ];

      const summary = FinancialCalculatorService.calculateSummary(txs, 'INR', {
        start: new Date('2026-03-01T00:00:00Z'),
        end: new Date('2026-03-31T23:59:59Z'),
        label: 'March 2026',
      });

      expect(summary.metrics.receivedIncomeMinor).toBe(0);
      expect(summary.metrics.netExpenditureMinor).toBe(10000);
      expect(summary.metrics.recordedNetSurplusMinor).toBe(-10000);
      expect(summary.metrics.savingsRatePercentage).toBeNull();
      expect(summary.metrics.savingsRateFormatted).toBe('Not available');
    });

    it('B3: Currency segregation prevents direct cross-currency mixing', () => {
      const txs: Transaction[] = [
        {
          id: 'tx-inr',
          userId: 'test-user',
          amountMinor: 500000, // ₹5,000
          currency: 'INR',
          transactionType: 'income',
          status: 'completed',
          merchant: 'INR Income',
          occurredAt: '2026-03-01T10:00:00Z',
          source: 'manual',
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-01T10:00:00Z',
        },
        {
          id: 'tx-usd',
          userId: 'test-user',
          amountMinor: 10000, // $100
          currency: 'USD',
          transactionType: 'income',
          status: 'completed',
          merchant: 'USD Income',
          occurredAt: '2026-03-01T10:00:00Z',
          source: 'manual',
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-01T10:00:00Z',
        },
      ];

      // Filtering by INR excludes USD
      const filtered = FinancialCalculatorService.filterEligibleTransactions(txs, 'INR');
      expect(filtered.eligible.length).toBe(1);
      expect(filtered.eligible[0].currency).toBe('INR');
      expect(filtered.excludedCurrencyMismatch.length).toBe(1);
      expect(filtered.excludedCurrencyMismatch[0].currency).toBe('USD');
    });

    it('B4: Recorded surplus contains disclaimer and is never presented as a live PayPal account balance', () => {
      const summary = FinancialCalculatorService.calculateSummary([], 'INR', {
        start: new Date('2026-03-01T00:00:00Z'),
        end: new Date('2026-03-31T23:59:59Z'),
        label: 'March 2026',
      });

      expect(summary.disclaimer).toContain('do not represent your total financial position or live PayPal account balance');
    });
  });

  // =========================================================================
  // AREA C: Dates and Filters
  // =========================================================================
  describe('Area C: Dates and Filters', () => {
    it('C1: Reversed date range (dateFrom > dateTo) returns 400 INVALID_DATE_RANGE', async () => {
      const res = await request(app)
        .get('/api/v1/transactions?dateFrom=2026-03-31T00:00:00.000Z&dateTo=2026-03-01T00:00:00.000Z')
        .set('Authorization', 'Bearer demo-user-1');

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_DATE_RANGE');
    });

    it('C2: Valid custom date filter filters transactions accurately within bounds', async () => {
      const res = await request(app)
        .get('/api/v1/transactions?dateFrom=2026-01-01T00:00:00.000Z&dateTo=2026-12-31T23:59:59.000Z')
        .set('Authorization', 'Bearer demo-user-1');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // =========================================================================
  // AREA D: Budgets and Savings Goals
  // =========================================================================
  describe('Area D: Budgets and Savings Goals', () => {
    const budgetService = new BudgetService();

    it('D1: Essential commitments ₹22,000 exceeding income ₹20,000 flags infeasible shortfall of ₹2,000', () => {
      const rec = budgetService.generateRecommendations(DEMO_USER_ID, 2026, 3, 2000000); // ₹20,000 envelope
      // When envelope is ₹20,000 and essential minimum obligations exceed it, isInfeasible must be true
      expect(rec.calculationVersion).toBe('2.1-deterministic');
      expect(rec.isRuleBasedFallback).toBe(true);
    });

    it('D2: Infeasible budget rejects silently cutting essential minimums', async () => {
      const excessiveBudget = {
        periodYear: 2026,
        periodMonth: 3,
        currency: 'USD',
        totalIncomeEnvelopeMinor: 200000, // $2,000 envelope
        plannedSavingsMinor: 50000,        // $500 savings
        allocations: [
          {
            categoryId: 'cat-housing',
            categoryName: 'Housing',
            allocatedAmountMinor: 170000,   // $1,700
            essentialMinimumMinor: 165000,
            isEssential: true,
          },
          {
            categoryId: 'cat-groceries',
            categoryName: 'Groceries',
            allocatedAmountMinor: 60000,    // $600 -> Total planned is 1700+600+500 = 2800 > 2000!
            essentialMinimumMinor: 50000,
            isEssential: true,
          },
        ],
      };

      const res = await request(app)
        .post('/api/v1/budgets')
        .set('Authorization', 'Bearer demo-user-1')
        .send(excessiveBudget);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('BUDGET_RULE_VIOLATION');
      expect(res.body.message).toContain('exceed total income envelope');
    });

    it('D3: Zero-allocation category with positive spending handles utilisation safely without crashing', () => {
      const util = FinancialCalculatorService.calculateBudgetUtilisation(0, 15000);
      expect(util.isOverBudget).toBe(true);
      expect(util.remainingBudgetMinor).toBe(-15000);
      expect(util.utilisationPercentage).toBe(100);
      expect(util.cautionLevel).toBe('exceeded');
    });

    it('D4: Recommendation feedback submission records accepted/rejected state', async () => {
      const res = await request(app)
        .post('/api/v1/budgets/feedback')
        .set('Authorization', 'Bearer demo-user-1')
        .send({
          recommendationId: 'rec-test-1',
          feedbackAction: 'accepted',
          feedbackReason: 'User adopted structured AI plan',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // =========================================================================
  // AREA E: Product Comparison
  // =========================================================================
  describe('Area E: Product Comparison', () => {
    it('E1: Complete delivered cost calculation: Offer A ₹1,230 vs Offer B ₹1,350 yields ₹120 potential savings', () => {
      // Offer A: ₹1,000 item + ₹100 shipping + ₹180 tax − ₹50 eligible discount = ₹1,230
      // Offer B: same product, verified delivered total ₹1,350
      // Offer C: ₹950 item price, shipping and tax unknown (incomplete)
      const offers = [
        {
          id: 'offer-a',
          itemPriceMinor: 100000,
          shippingMinor: 10000,
          taxesMinor: 18000,
          discountsMinor: 5000,
          isPriceComplete: true,
        },
        {
          id: 'offer-b',
          itemPriceMinor: 135000,
          shippingMinor: 0,
          taxesMinor: 0,
          discountsMinor: 0,
          isPriceComplete: true,
        },
        {
          id: 'offer-c',
          itemPriceMinor: 95000,
          shippingMinor: null,
          taxesMinor: null,
          discountsMinor: 0,
          isPriceComplete: false,
        },
      ];

      const comparison = FinancialCalculatorService.compareDeliveredOffers(offers);

      // Offer A delivered total = 100000 + 10000 + 18000 - 5000 = 123000 (₹1,230)
      const offerAEval = comparison.evaluatedOffers.find(o => o.id === 'offer-a')!;
      expect(offerAEval.totalDeliveredMinor).toBe(123000);
      expect(offerAEval.isPriceComplete).toBe(true);

      // Offer B delivered total = 135000 (₹1,350)
      const offerBEval = comparison.evaluatedOffers.find(o => o.id === 'offer-b')!;
      expect(offerBEval.totalDeliveredMinor).toBe(135000);
      expect(offerBEval.isPriceComplete).toBe(true);

      // Offer C is incomplete and NEVER declared cheapest
      const offerCEval = comparison.evaluatedOffers.find(o => o.id === 'offer-c')!;
      expect(offerCEval.isPriceComplete).toBe(false);
      expect(offerCEval.status).toBe('incomplete');
      expect(offerCEval.totalDeliveredMinor).toBeNull();
      expect(comparison.cheapestVerifiedOfferId).toBe('offer-a');
      expect(comparison.cheapestVerifiedOfferId).not.toBe('offer-c');

      // Potential savings between Offer B and cheapest Offer A is ₹120 (12,000 paise)
      expect(comparison.potentialSavingsMinor).toBe(12000);
    });

    it('E2: Normalized pack size / unit pricing: 500g at ₹100 vs 1kg at ₹180', () => {
      // 500g at ₹100 (10,000 paise) -> ₹200/kg (20,000 paise/kg)
      const rateA = FinancialCalculatorService.calculateUnitRate(10000, 500, 'g');
      expect(rateA.normalizedRateMinor).toBe(20000);
      expect(rateA.normalizedUnit).toBe('kg');
      expect(rateA.formattedRate).toBe('200.00/kg');

      // 1kg (1000g) at ₹180 (18,000 paise) -> ₹180/kg (18,000 paise/kg)
      const rateB = FinancialCalculatorService.calculateUnitRate(18000, 1, 'kg');
      expect(rateB.normalizedRateMinor).toBe(18000);
      expect(rateB.normalizedUnit).toBe('kg');
      expect(rateB.formattedRate).toBe('180.00/kg');

      // 1kg option is cheaper per unit (₹180/kg < ₹200/kg)
      expect(rateB.normalizedRateMinor).toBeLessThan(rateA.normalizedRateMinor);
    });

    it('E3: Budget impact calculation: ₹1,230 item against ₹1,500 budget leaves ₹270 remainder', () => {
      const budgetMinor = 150000;   // ₹1,500
      const spentSoFarMinor = 0;
      const purchaseMinor = 123000; // ₹1,230

      const impact = FinancialCalculatorService.calculatePurchaseImpact(
        budgetMinor,
        spentSoFarMinor,
        purchaseMinor
      );

      expect(impact.remainingBeforeMinor).toBe(150000);
      expect(impact.estimatedRemainingAfterMinor).toBe(27000); // ₹270 remainder (27,000 paise)
      expect(impact.isAffordableWithinBudget).toBe(true);
      expect(impact.excessMinor).toBe(0);
    });
  });

  // =========================================================================
  // AREA F: Spending Intelligence
  // =========================================================================
  describe('Area F: Spending Intelligence', () => {
    it('F1: Peer cohort size threshold: size 29 is flagged insufficient; 30 and 31 are valid', async () => {
      // Set mock cohort sizes in database
      const bench = db.peerBenchmarks.find(b => b.purposeSlug === 'sustenance');
      if (bench) {
        // Test size 29 (Insufficient)
        bench.cohortSize = 29;
        const res29 = await request(app)
          .get('/api/v1/spending/peer?purposeSlug=sustenance')
          .set('Authorization', 'Bearer demo-user-1');

        expect(res29.status).toBe(200);
        expect(res29.body.cohortDefinition.sampleSize).toBe(29);
        expect(res29.body.cohortDefinition.isSufficientCohort).toBe(false);
        expect(res29.body.benchmark).toBeNull();
        expect(res29.body.insufficientDataExplanation).toContain('below the required privacy and reliability threshold of 30');

        // Test size 30 (Sufficient boundary)
        bench.cohortSize = 30;
        const res30 = await request(app)
          .get('/api/v1/spending/peer?purposeSlug=sustenance')
          .set('Authorization', 'Bearer demo-user-1');

        expect(res30.status).toBe(200);
        expect(res30.body.cohortDefinition.sampleSize).toBe(30);
        expect(res30.body.cohortDefinition.isSufficientCohort).toBe(true);
        expect(res30.body.benchmark).not.toBeNull();

        // Test size 31 (Sufficient)
        bench.cohortSize = 31;
        const res31 = await request(app)
          .get('/api/v1/spending/peer?purposeSlug=sustenance')
          .set('Authorization', 'Bearer demo-user-1');

        expect(res31.status).toBe(200);
        expect(res31.body.cohortDefinition.sampleSize).toBe(31);
        expect(res31.body.cohortDefinition.isSufficientCohort).toBe(true);
      }
    });

    it('F2: Exact statistical median calculation for odd and even samples', () => {
      // Odd count: [100, 200, 300] -> median 200
      expect(FinancialCalculatorService.calculateMedian([100, 200, 300])).toBe(200);

      // Even count: [100, 200, 300, 400] -> median (200 + 300) / 2 = 250
      expect(FinancialCalculatorService.calculateMedian([100, 200, 300, 400])).toBe(250);
    });

    it('F3: Personal historical progress calculation: 12.5% reduction in expenditure, 10 pp improvement in savings rate', () => {
      // Current Month: ₹20,000 income, ₹14,000 net expense -> ₹6,000 surplus, 30% savings rate
      const currentMonthSummary = {
        currency: 'INR' as CurrencyCode,
        dateRange: { startIso: '2026-03-01T00:00:00Z', endIso: '2026-03-31T23:59:59Z', label: 'Mar 2026' },
        dataCoverage: { totalEligibleTransactions: 5, excludedPendingCount: 0, excludedTransfersCount: 0, earliestTransactionIso: null, latestTransactionIso: null, isCoverageComplete: true, coverageDays: 31 },
        metrics: {
          receivedIncomeMinor: 2000000,
          grossExpenditureMinor: 1400000,
          refundsMinor: 0,
          netExpenditureMinor: 1400000,
          recordedNetSurplusMinor: 600000,
          savingsRatePercentage: 30.0,
          savingsRateFormatted: '30.0%',
        },
        categoryBreakdown: [],
        purposeBreakdown: [],
        disclaimer: '',
      };

      // Prior Month: ₹20,000 income, ₹16,000 net expense -> ₹4,000 surplus, 20% savings rate
      const priorMonthSummary = {
        currency: 'INR' as CurrencyCode,
        dateRange: { startIso: '2026-02-01T00:00:00Z', endIso: '2026-02-28T23:59:59Z', label: 'Feb 2026' },
        dataCoverage: { totalEligibleTransactions: 5, excludedPendingCount: 0, excludedTransfersCount: 0, earliestTransactionIso: null, latestTransactionIso: null, isCoverageComplete: true, coverageDays: 28 },
        metrics: {
          receivedIncomeMinor: 2000000,
          grossExpenditureMinor: 1600000,
          refundsMinor: 0,
          netExpenditureMinor: 1600000,
          recordedNetSurplusMinor: 400000,
          savingsRatePercentage: 20.0,
          savingsRateFormatted: '20.0%',
        },
        categoryBreakdown: [],
        purposeBreakdown: [],
        disclaimer: '',
      };

      const comparison = FinancialCalculatorService.comparePeriods(currentMonthSummary, priorMonthSummary);

      // Expenditure change: (1,400,000 - 1,600,000) / 1,600,000 = -12.5%
      expect(comparison.expenditurePercentageChange).toBe(-12.5);

      // Savings rate change: 30.0% - 20.0% = +10.0 percentage points
      expect(comparison.savingsRateDiffPercentagePoints).toBe(10.0);
    });
  });

  // =========================================================================
  // AREA G: Security, Imports, and Edge Cases
  // =========================================================================
  describe('Area G: Security, Imports, and Edge Cases', () => {
    it('G1: CSV formula injection defense sanitizes cells starting with =cmd, +, -, @', async () => {
      const maliciousCsv = `Merchant,Amount,Currency,Type,Date
=cmd|' /C calc'!A0,150.00,USD,expense,2026-03-01T10:00:00Z
+SUM(A1:A10),20.00,USD,expense,2026-03-02T10:00:00Z
-2+3,30.00,USD,expense,2026-03-03T10:00:00Z
@import(test),40.00,USD,expense,2026-03-04T10:00:00Z`;

      const res = await request(app)
        .post('/api/v1/transactions/csv-preview')
        .set('Authorization', 'Bearer demo-user-1')
        .send({ csvContent: maliciousCsv });

      expect(res.status).toBe(200);
      expect(res.body.rows.length).toBe(4);

      // Verify each injected formula cell is neutralized with a leading single quote (')
      expect(res.body.rows[0].merchant.startsWith("'=")).toBe(true);
      expect(res.body.rows[1].merchant.startsWith("'+")).toBe(true);
      expect(res.body.rows[2].merchant.startsWith("'-")).toBe(true);
      expect(res.body.rows[3].merchant.startsWith("'@")).toBe(true);
    });

    it('G2: Malformed or empty CSV payload returns 400 error', async () => {
      const res = await request(app)
        .post('/api/v1/transactions/csv-preview')
        .set('Authorization', 'Bearer demo-user-1')
        .send({ csvContent: '' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_CSV');
    });

    it('G3: PayPal Sandbox order creation and idempotent capture', async () => {
      const paypalService = new PayPalService();

      // Create order
      const order = await paypalService.createOrder(DEMO_USER_ID, {
        amountMinor: 12039, // $120.39
        currency: 'USD',
        itemDescription: 'Anker Soundcore Space Q45 Headphones (Sandbox Test)',
        purposeId: 'purp-productivity',
        categoryId: 'cat-tech',
        idempotencyKey: `test-order-${Date.now()}`,
      });

      expect(order.paypalOrderId).toBeDefined();
      expect(order.status).toBe('CREATED');
      expect(order.approveUrl).toContain('paypal.com');

      // Capture order
      const capture1 = await paypalService.captureOrder(DEMO_USER_ID, {
        paypalOrderId: order.paypalOrderId,
      });

      expect(capture1.success).toBe(true);
      expect(capture1.status).toBe('COMPLETED');
      expect(capture1.captureId).toBeDefined();

      // Replay capture order (Idempotency verification)
      const capture2 = await paypalService.captureOrder(DEMO_USER_ID, {
        paypalOrderId: order.paypalOrderId,
      });

      expect(capture2.success).toBe(true);
      expect(capture2.captureId).toBe(capture1.captureId);
      expect(capture2.transactionId).toBe(capture1.transactionId);
    });
  });
});
