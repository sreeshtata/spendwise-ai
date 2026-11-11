import { z } from 'zod';

// ==========================================
// 1. Common & Primitive Schemas
// ==========================================

export const CurrencyCodeSchema = z.enum(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']).default('USD');
export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;

export const MinorUnitsSchema = z.number().int().nonnegative();

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const DateRangeQuerySchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  periodPreset: z.enum(['7d', '30d', '3m', 'ytd', 'custom']).optional(),
  currency: CurrencyCodeSchema.optional(),
});

// ==========================================
// 2. Profiles and Preferences
// ==========================================

export const ProfileSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  fullName: z.string().min(1).max(100).nullable().optional(),
  currency: CurrencyCodeSchema,
  reportingTimezone: z.string().default('UTC'),
  ageBand: z.enum(['18-24', '25-34', '35-49', '50+']).nullable().optional(),
  employmentStatus: z.enum(['student', 'professional', 'business', 'other']).nullable().optional(),
  householdSize: z.number().int().min(1).max(20).default(1),
  incomeBand: z.enum(['tier1', 'tier2', 'tier3']).nullable().optional(),
  locationCountry: z.string().length(2).default('US'),
  locationRegion: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const UpdateProfileSchema = ProfileSchema.partial().omit({ id: true, createdAt: true, updatedAt: true });
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;

