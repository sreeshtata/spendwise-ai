import { describe, it, expect } from 'vitest';
import { FinancialCalculatorService } from '../src/services/financial-calculator.service.js';
import { Transaction } from '@spendwise/contracts';

describe('FinancialCalculatorService', () => {
  const mockUserId = '11111111-1111-1111-1111-111111111111';

  it('calculates net expenditure and excludes pending and transfer transactions', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        userId: mockUserId,
        amountMinor: 500000, // $5,000 income
        currency: 'USD',
        transactionType: 'income',
        status: 'completed',
        merchant: 'Employer Corp',
        occurredAt: '2024-03-01T10:00:00Z',
        source: 'manual',
        createdAt: '2024-03-01T10:00:00Z',
        updatedAt: '2024-03-01T10:00:00Z',
      },
      {
        id: 'tx-2',
        userId: mockUserId,
        amountMinor: 100000, // $1,000 grocery expense
        currency: 'USD',
        transactionType: 'expense',
        status: 'completed',
        categoryId: 'cat-groceries',
        categoryName: 'Groceries',
        merchant: 'Supermarket',
        occurredAt: '2024-03-05T12:00:00Z',
        source: 'manual',
        createdAt: '2024-03-05T12:00:00Z',
        updatedAt: '2024-03-05T12:00:00Z',
      },
      {
        id: 'tx-3',
        userId: mockUserId,
        amountMinor: 20000, // $200 refund on groceries
        currency: 'USD',
        transactionType: 'refund',
        status: 'completed',
        categoryId: 'cat-groceries',
        categoryName: 'Groceries',
        merchant: 'Supermarket Refund',
        occurredAt: '2024-03-06T14:00:00Z',
        source: 'manual',
        createdAt: '2024-03-06T14:00:00Z',
        updatedAt: '2024-03-06T14:00:00Z',
      },
      {
        id: 'tx-4',
        userId: mockUserId,
        amountMinor: 50000, // $500 pending purchase (MUST be excluded)
        currency: 'USD',
        transactionType: 'expense',
        status: 'pending',
        merchant: 'Pending Store',
        occurredAt: '2024-03-07T10:00:00Z',
        source: 'manual',
        createdAt: '2024-03-07T10:00:00Z',
        updatedAt: '2024-03-07T10:00:00Z',
      },
      {
        id: 'tx-5',
        userId: mockUserId,
        amountMinor: 80000, // $800 transfer to savings (MUST be excluded from expenses)
        currency: 'USD',
        transactionType: 'transfer',
        status: 'completed',
        merchant: 'Transfer to High Yield Savings',
        occurredAt: '2024-03-08T10:00:00Z',
        source: 'manual',
        createdAt: '2024-03-08T10:00:00Z',
        updatedAt: '2024-03-08T10:00:00Z',
      },
    ];

    const summary = FinancialCalculatorService.calculateSummary(transactions, 'USD', {
      start: new Date('2024-03-01T00:00:00Z'),
      end: new Date('2024-03-31T23:59:59Z'),
      label: 'March 2024',
    });

    // Received Income: $5,000 (500000)
    expect(summary.metrics.receivedIncomeMinor).toBe(500000);
    // Gross Expense: $1,000 (100000), Refund: $200 (20000) -> Net Expense: $800 (80000)
    expect(summary.metrics.grossExpenditureMinor).toBe(100000);
    expect(summary.metrics.refundsMinor).toBe(20000);
    expect(summary.metrics.netExpenditureMinor).toBe(80000);
    // Surplus: $5,000 - $800 = $4,200 (420000)
    expect(summary.metrics.recordedNetSurplusMinor).toBe(420000);
    // Savings Rate: 4200 / 5000 = 84%
    expect(summary.metrics.savingsRatePercentage).toBe(84);
    expect(summary.metrics.savingsRateFormatted).toBe('84.0%');

    // Confirm exclusions
    expect(summary.dataCoverage.excludedPendingCount).toBe(1);
    expect(summary.dataCoverage.excludedTransfersCount).toBe(1);
    expect(summary.dataCoverage.totalEligibleTransactions).toBe(3);
  });

  it('displays "Not available" and null savings rate when income is zero', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-exp-only',
        userId: mockUserId,
        amountMinor: 15000, // $150
        currency: 'USD',
        transactionType: 'expense',
        status: 'completed',
        merchant: 'Coffee Shop',
        occurredAt: '2024-03-10T09:00:00Z',
        source: 'manual',
        createdAt: '2024-03-10T09:00:00Z',
        updatedAt: '2024-03-10T09:00:00Z',
      },
    ];

    const summary = FinancialCalculatorService.calculateSummary(transactions, 'USD', {
      start: new Date('2024-03-01T00:00:00Z'),
      end: new Date('2024-03-31T23:59:59Z'),
      label: 'March 2024',
    });

    expect(summary.metrics.receivedIncomeMinor).toBe(0);
    expect(summary.metrics.netExpenditureMinor).toBe(15000);
    expect(summary.metrics.savingsRatePercentage).toBeNull();
    expect(summary.metrics.savingsRateFormatted).toBe('Not available');
  });

  it('strictly segregates currencies and excludes non-target currency', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-usd',
        userId: mockUserId,
        amountMinor: 10000, // $100 USD
        currency: 'USD',
        transactionType: 'expense',
        status: 'completed',
        merchant: 'US Merchant',
        occurredAt: '2024-03-10T09:00:00Z',
        source: 'manual',
        createdAt: '2024-03-10T09:00:00Z',
        updatedAt: '2024-03-10T09:00:00Z',
      },
      {
        id: 'tx-eur',
        userId: mockUserId,
        amountMinor: 5000, // €50 EUR (Different currency)
        currency: 'EUR',
        transactionType: 'expense',
        status: 'completed',
        merchant: 'European Store',
        occurredAt: '2024-03-10T09:00:00Z',
        source: 'manual',
        createdAt: '2024-03-10T09:00:00Z',
        updatedAt: '2024-03-10T09:00:00Z',
      },
    ];

    const usdSummary = FinancialCalculatorService.calculateSummary(transactions, 'USD', {
      start: new Date('2024-03-01T00:00:00Z'),
      end: new Date('2024-03-31T23:59:59Z'),
      label: 'March 2024 USD',
    });

    // Should only have 1 eligible transaction, €50 EUR is NOT mixed in
    expect(usdSummary.dataCoverage.totalEligibleTransactions).toBe(1);
    expect(usdSummary.metrics.grossExpenditureMinor).toBe(10000);
  });

  it('calculates budget utilization and warning thresholds accurately', () => {
    // Normal: 50%
    const res1 = FinancialCalculatorService.calculateBudgetUtilisation(100000, 50000);
    expect(res1.utilisationPercentage).toBe(50);
    expect(res1.remainingBudgetMinor).toBe(50000);
    expect(res1.cautionLevel).toBe('normal');

    // Warning: 88%
    const res2 = FinancialCalculatorService.calculateBudgetUtilisation(100000, 88000);
    expect(res2.utilisationPercentage).toBe(88);
    expect(res2.remainingBudgetMinor).toBe(12000);
    expect(res2.cautionLevel).toBe('warning');

    // Exceeded: 110%
    const res3 = FinancialCalculatorService.calculateBudgetUtilisation(100000, 110000);
    expect(res3.utilisationPercentage).toBe(110);
    expect(res3.remainingBudgetMinor).toBe(-10000);
    expect(res3.cautionLevel).toBe('exceeded');
    expect(res3.isOverBudget).toBe(true);
  });

  it('calculates purchase immediate effect on remaining budget', () => {
    const budgetMinor = 50000; // $500
    const spentSoFarMinor = 30000; // $300
    const purchaseCostMinor = 15000; // $150

    const impact = FinancialCalculatorService.calculatePurchaseImpact(budgetMinor, spentSoFarMinor, purchaseCostMinor);
    expect(impact.remainingBeforeMinor).toBe(20000); // $200
    expect(impact.estimatedRemainingAfterMinor).toBe(5000); // $50
    expect(impact.isAffordableWithinBudget).toBe(true);
    expect(impact.excessMinor).toBe(0);

    const overPurchaseCostMinor = 25000; // $250
    const overImpact = FinancialCalculatorService.calculatePurchaseImpact(budgetMinor, spentSoFarMinor, overPurchaseCostMinor);
    expect(overImpact.estimatedRemainingAfterMinor).toBe(-5000); // -$50
    expect(overImpact.isAffordableWithinBudget).toBe(false);
    expect(overImpact.excessMinor).toBe(5000);
  });
});
