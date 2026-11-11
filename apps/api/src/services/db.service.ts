/**
 * SpendWise AI — In-Memory & Supabase Database Service
 * Provides full deterministic 2-year fixtures and user-isolated CRUD.
 */

import {
  Profile,
  UserPreferences,
  Category,
  PaymentPurpose,
  Transaction,
  Budget,
  BudgetAllocationItem,
  BudgetRecommendationResponse,
  ProductOffer,
  PeerSpendingResponse,
} from '@spendwise/contracts';
import { v4 as uuidv4 } from 'uuid';

export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';
export const SECOND_USER_ID = '00000000-0000-0000-0000-000000000002';

export class DbService {
  private static instance: DbService;

  public profiles: Map<string, Profile> = new Map();
  public preferences: Map<string, UserPreferences> = new Map();
  public categories: Map<string, Category> = new Map();
  public paymentPurposes: Map<string, PaymentPurpose> = new Map();
  public transactions: Map<string, Transaction> = new Map();
  public budgets: Map<string, Budget> = new Map();
  public recommendations: Map<string, BudgetRecommendationResponse> = new Map();
  public recommendationFeedback: Array<{ id: string; userId: string; recommendationId: string; action: string; reason?: string; timestamp: string }> = [];
  public peerBenchmarks: Array<any> = [];
  public paypalOrders: Map<string, any> = new Map();
  public outboxEvents: Array<any> = [];

  private constructor() {
    this.seedInitialData();
  }

  public static getInstance(): DbService {
    if (!DbService.instance) {
      DbService.instance = new DbService();
    }
    return DbService.instance;
  }

  private seedInitialData() {
    // 1. Profiles
    const demoProfile: Profile = {
      id: DEMO_USER_ID,
      email: 'alex.morgan@spendwise.demo',
      fullName: 'Alex Morgan',
      currency: 'USD',
      reportingTimezone: 'America/New_York',
      ageBand: '25-34',
      employmentStatus: 'professional',
      householdSize: 1,
      incomeBand: 'tier2',
      locationCountry: 'US',
      locationRegion: 'NY',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2024-03-01T00:00:00Z',
    };
    this.profiles.set(DEMO_USER_ID, demoProfile);

    const secondProfile: Profile = {
      id: SECOND_USER_ID,
      email: 'jordan.lee@spendwise.demo',
      fullName: 'Jordan Lee',
      currency: 'USD',
      reportingTimezone: 'America/Los_Angeles',
      ageBand: '35-49',
      employmentStatus: 'business',
      householdSize: 3,
      incomeBand: 'tier3',
      locationCountry: 'US',
      locationRegion: 'CA',
      createdAt: '2023-05-01T00:00:00Z',
      updatedAt: '2024-03-01T00:00:00Z',
    };
    this.profiles.set(SECOND_USER_ID, secondProfile);

    // 2. Preferences
    this.preferences.set(DEMO_USER_ID, {
      userId: DEMO_USER_ID,
      peerComparisonConsent: true,
      aiFinancialInsightsConsent: true,
      analyticsSharingConsent: false,
      theme: 'light',
    });

    // 3. System Categories
    const categoriesSeed: Array<Omit<Category, 'userId'>> = [
      { id: 'cat-housing', name: 'Housing & Rent', slug: 'housing', icon: 'Home', colorHex: '#0A2540', isEssential: true },
      { id: 'cat-groceries', name: 'Groceries & Food', slug: 'groceries', icon: 'ShoppingBag', colorHex: '#0284C7', isEssential: true },
      { id: 'cat-utilities', name: 'Utilities & Bills', slug: 'utilities', icon: 'Zap', colorHex: '#D97706', isEssential: true },
      { id: 'cat-transport', name: 'Transportation', slug: 'transportation', icon: 'Car', colorHex: '#4B5563', isEssential: true },
      { id: 'cat-dining', name: 'Dining & Drinks', slug: 'dining', icon: 'Coffee', colorHex: '#F59E0B', isEssential: false },
      { id: 'cat-tech', name: 'Tech & Electronics', slug: 'technology', icon: 'Laptop', colorHex: '#6366F1', isEssential: false },
      { id: 'cat-health', name: 'Health & Fitness', slug: 'health-fitness', icon: 'Activity', colorHex: '#10B981', isEssential: false },
      { id: 'cat-entertainment', name: 'Entertainment & Subs', slug: 'entertainment', icon: 'Film', colorHex: '#EC4899', isEssential: false },
    ];
    categoriesSeed.forEach(c => this.categories.set(c.id, { ...c, userId: null }));

    // 4. Payment Purposes
    const purposesSeed: PaymentPurpose[] = [
      { id: 'purp-sustenance', userId: null, name: 'Daily Sustenance', slug: 'sustenance', description: 'Essential nutrition and home meals', defaultCategoryId: 'cat-groceries' },
      { id: 'purp-productivity', userId: null, name: 'Work Productivity & Setup', slug: 'productivity', description: 'Tools, hardware, and office essentials', defaultCategoryId: 'cat-tech' },
      { id: 'purp-living', userId: null, name: 'Living & Shelter', slug: 'living', description: 'Rent, maintenance and utilities', defaultCategoryId: 'cat-housing' },
      { id: 'purp-leisure', userId: null, name: 'Dining & Social Leisure', slug: 'leisure', description: 'Eating out, socializing and weekend fun', defaultCategoryId: 'cat-dining' },
      { id: 'purp-wellness', userId: null, name: 'Fitness & Physical Health', slug: 'wellness', description: 'Gym, classes, athletics', defaultCategoryId: 'cat-health' },
      { id: 'purp-entertainment', userId: null, name: 'Media & Digital Subscriptions', slug: 'entertainment', description: 'Streaming, gaming, software', defaultCategoryId: 'cat-entertainment' },
    ];
    purposesSeed.forEach(p => this.paymentPurposes.set(p.id, p));

    // 5. Seed 24 Months of Deterministic Transactions for Alex Morgan (2023 - 2024)
    this.seedTransactionsForDemoUser();

    // 6. Seed Active Budget for current month
    this.seedActiveBudget();

    // 7. Seed Peer Benchmarks
    this.seedPeerBenchmarks();
  }