export const UserPreferencesSchema = z.object({
  userId: z.string().min(1),
  peerComparisonConsent: z.boolean().default(false),
  aiFinancialInsightsConsent: z.boolean().default(true),
  analyticsSharingConsent: z.boolean().default(false),
  theme: z.enum(['light', 'dark']).default('light'),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// ==========================================
// 3. Categories and Payment Purposes
// ==========================================

export const CategorySchema = z.object({
  id: z.string().min(1),
  userId: z.string().nullable().optional(), // null = system preset
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  icon: z.string().nullable().optional(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#0A2540'),
  isEssential: z.boolean().default(false),
});
export type Category = z.infer<typeof CategorySchema>;

export const PaymentPurposeSchema = z.object({
  id: z.string().min(1),
  userId: z.string().nullable().optional(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  defaultCategoryId: z.string().nullable().optional(),
});
export type PaymentPurpose = z.infer<typeof PaymentPurposeSchema>;

// ==========================================
// 4. Transactions
// ==========================================

export const TransactionTypeSchema = z.enum(['income', 'expense', 'transfer', 'refund']);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const TransactionStatusSchema = z.enum(['completed', 'pending', 'failed', 'cancelled']);
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

export const TransactionSourceSchema = z.enum(['manual', 'import', 'sandbox', 'demo']);
export type TransactionSource = z.infer<typeof TransactionSourceSchema>;

export const TransactionSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  amountMinor: MinorUnitsSchema,
  currency: CurrencyCodeSchema,
  transactionType: TransactionTypeSchema,
  status: TransactionStatusSchema,
  categoryId: z.string().min(1).nullable().optional(),
  categoryName: z.string().optional(),
  purposeId: z.string().min(1).nullable().optional(),
  purposeName: z.string().optional(),
  merchant: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  occurredAt: z.string().datetime(),
  source: TransactionSourceSchema,
  externalReference: z.string().nullable().optional(),
  refundParentId: z.string().min(1).nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const CreateTransactionSchema = z.object({
  amountMinor: MinorUnitsSchema.refine(val => val > 0, { message: 'Amount must be greater than zero' }),
  currency: CurrencyCodeSchema,
  transactionType: TransactionTypeSchema,
  status: TransactionStatusSchema.default('completed').optional(),
  categoryId: z.string().nullable().optional(),
  purposeId: z.string().nullable().optional(),
  merchant: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  occurredAt: z.string().datetime(),
  source: TransactionSourceSchema.default('manual').optional(),
  externalReference: z.string().nullable().optional(),
  refundParentId: z.string().nullable().optional(),
});
export type CreateTransaction = z.infer<typeof CreateTransactionSchema>;

export const TransactionFilterSchema = PaginationQuerySchema.extend({
  query: z.string().optional(),
  categoryId: z.string().min(1).optional(),
  purposeId: z.string().min(1).optional(),
  merchant: z.string().optional(),
  minAmountMinor: z.coerce.number().int().nonnegative().optional(),
  maxAmountMinor: z.coerce.number().int().nonnegative().optional(),
  transactionType: TransactionTypeSchema.optional(),
  status: TransactionStatusSchema.optional(),
  source: TransactionSourceSchema.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  currency: CurrencyCodeSchema.optional(),
});
export type TransactionFilter = z.infer<typeof TransactionFilterSchema>;

export const CsvImportPreviewRowSchema = z.object({
  rowIndex: z.number().int(),
  merchant: z.string(),
  amountMinor: z.number().int(),
  currency: CurrencyCodeSchema,
  transactionType: TransactionTypeSchema,
  occurredAt: z.string(),
  categorySlug: z.string().optional(),
  purposeSlug: z.string().optional(),
  isValid: z.boolean(),
  validationErrors: z.array(z.string()),
});
export type CsvImportPreviewRow = z.infer<typeof CsvImportPreviewRowSchema>;

export const CsvImportCommitSchema = z.object({
  transactions: z.array(CreateTransactionSchema),
});

// ==========================================
// 5. Budgets & Allocations (Feature 1)
// ==========================================

export const BudgetAllocationItemSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1),
  categoryName: z.string().optional(),
  allocatedAmountMinor: MinorUnitsSchema,
  essentialMinimumMinor: MinorUnitsSchema.default(0),
  isEssential: z.boolean().default(false),
  actualSpentMinor: MinorUnitsSchema.default(0),
  notes: z.string().nullable().optional(),
});
export type BudgetAllocationItem = z.infer<typeof BudgetAllocationItemSchema>;

export const BudgetSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  periodYear: z.number().int().min(2020).max(2100),
  periodMonth: z.number().int().min(1).max(12),
  currency: CurrencyCodeSchema,
  totalIncomeEnvelopeMinor: MinorUnitsSchema,
  plannedSavingsMinor: MinorUnitsSchema,
  status: z.enum(['active', 'draft', 'archived']).default('active'),
  allocations: z.array(BudgetAllocationItemSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Budget = z.infer<typeof BudgetSchema>;

export const CreateBudgetSchema = z.object({
  periodYear: z.number().int().min(2020).max(2100),
  periodMonth: z.number().int().min(1).max(12),
  currency: CurrencyCodeSchema.default('USD'),
  totalIncomeEnvelopeMinor: MinorUnitsSchema,
  plannedSavingsMinor: MinorUnitsSchema.default(0),
  allocations: z.array(BudgetAllocationItemSchema),
});
export type CreateBudget = z.infer<typeof CreateBudgetSchema>;

export const BudgetRecommendationItemSchema = z.object({
  categoryId: z.string().min(1),
  categoryName: z.string(),
  currentAllocatedMinor: MinorUnitsSchema,
  proposedAllocatedMinor: MinorUnitsSchema,
  essentialMinimumMinor: MinorUnitsSchema,
  differenceMinor: z.number().int(),
  isEssential: z.boolean(),
  reason: z.string(),
  historicalAverageMinor: MinorUnitsSchema,
  purposeSlug: z.string().optional(),
});
export type BudgetRecommendationItem = z.infer<typeof BudgetRecommendationItemSchema>;

export const BudgetRecommendationResponseSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  budgetId: z.string().min(1).nullable().optional(),
  periodYear: z.number().int(),
  periodMonth: z.number().int(),
  currency: CurrencyCodeSchema,
  totalIncomeEnvelopeMinor: MinorUnitsSchema,
  recommendedSavingsMinor: MinorUnitsSchema,
  calculationVersion: z.string(),
  modelProvider: z.string(),
  allocations: z.array(BudgetRecommendationItemSchema),
  explanationNarrative: z.string(),
  limitations: z.string(),
  isInfeasible: z.boolean().default(false),
  infeasibleExplanation: z.string().nullable().optional(),
  generatedAt: z.string().datetime(),
  isRuleBasedFallback: z.boolean().default(false),
});
export type BudgetRecommendationResponse = z.infer<typeof BudgetRecommendationResponseSchema>;

