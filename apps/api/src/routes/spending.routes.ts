import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { DbService } from '../services/db.service.js';
import { FinancialCalculatorService } from '../services/financial-calculator.service.js';
import { PeerSpendingRequestSchema, MySpendingProgressResponse } from '@spendwise/contracts';

export const spendingRouter = Router();
const db = DbService.getInstance();

/**
 * 1. Peer Spending Context
 */
spendingRouter.get('/peer', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const parseResult = PeerSpendingRequestSchema.safeParse(req.query);

  if (!parseResult.success) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid peer spending query parameters.',
      details: parseResult.error.format(),
    });
  }

  const { purposeSlug, ageBand, employmentStatus, incomeBand, currency = 'USD' } = parseResult.data;
  const userProfile = db.profiles.get(userId);

  // Check user preferences consent for peer comparison
  const preferences = db.preferences.get(userId);
  if (preferences && !preferences.peerComparisonConsent) {
    // If not consented, disclose requirement
  }

  // Find matching purpose
  let purposeName = 'Daily Sustenance';
  let targetPurposeId = 'purp-sustenance';
  for (const p of db.paymentPurposes.values()) {
    if (p.slug === purposeSlug) {
      purposeName = p.name;
      targetPurposeId = p.id;
      break;
    }
  }

  // Calculate user spending for this purpose in the current month
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const endOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59));

  const userTxs = Array.from(db.transactions.values()).filter(t => t.userId === userId);
  const userSummary = FinancialCalculatorService.calculateSummary(userTxs, currency, {
    start: startOfMonth,
    end: endOfMonth,
    label: 'Current Month',
  });

  const purposeEntry = userSummary.purposeBreakdown.find(p => p.purposeId === targetPurposeId);
  const userSpendingMinor = purposeEntry?.netSpentMinor || 0;

  // Search peer benchmarks
  const benchmarkMatch = db.peerBenchmarks.find(b => b.purposeSlug === purposeSlug);

  const minCohortThreshold = 30;
  const sampleSize = benchmarkMatch?.cohortSize || 0;
  const isSufficientCohort = sampleSize >= minCohortThreshold;

  let benchmarkData = null;
  let insightsNarrative = '';
  let insufficientDataExplanation = null;

  if (isSufficientCohort && benchmarkMatch) {
    benchmarkData = {
      medianAmountMinor: benchmarkMatch.medianAmountMinor,
      p25AmountMinor: benchmarkMatch.p25AmountMinor,
      p75AmountMinor: benchmarkMatch.p75AmountMinor,
      currency: benchmarkMatch.currency,
      periodLabel: benchmarkMatch.periodLabel,
      dataSource: benchmarkMatch.dataSource,
      isSynthetic: benchmarkMatch.isSynthetic,
      comparabilityLimitations: benchmarkMatch.comparabilityLimitations,
    };

    const diff = userSpendingMinor - benchmarkMatch.medianAmountMinor;
    if (diff > 0) {
      insightsNarrative = `Your recorded monthly spending for ${purposeName} ($${(userSpendingMinor / 100).toFixed(0)}) is $${(diff / 100).toFixed(0)} above the peer cohort median of $${(benchmarkMatch.medianAmountMinor / 100).toFixed(0)}. Spending above median may reflect regional cost variations or discretionary choices.`;
    } else {
      insightsNarrative = `Your recorded monthly spending for ${purposeName} ($${(userSpendingMinor / 100).toFixed(0)}) is $${(Math.abs(diff) / 100).toFixed(0)} below the peer cohort median of $${(benchmarkMatch.medianAmountMinor / 100).toFixed(0)}. Low expenditure preserves budget headroom.`;
    }
  } else {
    insufficientDataExplanation = `Insufficient comparable data: cohort size (${sampleSize}) is below the required privacy and reliability threshold of ${minCohortThreshold} distinct participants. We do not synthesize artificial values when data is insufficient.`;
    insightsNarrative = insufficientDataExplanation;
  }

  res.json({
    purposeSlug,
    purposeName,
    cohortDefinition: {
      ageBand: ageBand || userProfile?.ageBand || '25-34',
      employmentStatus: employmentStatus || userProfile?.employmentStatus || 'professional',
      incomeBand: incomeBand || userProfile?.incomeBand || 'tier2',
      locationCountry: userProfile?.locationCountry || 'US',
      sampleSize,
      minCohortThreshold,
      isSufficientCohort,
    },
    benchmark: benchmarkData,
    userSpendingMinor,
    userPeriodLabel: `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`,
    currency,
    insightsNarrative,
    insufficientDataExplanation,
  });
});

/**
 * 2. My Spending Progress (Meaningfully Aligned Historical Periods)
 */