  private seedTransactionsForDemoUser() {
    let txCounter = 1;
    const now = new Date();
    const currentYear = now.getFullYear();

    // Create 24 months of monthly income ($2,600 biweekly = $5,200/mo = 520,000 minor)
    for (let monthOffset = 23; monthOffset >= 0; monthOffset--) {
      const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const year = date.getFullYear();
      const month = date.getMonth();

      // Paycheck 1 (1st of month)
      const pay1Date = new Date(Date.UTC(year, month, 1, 9, 0, 0)).toISOString();
      const txPay1: Transaction = {
        id: `tx-pay1-${year}-${month}`,
        userId: DEMO_USER_ID,
        amountMinor: 260000,
        currency: 'USD',
        transactionType: 'income',
        status: 'completed',
        merchant: 'Apex Tech Solutions (Direct Deposit)',
        occurredAt: pay1Date,
        source: 'demo',
        createdAt: pay1Date,
        updatedAt: pay1Date,
      };
      this.transactions.set(txPay1.id, txPay1);

      // Paycheck 2 (15th of month)
      const pay2Date = new Date(Date.UTC(year, month, 15, 9, 0, 0)).toISOString();
      const txPay2: Transaction = {
        id: `tx-pay2-${year}-${month}`,
        userId: DEMO_USER_ID,
        amountMinor: 260000,
        currency: 'USD',
        transactionType: 'income',
        status: 'completed',
        merchant: 'Apex Tech Solutions (Direct Deposit)',
        occurredAt: pay2Date,
        source: 'demo',
        createdAt: pay2Date,
        updatedAt: pay2Date,
      };
      this.transactions.set(txPay2.id, txPay2);

      // Rent ($1,650 = 165000 minor)
      const rentDate = new Date(Date.UTC(year, month, 2, 10, 0, 0)).toISOString();
      const txRent: Transaction = {
        id: `tx-rent-${year}-${month}`,
        userId: DEMO_USER_ID,
        amountMinor: 165000,
        currency: 'USD',
        transactionType: 'expense',
        status: 'completed',
        categoryId: 'cat-housing',
        categoryName: 'Housing & Rent',
        purposeId: 'purp-living',
        purposeName: 'Living & Shelter',
        merchant: 'Highland Property Management',
        occurredAt: rentDate,
        source: 'demo',
        createdAt: rentDate,
        updatedAt: rentDate,
      };
      this.transactions.set(txRent.id, txRent);

      // Utilities ($180)
      const utilDate = new Date(Date.UTC(year, month, 5, 11, 0, 0)).toISOString();
      const txUtil: Transaction = {
        id: `tx-util-${year}-${month}`,
        userId: DEMO_USER_ID,
        amountMinor: 18000,
        currency: 'USD',
        transactionType: 'expense',
        status: 'completed',
        categoryId: 'cat-utilities',
        categoryName: 'Utilities & Bills',
        purposeId: 'purp-living',
        purposeName: 'Living & Shelter',
        merchant: 'Consolidated Electric & Gas',
        occurredAt: utilDate,
        source: 'demo',
        createdAt: utilDate,
        updatedAt: utilDate,
      };
      this.transactions.set(txUtil.id, txUtil);

      // Groceries (4 weeks x ~$150-$180)
      [7, 14, 21, 28].forEach((day, idx) => {
        const grocAmount = 14000 + (idx * 1500) + ((month % 3) * 1000);
        const grocDate = new Date(Date.UTC(year, month, day, 16, 0, 0)).toISOString();
        const txGroc: Transaction = {
          id: `tx-groc-${year}-${month}-${idx}`,
          userId: DEMO_USER_ID,
          amountMinor: grocAmount,
          currency: 'USD',
          transactionType: 'expense',
          status: 'completed',
          categoryId: 'cat-groceries',
          categoryName: 'Groceries & Food',
          purposeId: 'purp-sustenance',
          purposeName: 'Daily Sustenance',
          merchant: 'Trader Joe’s Market',
          occurredAt: grocDate,
          source: 'demo',
          createdAt: grocDate,
          updatedAt: grocDate,
        };
        this.transactions.set(txGroc.id, txGroc);
      });

      // Dining spending variation:
      // In 2023, dining was modest ($300/mo). In recent months, dining surged to $650/mo!
      const isRecent = monthOffset <= 3;
      const diningCount = isRecent ? 8 : 4;
      for (let d = 0; d < diningCount; d++) {
        const diningDay = 3 + d * 3;
        const diningAmount = isRecent ? (6500 + d * 1200) : (4500 + d * 500);
        const dinDate = new Date(Date.UTC(year, month, Math.min(28, diningDay), 19, 30, 0)).toISOString();
        const txDin: Transaction = {
          id: `tx-din-${year}-${month}-${d}`,
          userId: DEMO_USER_ID,
          amountMinor: diningAmount,
          currency: 'USD',
          transactionType: 'expense',
          status: 'completed',
          categoryId: 'cat-dining',
          categoryName: 'Dining & Drinks',
          purposeId: 'purp-leisure',
          purposeName: 'Dining & Social Leisure',
          merchant: d % 2 === 0 ? 'Blue Willow Bistro' : 'Green Leaf Artisan Kitchen',
          occurredAt: dinDate,
          source: 'demo',
          createdAt: dinDate,
          updatedAt: dinDate,
        };
        this.transactions.set(txDin.id, txDin);
      }

      // Gym subscription (Recurring commitment: $65/mo)
      const gymDate = new Date(Date.UTC(year, month, 10, 8, 0, 0)).toISOString();
      const txGym: Transaction = {
        id: `tx-gym-${year}-${month}`,
        userId: DEMO_USER_ID,
        amountMinor: 6500,
        currency: 'USD',
        transactionType: 'expense',
        status: 'completed',
        categoryId: 'cat-health',
        categoryName: 'Health & Fitness',
        purposeId: 'purp-wellness',
        purposeName: 'Fitness & Physical Health',
        merchant: 'Equinox Health & Fitness',
        occurredAt: gymDate,
        source: 'demo',
        createdAt: gymDate,
        updatedAt: gymDate,
      };
      this.transactions.set(txGym.id, txGym);

      // Streaming & Software Subscriptions ($45/mo recurring expense opportunity)
      const streamDate = new Date(Date.UTC(year, month, 12, 12, 0, 0)).toISOString();
      const txStream: Transaction = {
        id: `tx-stream-${year}-${month}`,
        userId: DEMO_USER_ID,
        amountMinor: 4500,
        currency: 'USD',
        transactionType: 'expense',
        status: 'completed',
        categoryId: 'cat-entertainment',
        categoryName: 'Entertainment & Subs',
        purposeId: 'purp-entertainment',
        purposeName: 'Media & Digital Subscriptions',
        merchant: 'Digital Media Bundle & Cloud',
        occurredAt: streamDate,
        source: 'demo',
        createdAt: streamDate,
        updatedAt: streamDate,
      };
      this.transactions.set(txStream.id, txStream);

      // Monthly transfer to savings ($1,200/mo in high savings periods, $500 in recent)
      const transferAmount = isRecent ? 50000 : 120000;
      const transDate = new Date(Date.UTC(year, month, 16, 14, 0, 0)).toISOString();
      const txTrans: Transaction = {
        id: `tx-trans-${year}-${month}`,
        userId: DEMO_USER_ID,
        amountMinor: transferAmount,
        currency: 'USD',
        transactionType: 'transfer',
        status: 'completed',
        merchant: 'Auto-Save Transfer to High Yield Account',
        occurredAt: transDate,
        source: 'demo',
        createdAt: transDate,
        updatedAt: transDate,
      };
      this.transactions.set(txTrans.id, txTrans);

      // Occasional refund (demonstrates accurate accounting)
      if (month % 4 === 0) {
        const refDate = new Date(Date.UTC(year, month, 22, 15, 0, 0)).toISOString();
        const txRef: Transaction = {
          id: `tx-ref-${year}-${month}`,
          userId: DEMO_USER_ID,
          amountMinor: 4500, // $45 refund
          currency: 'USD',
          transactionType: 'refund',
          status: 'completed',
          categoryId: 'cat-groceries',
          categoryName: 'Groceries & Food',
          purposeId: 'purp-sustenance',
          purposeName: 'Daily Sustenance',
          merchant: 'Trader Joe’s Market (Returned Goods)',
          occurredAt: refDate,
          source: 'demo',
          createdAt: refDate,
          updatedAt: refDate,
        };
        this.transactions.set(txRef.id, txRef);
      }
    }

    // Add a couple of pending transactions for testing exclusion
    const pendingTx: Transaction = {
      id: 'tx-pending-recent',
      userId: DEMO_USER_ID,
      amountMinor: 8900,
      currency: 'USD',
      transactionType: 'expense',
      status: 'pending',
      categoryId: 'cat-tech',
      categoryName: 'Tech & Electronics',
      merchant: 'Best Buy (Pending Authorization)',
      occurredAt: new Date().toISOString(),
      source: 'demo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.transactions.set(pendingTx.id, pendingTx);

    // Private records for user 2 (To test cross-user isolation!)
    const user2Tx: Transaction = {
      id: 'tx-user2-private',
      userId: SECOND_USER_ID,
      amountMinor: 999900,
      currency: 'USD',
      transactionType: 'expense',
      status: 'completed',
      merchant: 'Jordan Lee Private Merchant',
      occurredAt: new Date().toISOString(),
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.transactions.set(user2Tx.id, user2Tx);
  }

  private seedActiveBudget() {
    const now = new Date();
    const budgetId = `budget-${now.getFullYear()}-${now.getMonth() + 1}`;
    const budget: Budget = {
      id: budgetId,
      userId: DEMO_USER_ID,
      periodYear: now.getFullYear(),
      periodMonth: now.getMonth() + 1,
      currency: 'USD',
      totalIncomeEnvelopeMinor: 520000, // $5,200 envelope
      plannedSavingsMinor: 100000, // $1,000 target savings
      status: 'active',
      allocations: [
        {
          id: uuidv4(),
          categoryId: 'cat-housing',
          categoryName: 'Housing & Rent',
          allocatedAmountMinor: 170000,
          essentialMinimumMinor: 165000,
          isEssential: true,
          actualSpentMinor: 165000,
        },
        {
          id: uuidv4(),
          categoryId: 'cat-groceries',
          categoryName: 'Groceries & Food',
          allocatedAmountMinor: 70000,
          essentialMinimumMinor: 50000,
          isEssential: true,
          actualSpentMinor: 62000,
        },
        {
          id: uuidv4(),
          categoryId: 'cat-utilities',
          categoryName: 'Utilities & Bills',
          allocatedAmountMinor: 25000,
          essentialMinimumMinor: 18000,
          isEssential: true,
          actualSpentMinor: 18000,
        },
        {
          id: uuidv4(),
          categoryId: 'cat-transport',
          categoryName: 'Transportation',
          allocatedAmountMinor: 30000,
          essentialMinimumMinor: 15000,
          isEssential: true,
          actualSpentMinor: 22000,
        },
        {
          id: uuidv4(),
          categoryId: 'cat-dining',
          categoryName: 'Dining & Drinks',
          allocatedAmountMinor: 45000,
          essentialMinimumMinor: 0,
          isEssential: false,
          actualSpentMinor: 58000, // Over budget caution!
        },
        {
          id: uuidv4(),
          categoryId: 'cat-tech',
          categoryName: 'Tech & Electronics',
          allocatedAmountMinor: 35000,
          essentialMinimumMinor: 0,
          isEssential: false,
          actualSpentMinor: 12000,
        },
        {
          id: uuidv4(),
          categoryId: 'cat-health',
          categoryName: 'Health & Fitness',
          allocatedAmountMinor: 15000,
          essentialMinimumMinor: 6500,
          isEssential: false,
          actualSpentMinor: 6500,
        },
        {
          id: uuidv4(),
          categoryId: 'cat-entertainment',
          categoryName: 'Entertainment & Subs',
          allocatedAmountMinor: 30000,
          essentialMinimumMinor: 0,
          isEssential: false,
          actualSpentMinor: 24000,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.budgets.set(budgetId, budget);
  }

  private seedPeerBenchmarks() {
    this.peerBenchmarks = [
      {
        purposeSlug: 'sustenance',
        categorySlug: 'groceries',
        ageBand: '25-34',
        employmentStatus: 'professional',
        incomeBand: 'tier2',
        locationCountry: 'US',
        periodLabel: 'Monthly Aggregate 2024',
        cohortSize: 142,
        medianAmountMinor: 64000, // $640/mo median
        p25AmountMinor: 52000,
        p75AmountMinor: 78000,
        currency: 'USD',
        dataSource: 'Synthetic Benchmark Model v2.1',
        isSynthetic: true,
        comparabilityLimitations: 'Synthetic cohort normalized across urban professionals in the US. Individual dietary requirements and regional price variations apply.',
      },
      {
        purposeSlug: 'leisure',
        categorySlug: 'dining',
        ageBand: '25-34',
        employmentStatus: 'professional',
        incomeBand: 'tier2',
        locationCountry: 'US',
        periodLabel: 'Monthly Aggregate 2024',
        cohortSize: 98,
        medianAmountMinor: 38000, // $380/mo median
        p25AmountMinor: 26000,
        p75AmountMinor: 51000,
        currency: 'USD',
        dataSource: 'Synthetic Benchmark Model v2.1',
        isSynthetic: true,
        comparabilityLimitations: 'Sample size of 98 verified synthetic respondents. Metro dining indices show higher variance on weekend entertainment.',
      },
      {
        purposeSlug: 'living',
        categorySlug: 'housing',
        ageBand: '25-34',
        employmentStatus: 'professional',
        incomeBand: 'tier2',
        locationCountry: 'US',
        periodLabel: 'Monthly Aggregate 2024',
        cohortSize: 215,
        medianAmountMinor: 175000, // $1,750 median
        p25AmountMinor: 150000,
        p75AmountMinor: 210000,
        currency: 'USD',
        dataSource: 'Synthetic Benchmark Model v2.1',
        isSynthetic: true,
        comparabilityLimitations: 'Reflects single-tenant urban rental units across Tier 1 US metros.',
      },
      {
        purposeSlug: 'productivity',
        categorySlug: 'technology',
        ageBand: '25-34',
        employmentStatus: 'professional',
        incomeBand: 'tier2',
        locationCountry: 'US',
        periodLabel: 'Monthly Aggregate 2024',
        cohortSize: 54,
        medianAmountMinor: 28000, // $280 median
        p25AmountMinor: 12000,
        p75AmountMinor: 48000,
        currency: 'USD',
        dataSource: 'Synthetic Benchmark Model v2.1',
        isSynthetic: true,
        comparabilityLimitations: 'Hardware and setup spending shows high burstiness around upgrade cycles.',
      },
      {
        // Cohort with sample size below minimum threshold (18 < 30) to test display threshold requirement
        purposeSlug: 'niche-specialty',
        categorySlug: 'specialty',
        ageBand: '18-24',
        employmentStatus: 'student',
        incomeBand: 'tier1',
        locationCountry: 'US',
        periodLabel: 'Monthly Aggregate 2024',
        cohortSize: 18, // < 30!
        medianAmountMinor: 15000,
        currency: 'USD',
        dataSource: 'Synthetic Benchmark Model v2.1',
        isSynthetic: true,
        comparabilityLimitations: 'Cohort size is below 30 threshold.',
      },
    ];
  }
}