export const RecommendationFeedbackSchema = z.object({
  recommendationId: z.string().min(1),
  feedbackAction: z.enum(['accepted', 'rejected', 'modified']),
  feedbackReason: z.string().optional(),
});
export type RecommendationFeedback = z.infer<typeof RecommendationFeedbackSchema>;

// ==========================================
// 6. Smarter Product Search (Feature 2)
// ==========================================

export const ProductSearchQuerySchema = z.object({
  queryDescription: z.string().min(1).max(300),
  purchasePurposeId: z.string().min(1).optional(),
  purposeSlug: z.string().optional(),
  maxBudgetMinor: z.coerce.number().int().positive().optional(),
  currency: CurrencyCodeSchema.default('USD'),
  quantity: z.coerce.number().int().min(1).max(100).default(1),
  deliveryCountry: z.string().length(2).default('US'),
  requiredSpecs: z.record(z.string()).optional(),
  brandPreference: z.string().optional(),
  warrantyRequirement: z.string().optional(),
  returnRequirement: z.string().optional(),
});
export type ProductSearchQuery = z.infer<typeof ProductSearchQuerySchema>;

export const ProductOfferSchema = z.object({
  id: z.string(),
  productIdentifier: z.string(),
  brand: z.string(),
  model: z.string(),
  title: z.string(),
  merchantName: z.string(),
  merchantUrl: z.string().url(),
  itemSubtotalMinor: MinorUnitsSchema,
  shippingMinor: MinorUnitsSchema,
  taxesMinor: MinorUnitsSchema,
  mandatoryFeesMinor: MinorUnitsSchema,
  discountsMinor: MinorUnitsSchema,
  totalDeliveredMinor: MinorUnitsSchema,
  isPriceComplete: z.boolean(),
  priceCompletenessNote: z.string().optional(),
  currency: CurrencyCodeSchema,
  availableQuantity: z.number().int(),
  specs: z.record(z.string()),
  warrantySummary: z.string(),
  returnPolicy: z.string(),
  deliveryDetails: z.string(),
  // Sourced reviews
  productRating: z.number().min(0).max(5).nullable(),
  productReviewCount: z.number().int().nullable(),
  ratingSourceName: z.string().nullable(),
  ratingSourceUrl: z.string().url().nullable().optional(),
  ratingScale: z.string().default('5.0'),
  retrievedAt: z.string().datetime(),
  provenanceSource: z.string().default('channel3'),
  // Alternatives classification
  isAlternative: z.boolean().default(false),
  alternativeSuitabilityReason: z.string().nullable().optional(),
  rankingScore: z.number(),
  rankingExplanation: z.string(),
  isAffiliate: z.boolean().default(false),
  affiliateDisclosure: z.string().optional(),
});
export type ProductOffer = z.infer<typeof ProductOfferSchema>;

export const ProductSearchResponseSchema = z.object({
  query: ProductSearchQuerySchema,
  sameProductOffers: z.array(ProductOfferSchema),
  alternativeOffers: z.array(ProductOfferSchema),
  budgetImpact: z.object({
    relevantCategoryName: z.string(),
    relevantPurposeName: z.string(),
    currentBudgetMinor: MinorUnitsSchema,
    spentSoFarMinor: MinorUnitsSchema,
    remainingBudgetBeforePurchaseMinor: z.number().int(),
    estimatedRemainingAfterPurchaseMinor: z.number().int(),
    differenceFromBaselineMinor: z.number().int().optional(),
    savingsDescription: z.string().optional(), // "Potential savings of $X"
    currency: CurrencyCodeSchema,
  }),
  coverageNotice: z.string(),
  retrievalTimestamp: z.string().datetime(),
});
export type ProductSearchResponse = z.infer<typeof ProductSearchResponseSchema>;

