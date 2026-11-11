-- ====================================================================
-- SpendWise AI — Initial PostgreSQL & Supabase Migration
-- Features: Smart Budget Plans, Smarter Product Search, Spending Intelligence
-- Minor unit convention: amounts are stored as BIGINT (e.g., USD 12.50 = 1250 cents)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    reporting_timezone TEXT NOT NULL DEFAULT 'UTC',
    age_band VARCHAR(20), -- e.g. '18-24', '25-34', '35-49', '50+'
    employment_status VARCHAR(30), -- 'student', 'professional', 'business', 'other'
    household_size INT DEFAULT 1,
    income_band VARCHAR(30), -- 'tier1', 'tier2', 'tier3'
    location_country VARCHAR(2) DEFAULT 'US',
    location_region TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. User Consent and Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    peer_comparison_consent BOOLEAN NOT NULL DEFAULT FALSE,
    ai_financial_insights_consent BOOLEAN NOT NULL DEFAULT TRUE,
    analytics_sharing_consent BOOLEAN NOT NULL DEFAULT FALSE,
    theme VARCHAR(20) NOT NULL DEFAULT 'light',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_preferences UNIQUE (user_id)
);

-- 3. Categories (System standard & custom user categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL for system standard categories
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    icon TEXT,
    color_hex VARCHAR(7) DEFAULT '#0A2540',
    is_essential BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_category_slug_per_user UNIQUE (user_id, slug)
);

-- 4. Payment Purposes
CREATE TABLE IF NOT EXISTS public.payment_purposes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL for system standard
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    default_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Income Schedules (Separate from received transactions)
CREATE TABLE IF NOT EXISTS public.income_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source TEXT NOT NULL, -- e.g. 'employer', 'freelance', 'investment'
    expected_amount_minor BIGINT NOT NULL CHECK (expected_amount_minor > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    frequency VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'weekly', 'biweekly', 'monthly', 'irregular'
    day_of_month INT CHECK (day_of_month BETWEEN 1 AND 31),
    next_expected_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Recurring Commitments
CREATE TABLE IF NOT EXISTS public.recurring_commitments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    merchant TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    purpose_id UUID REFERENCES public.payment_purposes(id) ON DELETE SET NULL,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
    billing_day INT CHECK (billing_day BETWEEN 1 AND 31),
    is_essential BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer', 'refund')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'pending', 'failed', 'cancelled')),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    purpose_id UUID REFERENCES public.payment_purposes(id) ON DELETE SET NULL,
    merchant TEXT NOT NULL,
    description TEXT,
    occurred_at TIMESTAMPTZ NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'import', 'sandbox', 'demo')),
    external_reference TEXT,
    refund_parent_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_external_reference UNIQUE (user_id, external_reference)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_occurred ON public.transactions(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_status ON public.transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_purpose ON public.transactions(purpose_id);

-- 8. Budgets
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    period_year INT NOT NULL,
    period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    total_income_envelope_minor BIGINT NOT NULL CHECK (total_income_envelope_minor >= 0),
    planned_savings_minor BIGINT NOT NULL DEFAULT 0 CHECK (planned_savings_minor >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_budget_period_per_user UNIQUE (user_id, period_year, period_month)
);

-- 9. Budget Allocations
CREATE TABLE IF NOT EXISTS public.budget_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    allocated_amount_minor BIGINT NOT NULL CHECK (allocated_amount_minor >= 0),
    essential_minimum_minor BIGINT NOT NULL DEFAULT 0 CHECK (essential_minimum_minor >= 0),
    is_essential BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_budget_allocation_category UNIQUE (budget_id, category_id)
);

