/**
 * SpendWise AI — Shared Financial Calculation Service
 * 
 * Single source of truth for all financial math across the system.
 * Follows exact accounting rules:
 * - Operates entirely in integer minor units (e.g. cents/paise). Never floating-point money.
 * - Only 'completed' transactions are counted; excludes pending, failed, cancelled.
 * - 'transfer' transactions are completely excluded from both income and expenditure.
 * - 'income' transactions count toward receivedIncome. (Expected income is kept separate).
 * - 'expense' transactions count toward gross expenditure.
 * - 'refund' transactions reduce expenditure in the reporting period of the refund date.
 * - Net Expenditure = Gross Completed Expenses - Completed Refunds.
 * - Recorded Net Surplus = Received Income - Net Expenditure.
 * - Savings Rate = Recorded Net Surplus / Received Income (when Received Income > 0, else null / undefined).
 * - Budget Utilisation = Realised Net Expenditure in category / Allocated Budget.
 * - Remaining Budget = Allocated Budget - Realised Net Expenditure.
 * - Multi-currency sums are strictly forbidden without explicit conversion; transactions in different currencies are segregated.
 */

import { Transaction, CurrencyCode } from '@spendwise/contracts';

export interface CalculationDateRange {
  start: Date;
  end: Date;
  label: string;
}

export interface FinancialSummaryResult {
  currency: CurrencyCode;
  dateRange: {
    startIso: string;
    endIso: string;
    label: string;
  };
  dataCoverage: {
    totalEligibleTransactions: number;
    excludedPendingCount: number;
    excludedTransfersCount: number;
    excludedFailedCount?: number;
    earliestTransactionIso: string | null;
    latestTransactionIso: string | null;
    isCoverageComplete: boolean;
    coverageDays: number;
  };
  metrics: {
    receivedIncomeMinor: number;
    grossExpenditureMinor: number;
    refundsMinor: number;
    netExpenditureMinor: number;
    recordedNetSurplusMinor: number;
    savingsRatePercentage: number | null; // null if income <= 0
    savingsRateFormatted: string; // e.g. "24.5%" or "Not available"
  };
  categoryBreakdown: Array<{
    categoryId: string | null;
    categoryName: string;
    netSpentMinor: number;
    transactionCount: number;
    percentageOfExpenditure: number;
  }>;
  purposeBreakdown: Array<{
    purposeId: string | null;
    purposeName: string;
    netSpentMinor: number;
    transactionCount: number;
    percentageOfExpenditure: number;
  }>;
  disclaimer: string;
}

export class FinancialCalculatorService {
  /**
   * Filter transactions strictly by currency and completion status.
   * Throws an error if currency mismatch is detected in an unhandled list.
   */
  public static filterEligibleTransactions(
    transactions: Transaction[],
    targetCurrency: CurrencyCode,
    startDate?: Date,
    endDate?: Date
  ): {
    eligible: Transaction[];
    excludedPending: Transaction[];
    excludedTransfers: Transaction[];
    excludedFailed: Transaction[];
    excludedCurrencyMismatch: Transaction[];
  } {
    const eligible: Transaction[] = [];
    const excludedPending: Transaction[] = [];
    const excludedTransfers: Transaction[] = [];
    const excludedFailed: Transaction[] = [];
    const excludedCurrencyMismatch: Transaction[] = [];

    for (const tx of transactions) {
      if (tx.currency !== targetCurrency) {
        excludedCurrencyMismatch.push(tx);
        continue;
      }

      const txDate = new Date(tx.occurredAt);
      if (startDate && txDate < startDate) continue;
      if (endDate && txDate > endDate) continue;

      if (tx.status === 'pending') {
        excludedPending.push(tx);
        continue;
      }

      if (tx.status === 'failed' || tx.status === 'cancelled') {
        excludedFailed.push(tx);
        continue;
      }

      if (tx.transactionType === 'transfer') {
        excludedTransfers.push(tx);
        continue;
      }

      eligible.push(tx);
    }

    return { eligible, excludedPending, excludedTransfers, excludedFailed, excludedCurrencyMismatch };
  }