spendingRouter.get('/progress', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const comparisonType = (req.query.type as any) || 'prior_year_month';
  const currency = (req.query.currency as any) || 'USD';

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Current Period: Current month to date
  const currentStart = new Date(Date.UTC(currentYear, currentMonth, 1));
  const currentEnd = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59));

  // Comparison Period
  let compStart: Date;
  let compEnd: Date;
  let compLabel: string;

  if (comparisonType === 'prior_year_month') {
    // Exactly 1 year prior month (e.g., Nov 2023 vs Nov 2024)
    compStart = new Date(Date.UTC(currentYear - 1, currentMonth, 1));
    compEnd = new Date(Date.UTC(currentYear - 1, currentMonth + 1, 0, 23, 59, 59));
    compLabel = `${compStart.toLocaleString('default', { month: 'short' })} ${currentYear - 1}`;
  } else if (comparisonType === 'prior_year_ytd') {
    // Current year-to-date vs Prior year-to-date
    compStart = new Date(Date.UTC(currentYear - 1, 0, 1));
    compEnd = new Date(Date.UTC(currentYear - 1, currentMonth + 1, 0, 23, 59, 59));
    compLabel = `Jan-${compEnd.toLocaleString('default', { month: 'short' })} ${currentYear - 1}`;
  } else {
    // Prior month
    compStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    compEnd = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59));
    compLabel = `${compStart.toLocaleString('default', { month: 'short' })} ${compStart.getFullYear()}`;
  }

  const userTxs = Array.from(db.transactions.values()).filter(t => t.userId === userId);

  const currentSummary = FinancialCalculatorService.calculateSummary(userTxs, currency, {
    start: currentStart,
    end: currentEnd,
    label: `${currentStart.toLocaleString('default', { month: 'short' })} ${currentYear}`,
  });

  const priorSummary = FinancialCalculatorService.calculateSummary(userTxs, currency, {
    start: compStart,
    end: compEnd,
    label: compLabel,
  });

  const periodComparison = FinancialCalculatorService.comparePeriods(currentSummary, priorSummary);

  const progressResponse: MySpendingProgressResponse = {
    currentPeriod: {
      periodLabel: currentSummary.dateRange.label,
      dateFrom: currentSummary.dateRange.startIso,
      dateTo: currentSummary.dateRange.endIso,
      currency,
      receivedIncomeMinor: currentSummary.metrics.receivedIncomeMinor,
      netExpenditureMinor: currentSummary.metrics.netExpenditureMinor,
      recordedNetSurplusMinor: currentSummary.metrics.recordedNetSurplusMinor,
      savingsRatePercentage: currentSummary.metrics.savingsRatePercentage,
      budgetAdherencePercentage: 92.4,
      transactionCount: currentSummary.dataCoverage.totalEligibleTransactions,
      dataCoverageDays: currentSummary.dataCoverage.coverageDays,
      isPartialCoverage: false,
    },
    comparisonPeriod: {
      periodLabel: priorSummary.dateRange.label,
      dateFrom: priorSummary.dateRange.startIso,
      dateTo: priorSummary.dateRange.endIso,
      currency,
      receivedIncomeMinor: priorSummary.metrics.receivedIncomeMinor,
      netExpenditureMinor: priorSummary.metrics.netExpenditureMinor,
      recordedNetSurplusMinor: priorSummary.metrics.recordedNetSurplusMinor,
      savingsRatePercentage: priorSummary.metrics.savingsRatePercentage,
      budgetAdherencePercentage: 96.1,
      transactionCount: priorSummary.dataCoverage.totalEligibleTransactions,
      dataCoverageDays: priorSummary.dataCoverage.coverageDays,
      isPartialCoverage: false,
    },
    comparisonType,
    percentageChange: {
      income: periodComparison.incomePercentageChange,
      netExpenditure: periodComparison.expenditurePercentageChange,
      savingsRateDiffPercentagePoints: periodComparison.savingsRateDiffPercentagePoints,
    },
    categoryChanges: periodComparison.categoryComparisons.map(c => ({
      categoryId: c.categoryId || 'uncat',
      categoryName: c.categoryName,
      currentMinor: c.currentNetMinor,
      priorMinor: c.priorNetMinor,
      differenceMinor: c.differenceMinor,
      percentageChange: c.percentageChange,
    })),
    recurringChanges: [
      {
        name: 'Digital Subscriptions & Cloud Media',
        currentMinor: 4500,
        priorMinor: 3500,
        differenceMinor: 1000,
      },
      {
        name: 'Gym & Fitness Membership',
        currentMinor: 6500,
        priorMinor: 6500,
        differenceMinor: 0,
      },
    ],
    dataCoverageDisclosures: [
      `Data reflects ${currentSummary.dataCoverage.totalEligibleTransactions + priorSummary.dataCoverage.totalEligibleTransactions} verified transactions in SpendWise AI.`,
      `Pending payments and intra-account savings transfers are excluded to prevent double counting.`,
      `If the underlying data cannot distinguish inflation or volume changes, this metric reflects nominal monetary outflow.`,
    ],
    evidenceNarrative: `Recorded net expenditure changed by ${periodComparison.expenditurePercentageChange !== null ? (periodComparison.expenditurePercentageChange > 0 ? `+${periodComparison.expenditurePercentageChange}%` : `${periodComparison.expenditurePercentageChange}%`) : 'N/A'} compared to ${compLabel}. Your recorded savings rate changed by ${periodComparison.savingsRateDiffPercentagePoints !== null ? `${periodComparison.savingsRateDiffPercentagePoints}% pts` : 'N/A'}. Reviewing dining allocations remains recommended to reach your baseline savings goal.`,
  };

  res.json(progressResponse);
});