-- 10. Budget Recommendation Versions
CREATE TABLE IF NOT EXISTS public.budget_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    calculation_version TEXT NOT NULL DEFAULT '1.0',
    model_provider TEXT NOT NULL DEFAULT 'gemini-1.5-pro',
    total_envelope_minor BIGINT NOT NULL,
    recommended_savings_minor BIGINT NOT NULL,
    allocations_json JSONB NOT NULL, -- array of { category_id, proposed_minor, baseline_minor, difference_minor, reason, is_essential }
    explanation_narrative TEXT NOT NULL,
    limitations TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'partially_accepted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Savings Goals
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount_minor BIGINT NOT NULL CHECK (target_amount_minor > 0),
    current_amount_minor BIGINT NOT NULL DEFAULT 0 CHECK (current_amount_minor >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    target_date DATE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_reached BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Product Searches
CREATE TABLE IF NOT EXISTS public.product_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    query_description TEXT NOT NULL,
    purchase_purpose_id UUID REFERENCES public.payment_purposes(id) ON DELETE SET NULL,
    max_budget_minor BIGINT CHECK (max_budget_minor > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    delivery_country VARCHAR(2) DEFAULT 'US',
    required_specs JSONB,
    brand_preference TEXT,
    warranty_requirement TEXT,
    return_requirement TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Saved Product Offers
CREATE TABLE IF NOT EXISTS public.saved_product_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    search_id UUID REFERENCES public.product_searches(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_identifier TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    merchant_name TEXT NOT NULL,
    merchant_url TEXT NOT NULL,
    item_subtotal_minor BIGINT NOT NULL CHECK (item_subtotal_minor >= 0),
    shipping_minor BIGINT NOT NULL DEFAULT 0,
    taxes_minor BIGINT NOT NULL DEFAULT 0,
    mandatory_fees_minor BIGINT NOT NULL DEFAULT 0,
    discounts_minor BIGINT NOT NULL DEFAULT 0,
    total_delivered_minor BIGINT NOT NULL,
    is_price_complete BOOLEAN NOT NULL DEFAULT TRUE,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    available_quantity INT DEFAULT 1,
    warranty_summary TEXT,
    return_policy TEXT,
    delivery_details TEXT,
    product_rating NUMERIC(3,2),
    product_review_count INT,
    rating_source_name TEXT,
    rating_source_url TEXT,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    provenance_source VARCHAR(30) NOT NULL DEFAULT 'channel3',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. AI Insights
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    insight_type VARCHAR(30) NOT NULL CHECK (insight_type IN ('budget_adjustment', 'product_tradeoff', 'peer_benchmark', 'historical_narrative')),
    period_start DATE,
    period_end DATE,
    calculation_version TEXT NOT NULL DEFAULT '1.0',
    model_provider TEXT NOT NULL,
    narrative TEXT NOT NULL,
    structured_data JSONB,
    limitations TEXT,
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Recommendation Feedback
CREATE TABLE IF NOT EXISTS public.recommendation_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recommendation_id UUID REFERENCES public.budget_recommendations(id) ON DELETE CASCADE,
    feedback_action VARCHAR(20) NOT NULL CHECK (feedback_action IN ('accepted', 'rejected', 'modified')),
    feedback_reason TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Peer Benchmark Aggregates
CREATE TABLE IF NOT EXISTS public.peer_benchmark_aggregates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purpose_slug TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    age_band VARCHAR(20),
    employment_status VARCHAR(30),
    income_band VARCHAR(30),
    location_country VARCHAR(2) DEFAULT 'US',
    period_label VARCHAR(30) NOT NULL, -- e.g. '2024-Q1', '2024-Monthly'
    cohort_size INT NOT NULL,
    median_amount_minor BIGINT NOT NULL,
    p25_amount_minor BIGINT,
    p75_amount_minor BIGINT,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    data_source TEXT NOT NULL DEFAULT 'synthetic_demo',
    is_synthetic BOOLEAN NOT NULL DEFAULT TRUE,
    comparability_notes TEXT,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. PayPal Orders (Sandbox demonstration)
CREATE TABLE IF NOT EXISTS public.paypal_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    paypal_order_id TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED', -- 'CREATED', 'APPROVED', 'COMPLETED', 'FAILED'
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    purpose_id UUID REFERENCES public.payment_purposes(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    item_description TEXT NOT NULL,
    merchant_name TEXT NOT NULL DEFAULT 'PayPal Sandbox Merchant Store',
    capture_id TEXT,
    idempotency_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_paypal_order_id UNIQUE (paypal_order_id),
    CONSTRAINT uq_capture_id UNIQUE (capture_id)
);

-- 18. Payment Events (Audit ledger & webhooks)
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.paypal_orders(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_id TEXT NOT NULL, -- external event id for duplicate avoidance
    payload JSONB NOT NULL,
    processed_status VARCHAR(20) NOT NULL DEFAULT 'PROCESSED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_payment_event_id UNIQUE (event_id)
);

-- 19. Integration Outbox Events (For Elasticsearch and sync)
CREATE TABLE IF NOT EXISTS public.integration_outbox_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregate_type VARCHAR(50) NOT NULL, -- 'transaction', 'budget', etc.
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted'
    payload JSONB NOT NULL,
    destination VARCHAR(30) NOT NULL DEFAULT 'elasticsearch',
    retry_count INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);