  /**
   * Compute comprehensive financial metrics for a specific currency and date boundary.
   */
  public static calculateSummary(
    transactions: Transaction[],
    currency: CurrencyCode,
    dateRange: CalculationDateRange
  ): FinancialSummaryResult {
    const { eligible, excludedPending, excludedTransfers, excludedFailed } = this.filterEligibleTransactions(
      transactions,
      currency,
      dateRange.start,
      dateRange.end
    );

    let receivedIncomeMinor = 0;
    let grossExpenditureMinor = 0;
    let refundsMinor = 0;

    const categoryMap = new Map<string, { name: string; amount: number; count: number }>();
    const purposeMap = new Map<string, { name: string; amount: number; count: number }>();

    let earliestDate: Date | null = null;
    let latestDate: Date | null = null;

    for (const tx of eligible) {
      const txDate = new Date(tx.occurredAt);
      if (!earliestDate || txDate < earliestDate) earliestDate = txDate;
      if (!latestDate || txDate > latestDate) latestDate = txDate;

      if (tx.transactionType === 'income') {
        receivedIncomeMinor += tx.amountMinor;
      } else if (tx.transactionType === 'expense') {
        grossExpenditureMinor += tx.amountMinor;

        // Tally category
        const catKey = tx.categoryId || 'uncategorized';
        const catName = tx.categoryName || 'Uncategorized';
        const catData = categoryMap.get(catKey) || { name: catName, amount: 0, count: 0 };
        catData.amount += tx.amountMinor;
        catData.count += 1;
        categoryMap.set(catKey, catData);

        // Tally purpose
        const purpKey = tx.purposeId || 'general';
        const purpName = tx.purposeName || 'General Purpose';
        const purpData = purposeMap.get(purpKey) || { name: purpName, amount: 0, count: 0 };
        purpData.amount += tx.amountMinor;
        purpData.count += 1;
        purposeMap.set(purpKey, purpData);
      } else if (tx.transactionType === 'refund') {
        refundsMinor += tx.amountMinor;

        // Refund offsets category expenditure in period
        const catKey = tx.categoryId || 'uncategorized';
        if (categoryMap.has(catKey)) {
          categoryMap.get(catKey)!.amount -= tx.amountMinor;
        }

        const purpKey = tx.purposeId || 'general';
        if (purposeMap.has(purpKey)) {
          purposeMap.get(purpKey)!.amount -= tx.amountMinor;
        }
      }
    }

    const netExpenditureMinor = Math.max(0, grossExpenditureMinor - refundsMinor);
    const recordedNetSurplusMinor = receivedIncomeMinor - netExpenditureMinor;

    // Savings Rate = recordedNetSurplus / receivedIncome when receivedIncome > 0
    let savingsRatePercentage: number | null = null;
    let savingsRateFormatted = 'Not available';

    if (receivedIncomeMinor > 0) {
      const rawRate = (recordedNetSurplusMinor / receivedIncomeMinor) * 100;
      savingsRatePercentage = Math.round(rawRate * 100) / 100; // 2 decimal precision
      savingsRateFormatted = `${savingsRatePercentage.toFixed(1)}%`;
    }

    // Category breakdown
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([catId, data]) => {
      const netSpent = Math.max(0, data.amount);
      const percentageOfExpenditure = netExpenditureMinor > 0
        ? Math.round((netSpent / netExpenditureMinor) * 1000) / 10
        : 0;
      return {
        categoryId: catId === 'uncategorized' ? null : catId,
        categoryName: data.name,
        netSpentMinor: netSpent,
        transactionCount: data.count,
        percentageOfExpenditure,
      };
    }).sort((a, b) => b.netSpentMinor - a.netSpentMinor);

    // Purpose breakdown
    const purposeBreakdown = Array.from(purposeMap.entries()).map(([purpId, data]) => {
      const netSpent = Math.max(0, data.amount);
      const percentageOfExpenditure = netExpenditureMinor > 0
        ? Math.round((netSpent / netExpenditureMinor) * 1000) / 10
        : 0;
      return {
        purposeId: purpId === 'general' ? null : purpId,
        purposeName: data.name,
        netSpentMinor: netSpent,
        transactionCount: data.count,
        percentageOfExpenditure,
      };
    }).sort((a, b) => b.netSpentMinor - a.netSpentMinor);

