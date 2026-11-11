-- ====================================================================
-- SpendWise AI — PostgreSQL / Supabase Deterministic 2-Year Seed Data
-- Fictional Account: Alex Morgan (00000000-0000-0000-0000-000000000001)
-- Minor units convention: amounts are in cents (e.g. $5,200.00 = 520000)
-- ====================================================================

-- 1. Fictional User Profile
INSERT INTO public.profiles (
    id, email, full_name, currency, reporting_timezone, age_band, employment_status, household_size, income_band, location_country, location_region
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'alex.morgan@spendwise.demo',
    'Alex Morgan',
    'USD',
    'America/New_York',
    '25-34',
    'professional',
    1,
    'tier2',
    'US',
    'NY'
) ON CONFLICT (id) DO NOTHING;

-- 2. User Preferences & Explicit Consent
INSERT INTO public.user_preferences (
    user_id, peer_comparison_consent, ai_financial_insights_consent, analytics_sharing_consent, theme
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    TRUE,
    TRUE,
    FALSE,
    'light'
) ON CONFLICT (user_id) DO NOTHING;

-- 3. System Presets: Categories
INSERT INTO public.categories (id, user_id, name, slug, icon, color_hex, is_essential) VALUES
    ('cat-housing', NULL, 'Housing & Rent', 'housing', 'Home', '#0A2540', TRUE),
    ('cat-groceries', NULL, 'Groceries & Food', 'groceries', 'ShoppingBag', '#0284C7', TRUE),
    ('cat-utilities', NULL, 'Utilities & Bills', 'utilities', 'Zap', '#D97706', TRUE),
    ('cat-transport', NULL, 'Transportation', 'transportation', 'Car', '#4B5563', TRUE),
    ('cat-dining', NULL, 'Dining & Drinks', 'dining', 'Coffee', '#F59E0B', FALSE),
    ('cat-tech', NULL, 'Tech & Electronics', 'technology', 'Laptop', '#6366F1', FALSE),
    ('cat-health', NULL, 'Health & Fitness', 'health-fitness', 'Activity', '#10B981', FALSE),
    ('cat-entertainment', NULL, 'Entertainment & Subs', 'entertainment', 'Film', '#EC4899', FALSE)
ON CONFLICT DO NOTHING;

-- 4. Payment Purposes
INSERT INTO public.payment_purposes (id, user_id, name, slug, description, default_category_id) VALUES
    ('purp-sustenance', NULL, 'Daily Sustenance', 'sustenance', 'Essential nutrition and home meals', 'cat-groceries'),
    ('purp-productivity', NULL, 'Work Productivity & Setup', 'productivity', 'Tools, hardware, and office essentials', 'cat-tech'),
    ('purp-living', NULL, 'Living & Shelter', 'living', 'Rent, maintenance and utilities', 'cat-housing'),
    ('purp-leisure', NULL, 'Dining & Social Leisure', 'leisure', 'Eating out, socializing and weekend fun', 'cat-dining'),
    ('purp-wellness', NULL, 'Fitness & Physical Health', 'wellness', 'Gym, classes, athletics', 'cat-health'),
    ('purp-entertainment', NULL, 'Media & Digital Subscriptions', 'entertainment', 'Streaming, gaming, software', 'cat-entertainment')
ON CONFLICT DO NOTHING;

-- 5. Income Schedules (Separate from received transactions)
INSERT INTO public.income_schedules (
    id, user_id, name, source, expected_amount_minor, currency, frequency, day_of_month, is_active
) VALUES
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', 'Primary Tech Salary (Direct Deposit 1)', 'Apex Tech Solutions', 260000, 'USD', 'monthly', 1, TRUE),
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', 'Primary Tech Salary (Direct Deposit 2)', 'Apex Tech Solutions', 260000, 'USD', 'monthly', 15, TRUE)
ON CONFLICT DO NOTHING;

-- 6. Recurring Commitments
INSERT INTO public.recurring_commitments (
    id, user_id, name, merchant, category_id, purpose_id, amount_minor, currency, billing_cycle, billing_day, is_essential, is_active
) VALUES
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', 'Apartment Rent', 'Highland Property Management', 'cat-housing', 'purp-living', 165000, 'USD', 'monthly', 2, TRUE, TRUE),
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', 'High-Speed Internet', 'Spectrum Broadband', 'cat-utilities', 'purp-living', 7500, 'USD', 'monthly', 5, TRUE, TRUE),
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', 'Health & Fitness Club', 'Equinox Health Club', 'cat-health', 'purp-wellness', 6500, 'USD', 'monthly', 10, FALSE, TRUE),
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', 'Streaming Media & Cloud', 'Digital Media Bundle', 'cat-entertainment', 'purp-entertainment', 4500, 'USD', 'monthly', 12, FALSE, TRUE)
ON CONFLICT DO NOTHING;

-- 7. Peer Benchmark Aggregates (Synthetic clearly labelled cohorts)
INSERT INTO public.peer_benchmark_aggregates (
    purpose_slug, category_slug, age_band, employment_status, income_band, location_country, period_label, cohort_size, median_amount_minor, p25_amount_minor, p75_amount_minor, currency, data_source, is_synthetic, comparability_notes
) VALUES
    ('sustenance', 'groceries', '25-34', 'professional', 'tier2', 'US', 'Monthly Aggregate 2024', 142, 64000, 52000, 78000, 'USD', 'Synthetic Benchmark Model v2.1', TRUE, 'Synthetic cohort normalized across urban professionals in the US.'),
    ('leisure', 'dining', '25-34', 'professional', 'tier2', 'US', 'Monthly Aggregate 2024', 98, 38000, 26000, 51000, 'USD', 'Synthetic Benchmark Model v2.1', TRUE, 'Sample size of 98 verified synthetic respondents.'),
    ('living', 'housing', '25-34', 'professional', 'tier2', 'US', 'Monthly Aggregate 2024', 215, 175000, 150000, 210000, 'USD', 'Synthetic Benchmark Model v2.1', TRUE, 'Reflects single-tenant urban rental units across Tier 1 US metros.'),
    ('productivity', 'technology', '25-34', 'professional', 'tier2', 'US', 'Monthly Aggregate 2024', 54, 28000, 12000, 48000, 'USD', 'Synthetic Benchmark Model v2.1', TRUE, 'Hardware and setup spending shows high burstiness around upgrade cycles.'),
    ('niche-specialty', 'specialty', '18-24', 'student', 'tier1', 'US', 'Monthly Aggregate 2024', 18, 15000, 10000, 22000, 'USD', 'Synthetic Benchmark Model v2.1', TRUE, 'Cohort size is below 30 threshold (triggers insufficient data state).')
ON CONFLICT DO NOTHING;