// ==========================================
// 7. Spending Intelligence (Feature 3)
// ==========================================

export const PeerSpendingRequestSchema = z.object({
  purposeSlug: z.string().min(1),
  ageBand: z.enum(['18-24', '25-34', '35-49', '50+']).optional(),
  employmentStatus: z.enum(['student', 'professional', 'business', 'other']).optional(),
  incomeBand: z.enum(['tier1', 'tier2', 'tier3']).optional(),
  householdSize: z.coerce.number().int().optional(),
  periodPreset: z.enum(['monthly', 'quarterly', 'ytd']).default('monthly'),
  currency: CurrencyCodeSchema.default('USD'),
});
export type PeerSpendingRequest = z.infer<typeof PeerSpendingRequestSchema>;

export const PeerSpendingResponseSchema = z.object({
  purposeSlug: z.string(),
  purposeName: z.string(),
  cohortDefinition: z.object({
    ageBand: z.string().optional(),
    employmentStatus: z.string().optional(),
    incomeBand: z.string().optional(),
    locationCountry: z.string(),
    sampleSize: z.number().int(),
    minCohortThreshold: z.number().int().default(30),
    isSufficientCohort: z.boolean(),
  }),
  benchmark: z.object({
    medianAmountMinor: MinorUnitsSchema,
    p25AmountMinor: MinorUnitsSchema.optional(),
    p75AmountMinor: MinorUnitsSchema.optional(),
    currency: CurrencyCodeSchema,
    periodLabel: z.string(),
    dataSource: z.string(),
    isSynthetic: z.boolean(),
    comparabilityLimitations: z.string(),
  }).nullable(),
  userSpendingMinor: MinorUnitsSchema,
  userPeriodLabel: z.string(),
  currency: CurrencyCodeSchema,
  insightsNarrative: z.string(),
  insufficientDataExplanation: z.string().nullable().optional(),
});
export type PeerSpendingResponse = z.infer<typeof PeerSpendingResponseSchema>;

export const PeriodMetricsSchema = z.object({
  periodLabel: z.string(),
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  currency: CurrencyCodeSchema,
  receivedIncomeMinor: MinorUnitsSchema,
  netExpenditureMinor: MinorUnitsSchema,
  recordedNetSurplusMinor: z.number().int(),
  savingsRatePercentage: z.number().nullable(), // null if income is 0
  budgetAdherencePercentage: z.number().nullable(),
  transactionCount: z.number().int(),
  dataCoverageDays: z.number().int(),
  isPartialCoverage: z.boolean(),
});
export type PeriodMetrics = z.infer<typeof PeriodMetricsSchema>;

export const CategorySpendingChangeSchema = z.object({
  categoryId: z.string().min(1),
  categoryName: z.string(),
  currentMinor: MinorUnitsSchema,
  priorMinor: MinorUnitsSchema,
  differenceMinor: z.number().int(),
  percentageChange: z.number().nullable(),
});
export type CategorySpendingChange = z.infer<typeof CategorySpendingChangeSchema>;

export const MySpendingProgressResponseSchema = z.object({
  currentPeriod: PeriodMetricsSchema,
  comparisonPeriod: PeriodMetricsSchema,
  comparisonType: z.enum(['prior_month', 'prior_year_month', 'prior_year_ytd', 'custom']),
  percentageChange: z.object({
    income: z.number().nullable(),
    netExpenditure: z.number().nullable(),
    savingsRateDiffPercentagePoints: z.number().nullable(),
  }),
  categoryChanges: z.array(CategorySpendingChangeSchema),
  recurringChanges: z.array(z.object({
    name: z.string(),
    currentMinor: MinorUnitsSchema,
    priorMinor: MinorUnitsSchema,
    differenceMinor: z.number().int(),
  })),
  dataCoverageDisclosures: z.array(z.string()),
  evidenceNarrative: z.string(),
});
export type MySpendingProgressResponse = z.infer<typeof MySpendingProgressResponseSchema>;