    const diffDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));

    return {
      currency,
      dateRange: {
        startIso: dateRange.start.toISOString(),
        endIso: dateRange.end.toISOString(),
        label: dateRange.label,
      },
      dataCoverage: {
        totalEligibleTransactions: eligible.length,
        excludedPendingCount: excludedPending.length,
        excludedTransfersCount: excludedTransfers.length,
        excludedFailedCount: excludedFailed.length,
        earliestTransactionIso: earliestDate?.toISOString() || null,
        latestTransactionIso: latestDate?.toISOString() || null,
        isCoverageComplete: eligible.length > 0,
        coverageDays: diffDays,
      },
      metrics: {
        receivedIncomeMinor,
        grossExpenditureMinor,
        refundsMinor,
        netExpenditureMinor,
        recordedNetSurplusMinor,
        savingsRatePercentage,
        savingsRateFormatted,
      },
      categoryBreakdown,
      purposeBreakdown,
      disclaimer: 'These metrics reflect only transactions recorded within SpendWise AI and do not represent your total financial position or live PayPal account balance.',
    };
  }

  /**
   * Calculate budget utilization and remaining amount for an allocation.
   */
  public static calculateBudgetUtilisation(
    allocatedAmountMinor: number,
    realisedSpentMinor: number
  ): {
    utilisationPercentage: number;
    remainingBudgetMinor: number;
    isOverBudget: boolean;
    cautionLevel: 'normal' | 'warning' | 'exceeded';
  } {
    if (allocatedAmountMinor <= 0) {
      return {
        utilisationPercentage: realisedSpentMinor > 0 ? 100 : 0,
        remainingBudgetMinor: -realisedSpentMinor,
        isOverBudget: realisedSpentMinor > 0,
        cautionLevel: realisedSpentMinor > 0 ? 'exceeded' : 'normal',
      };
    }

    const utilisationPercentage = Math.round((realisedSpentMinor / allocatedAmountMinor) * 1000) / 10;
    const remainingBudgetMinor = allocatedAmountMinor - realisedSpentMinor;
    const isOverBudget = remainingBudgetMinor < 0;

    let cautionLevel: 'normal' | 'warning' | 'exceeded' = 'normal';
    if (isOverBudget) {
      cautionLevel = 'exceeded';
    } else if (utilisationPercentage >= 85) {
      cautionLevel = 'warning';
    }

    return {
      utilisationPercentage,
      remainingBudgetMinor,
      isOverBudget,
      cautionLevel,
    };
  }

  /**
   * Calculate purchase impact on remaining budget.
   * Total Delivered Cost = Item Subtotal + Shipping + Taxes + Mandatory Fees - Verified Discounts.
   */
  public static calculatePurchaseImpact(
    currentBudgetMinor: number,
    spentSoFarMinor: number,
    purchaseTotalDeliveredMinor: number
  ): {
    remainingBeforeMinor: number;
    estimatedRemainingAfterMinor: number;
    isAffordableWithinBudget: boolean;
    excessMinor: number;
  } {
    const remainingBeforeMinor = currentBudgetMinor - spentSoFarMinor;
    const estimatedRemainingAfterMinor = remainingBeforeMinor - purchaseTotalDeliveredMinor;
    const isAffordableWithinBudget = estimatedRemainingAfterMinor >= 0;
    const excessMinor = isAffordableWithinBudget ? 0 : Math.abs(estimatedRemainingAfterMinor);

    return {
      remainingBeforeMinor,
      estimatedRemainingAfterMinor,
      isAffordableWithinBudget,
      excessMinor,
    };
  }

  /**
   * Calculate period-over-period comparison metrics between current and prior period.
   */
  public static comparePeriods(
    current: FinancialSummaryResult,
    prior: FinancialSummaryResult
  ): {
    incomeChangeMinor: number;
    incomePercentageChange: number | null;
    expenditureChangeMinor: number;
    expenditurePercentageChange: number | null;
    surplusChangeMinor: number;
    savingsRateDiffPercentagePoints: number | null;
    categoryComparisons: Array<{
      categoryId: string | null;
      categoryName: string;
      currentNetMinor: number;
      priorNetMinor: number;
      differenceMinor: number;
      percentageChange: number | null;
    }>;
  } {
    const incomeChangeMinor = current.metrics.receivedIncomeMinor - prior.metrics.receivedIncomeMinor;
    const incomePercentageChange = prior.metrics.receivedIncomeMinor > 0
      ? Math.round(((incomeChangeMinor / prior.metrics.receivedIncomeMinor) * 100) * 10) / 10
      : null;

    const expenditureChangeMinor = current.metrics.netExpenditureMinor - prior.metrics.netExpenditureMinor;
    const expenditurePercentageChange = prior.metrics.netExpenditureMinor > 0
      ? Math.round(((expenditureChangeMinor / prior.metrics.netExpenditureMinor) * 100) * 10) / 10
      : null;

    const surplusChangeMinor = current.metrics.recordedNetSurplusMinor - prior.metrics.recordedNetSurplusMinor;

    const savingsRateDiffPercentagePoints = (current.metrics.savingsRatePercentage !== null && prior.metrics.savingsRatePercentage !== null)
      ? Math.round((current.metrics.savingsRatePercentage - prior.metrics.savingsRatePercentage) * 10) / 10
      : null;

    // Map all categories present in either period
    const allCatIds = new Set([
      ...current.categoryBreakdown.map(c => c.categoryId || 'uncategorized'),
      ...prior.categoryBreakdown.map(c => c.categoryId || 'uncategorized'),
    ]);

    const categoryComparisons = Array.from(allCatIds).map(catId => {
      const curCat = current.categoryBreakdown.find(c => (c.categoryId || 'uncategorized') === catId);
      const priCat = prior.categoryBreakdown.find(c => (c.categoryId || 'uncategorized') === catId);

      const currentNetMinor = curCat?.netSpentMinor || 0;
      const priorNetMinor = priCat?.netSpentMinor || 0;
      const differenceMinor = currentNetMinor - priorNetMinor;
      const categoryName = curCat?.categoryName || priCat?.categoryName || 'Uncategorized';

      const percentageChange = priorNetMinor > 0
        ? Math.round(((differenceMinor / priorNetMinor) * 100) * 10) / 10
        : null;

      return {
        categoryId: catId === 'uncategorized' ? null : catId,
        categoryName,
        currentNetMinor,
        priorNetMinor,
        differenceMinor,
        percentageChange,
      };
    }).sort((a, b) => Math.abs(b.differenceMinor) - Math.abs(a.differenceMinor));

    return {
      incomeChangeMinor,
      incomePercentageChange,
      expenditureChangeMinor,
      expenditurePercentageChange,
      surplusChangeMinor,
      savingsRateDiffPercentagePoints,
      categoryComparisons,
    };
  }

  /**
   * Calculate normalized unit rate (e.g. per kilogram or per unit) in minor units.
   * Example: 500g at ₹100 (10,000 paise) = ₹200/kg (20,000 paise/kg).
   * 1kg (1000g) at ₹180 (18,000 paise) = ₹180/kg (18,000 paise/kg).
   */
  public static calculateUnitRate(
    priceMinor: number,
    quantity: number,
    unit: 'g' | 'kg' | 'ml' | 'l' | 'item'
  ): {
    normalizedRateMinor: number;
    normalizedUnit: string;
    formattedRate: string;
  } {
    if (quantity <= 0) throw new Error('Quantity must be greater than zero');
    let normalizedRateMinor = priceMinor;
    let normalizedUnit: string = unit;

    if (unit === 'g') {
      normalizedRateMinor = Math.round((priceMinor / quantity) * 1000);
      normalizedUnit = 'kg';
    } else if (unit === 'kg') {
      normalizedRateMinor = Math.round(priceMinor / quantity);
      normalizedUnit = 'kg';
    } else if (unit === 'ml') {
      normalizedRateMinor = Math.round((priceMinor / quantity) * 1000);
      normalizedUnit = 'l';
    } else if (unit === 'l') {
      normalizedRateMinor = Math.round(priceMinor / quantity);
      normalizedUnit = 'l';
    } else {
      normalizedRateMinor = Math.round(priceMinor / quantity);
      normalizedUnit = 'unit';
    }

    return {
      normalizedRateMinor,
      normalizedUnit,
      formattedRate: `${(normalizedRateMinor / 100).toFixed(2)}/${normalizedUnit}`,
    };
  }

  /**
   * Compare delivered offers ensuring complete delivered cost transparency.
   * Total Delivered = itemPrice + shipping + taxes + mandatoryFees - eligibleDiscounts.
   * Incomplete offers (missing shipping or tax) are NEVER declared definitively cheapest.
   */
  public static compareDeliveredOffers(offers: Array<{
    id: string;
    itemPriceMinor: number;
    shippingMinor?: number | null;
    taxesMinor?: number | null;
    discountsMinor?: number | null;
    isPriceComplete: boolean;
  }>): {
    evaluatedOffers: Array<{
      id: string;
      totalDeliveredMinor: number | null;
      isPriceComplete: boolean;
      status: 'complete' | 'incomplete';
    }>;
    cheapestVerifiedOfferId: string | null;
    potentialSavingsMinor: number;
  } {
    const evaluated = offers.map(o => {
      if (!o.isPriceComplete || o.shippingMinor === undefined || o.shippingMinor === null || o.taxesMinor === undefined || o.taxesMinor === null) {
        return {
          id: o.id,
          totalDeliveredMinor: null,
          isPriceComplete: false,
          status: 'incomplete' as const,
        };
      }
      const total = (o.itemPriceMinor + (o.shippingMinor || 0) + (o.taxesMinor || 0)) - (o.discountsMinor || 0);
      return {
        id: o.id,
        totalDeliveredMinor: total,
        isPriceComplete: true,
        status: 'complete' as const,
      };
    });

    const completeOffers = evaluated.filter(o => o.isPriceComplete && o.totalDeliveredMinor !== null)
      .sort((a, b) => a.totalDeliveredMinor! - b.totalDeliveredMinor!);

    const cheapest = completeOffers[0] || null;
    let potentialSavings = 0;
    if (completeOffers.length > 1) {
      potentialSavings = completeOffers[1].totalDeliveredMinor! - completeOffers[0].totalDeliveredMinor!;
    }

    return {
      evaluatedOffers: evaluated,
      cheapestVerifiedOfferId: cheapest?.id || null,
      potentialSavingsMinor: potentialSavings,
    };
  }

  /**
   * Calculate exact statistical median of minor unit amounts.
   */
  public static calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 !== 0) {
      return sorted[mid];
    }
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
}
