-- ====================================================================
-- SpendWise AI — Row Level Security (RLS) Policies
-- Strict user isolation on all private tables
-- ====================================================================

-- 1. Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. User Preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- 3. Categories (System categories user_id IS NULL are visible to all; custom categories are private)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view system and own categories" ON public.categories FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- 4. Payment Purposes
ALTER TABLE public.payment_purposes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view system and own payment purposes" ON public.payment_purposes FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can insert own payment purposes" ON public.payment_purposes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payment purposes" ON public.payment_purposes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payment purposes" ON public.payment_purposes FOR DELETE USING (auth.uid() = user_id);

-- 5. Income Schedules
ALTER TABLE public.income_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own income schedules" ON public.income_schedules FOR ALL USING (auth.uid() = user_id);

-- 6. Recurring Commitments
ALTER TABLE public.recurring_commitments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own recurring commitments" ON public.recurring_commitments FOR ALL USING (auth.uid() = user_id);

-- 7. Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- 8. Budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);

-- 9. Budget Allocations (Via budget ownership)
ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own budget allocations" ON public.budget_allocations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.budgets b WHERE b.id = budget_allocations.budget_id AND b.user_id = auth.uid())
);

-- 10. Budget Recommendations
ALTER TABLE public.budget_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own recommendations" ON public.budget_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own recommendations" ON public.budget_recommendations FOR UPDATE USING (auth.uid() = user_id);

-- 11. Savings Goals
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own savings goals" ON public.savings_goals FOR ALL USING (auth.uid() = user_id);

-- 12. Product Searches
ALTER TABLE public.product_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own product searches" ON public.product_searches FOR ALL USING (auth.uid() = user_id);

-- 13. Saved Product Offers
ALTER TABLE public.saved_product_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own saved offers" ON public.saved_product_offers FOR ALL USING (auth.uid() = user_id);

-- 14. AI Insights
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own AI insights" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);

-- 15. Recommendation Feedback
ALTER TABLE public.recommendation_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own recommendation feedback" ON public.recommendation_feedback FOR ALL USING (auth.uid() = user_id);

-- 16. Peer Benchmark Aggregates (Public aggregate read-only, no personal data)
ALTER TABLE public.peer_benchmark_aggregates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view aggregate benchmarks" ON public.peer_benchmark_aggregates FOR SELECT USING (true);

-- 17. PayPal Orders
ALTER TABLE public.paypal_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own PayPal sandbox orders" ON public.paypal_orders FOR ALL USING (auth.uid() = user_id);

-- 18. Payment Events
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view events for own orders" ON public.payment_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.paypal_orders o WHERE o.id = payment_events.order_id AND o.user_id = auth.uid())
);

-- 19. Outbox
ALTER TABLE public.integration_outbox_events ENABLE ROW LEVEL SECURITY;
-- Service role only accesses outbox directly