// ==========================================
// 8. PayPal Sandbox Workflow
// ==========================================

export const PayPalCreateOrderSchema = z.object({
  amountMinor: MinorUnitsSchema.refine(v => v > 0, { message: 'Order amount must be positive' }),
  currency: CurrencyCodeSchema,
  itemDescription: z.string().min(1).max(255),
  purposeId: z.string().min(1).optional().nullable(),
  categoryId: z.string().min(1).optional().nullable(),
  idempotencyKey: z.string().min(1).max(128).optional().nullable(),
});
export type PayPalCreateOrder = z.infer<typeof PayPalCreateOrderSchema>;

export const PayPalCreateOrderResponseSchema = z.object({
  orderId: z.string(),
  paypalOrderId: z.string(),
  status: z.string(),
  approveUrl: z.string().url(),
  amountMinor: MinorUnitsSchema,
  currency: CurrencyCodeSchema,
  itemDescription: z.string(),
  createdAt: z.string().datetime(),
});
export type PayPalCreateOrderResponse = z.infer<typeof PayPalCreateOrderResponseSchema>;

export const PayPalCaptureOrderSchema = z.object({
  paypalOrderId: z.string().min(1),
});
export type PayPalCaptureOrder = z.infer<typeof PayPalCaptureOrderSchema>;

export const PayPalCaptureOrderResponseSchema = z.object({
  success: z.boolean(),
  orderId: z.string(),
  paypalOrderId: z.string(),
  captureId: z.string(),
  status: z.string(),
  amountMinor: MinorUnitsSchema,
  currency: CurrencyCodeSchema,
  transactionId: z.string().min(1),
  capturedAt: z.string().datetime(),
  message: z.string(),
});
export type PayPalCaptureOrderResponse = z.infer<typeof PayPalCaptureOrderResponseSchema>;

// ==========================================
// 9. Integration Status
// ==========================================

export const IntegrationStatusSchema = z.object({
  paypal: z.object({
    name: z.literal('PayPal Sandbox'),
    status: z.enum(['configured', 'demo', 'unavailable']),
    mode: z.string(),
    supportedCurrencies: z.array(z.string()),
    lastEventTime: z.string().datetime().nullable(),
  }),
  channel3: z.object({
    name: z.literal('Channel3'),
    status: z.enum(['configured', 'demo', 'unavailable']),
    provider: z.string(),
    coverageNote: z.string(),
  }),
  apimatic: z.object({
    name: z.literal('APIMatic SDK'),
    status: z.enum(['configured', 'demo', 'unavailable']),
    sdkVersion: z.string(),
    documentationUrl: z.string(),
  }),
  elasticsearch: z.object({
    name: z.literal('Elasticsearch'),
    status: z.enum(['configured', 'demo', 'unavailable']),
    activeDriver: z.enum(['elasticsearch', 'postgresql_fallback']),
    indexedCount: z.number().int(),
  }),
  ai: z.object({
    name: z.literal('SpendWise AI Service'),
    status: z.enum(['configured', 'demo', 'unavailable']),
    provider: z.string(),
    model: z.string(),
    fallbackModeAvailable: z.boolean(),
  }),
  supabase: z.object({
    name: z.literal('Supabase PostgreSQL'),
    status: z.enum(['configured', 'demo', 'unavailable']),
    rlsActive: z.boolean(),
  }),
});
export type IntegrationStatus = z.infer<typeof IntegrationStatusSchema>;
