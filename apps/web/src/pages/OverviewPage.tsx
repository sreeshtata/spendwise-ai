import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sdkClient } from '../services/api';
import {
  ShoppingBag,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

interface OverviewPageProps {
  onOpenTestCheckout: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onOpenTestCheckout }) => {
  const navigate = useNavigate();

  // Load Active Budget
  const { data: budget, isLoading: isBudgetLoading } = useQuery({
    queryKey: ['active-budget'],
    queryFn: () => sdkClient.budgets.getActive(),
  });

  // Load Progress & Realised Metrics
  const { data: progress, isLoading: isProgressLoading } = useQuery({
    queryKey: ['spending-progress', 'prior_year_month'],
    queryFn: () => sdkClient.spending.getMyProgress('prior_year_month'),
  });

  // Load Recent Transactions
  const { data: transactionsData } = useQuery({
    queryKey: ['transactions', { limit: 5 }],
    queryFn: () => sdkClient.transactions.list({ limit: 5 }),
  });

  const currentMetrics = progress?.currentPeriod;
  const incomeFormatted = currentMetrics ? `$${(currentMetrics.receivedIncomeMinor / 100).toLocaleString()}` : '$5,200';
  const expenseFormatted = currentMetrics ? `$${(currentMetrics.netExpenditureMinor / 100).toLocaleString()}` : '$3,420';
  const surplusFormatted = currentMetrics ? `$${(currentMetrics.recordedNetSurplusMinor / 100).toLocaleString()}` : '$1,780';
  const savingsRate = currentMetrics?.savingsRatePercentage !== null && currentMetrics?.savingsRatePercentage !== undefined
    ? `${currentMetrics.savingsRatePercentage}%`
    : 'Not available';

  return (
    <div className="space-y-8 pb-12">
      
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl p-6 shadow-card border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Smart Financial Assistant
          </span>
          <h1 className="text-2xl font-bold text-navy-900 mt-1.5">Welcome back, Alex</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Independent PayPal-connected spending intelligence prototype. Reviewing active cycle for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/budgets')}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-300"
          >
            Review Budget Plan
          </button>
          <button
            onClick={onOpenTestCheckout}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Test Sandbox Checkout</span>
          </button>
        </div>
      </div>

      {/* Two Prominent Core Actions (Section 4 Requirement) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Action 1: Shop & Pay Wisely */}
        <div className="bg-gradient-to-br from-navy-900 to-navy-800 text-white rounded-2xl p-6 shadow-lg border border-navy-700 flex flex-col justify-between hover:shadow-xl transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-xs font-semibold bg-navy-700 text-slate-200 px-2.5 py-1 rounded-full border border-slate-600">
                Purchase Decision Engine
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Shop & Pay Wisely</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Search vetted products through Channel3, calculate exact impact on your remaining monthly budget before buying, discover cost-saving alternatives, and complete verified test checkouts via PayPal Sandbox.
            </p>

            <div className="bg-navy-950/60 rounded-xl p-3 border border-navy-800 text-xs text-slate-300 space-y-1 mb-5">
              <div className="flex justify-between">
                <span>Tech & Electronics Budget:</span>
                <span className="font-semibold text-emerald-400">$350.00 / mo</span>
              </div>
              <div className="flex justify-between">
                <span>Available Headroom:</span>
                <span className="font-semibold text-white">$230.00 remaining</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/search')}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold rounded-xl text-sm transition-all shadow flex items-center justify-center space-x-2 group"
          >
            <span>Start Smarter Product Search</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Action 2: Explore My Spending */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200 flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-navy-900" />
              </div>
              <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
                Spending Intelligence
              </span>
            </div>
            <h2 className="text-xl font-bold text-navy-900 mb-2">Explore My Spending</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Inspect your verified 24-month transaction history, compare spending against matched peer cohorts (minimum 30 participant privacy threshold), track historical changes, and optimize budget allocations.
            </p>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-600 space-y-1 mb-5">
              <div className="flex justify-between">
                <span>Current Recorded Savings Rate:</span>
                <span className="font-bold text-emerald-600">{savingsRate}</span>
              </div>
              <div className="flex justify-between">
                <span>Peer Dining Comparison:</span>
                <span className="font-medium text-amber-700">+$270 above cohort median</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/spending')}
            className="w-full py-3 px-4 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl text-sm transition-all shadow flex items-center justify-center space-x-2 group"
          >
            <span>Open Spending Intelligence</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Real-time Accounting Summary Cards */}
      <div>
        <h3 className="text-base font-bold text-navy-900 mb-3 flex items-center gap-2">
          <span>Current Accounting Period</span>
          <span className="text-xs font-normal text-slate-500">(Verified Realised Outflow)</span>
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Received Income */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Received Income
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {incomeFormatted}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Excludes expected future income
            </span>
          </div>

          {/* Card 2: Net Realised Expenditure */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Net Expenditure
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {expenseFormatted}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
              Refunds credited on cash-flow basis
            </span>
          </div>

          {/* Card 3: Recorded Net Surplus */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Recorded Net Surplus
            </span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {surplusFormatted}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Income minus net expenses
            </span>
          </div>

          {/* Card 4: Savings Rate */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Savings Rate
            </span>
            <div className="text-2xl font-bold text-navy-900 mt-1">
              {savingsRate}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Surplus divided by received income
            </span>
          </div>
        </div>
      </div>

      {/* Active Budget Utilisation Preview */}
      {budget && (
        <div className="bg-white rounded-xl p-6 shadow-card border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-navy-900">Active Budget Allocations</h3>
              <p className="text-xs text-slate-500">
                Tracking monthly capacity across essential and discretionary categories.
              </p>
            </div>
            <button
              onClick={() => navigate('/budgets')}
              className="text-xs font-semibold text-navy-900 hover:text-navy-700 flex items-center space-x-1"
            >
              <span>View Full Budget Plans</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {budget.allocations.slice(0, 4).map((alloc) => {
              const spent = alloc.actualSpentMinor;
              const allocated = alloc.allocatedAmountMinor;
              const percentage = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
              const isOver = spent > allocated;
              const isWarning = percentage >= 85 && !isOver;

              return (
                <div key={alloc.categoryId} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">{alloc.categoryName}</span>
                    {alloc.isEssential && (
                      <span className="text-[10px] bg-slate-200 text-slate-700 font-medium px-1.5 py-0.2 rounded">
                        Essential
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-slate-900">
                      ${(spent / 100).toFixed(0)} <span className="text-slate-400 text-xs font-normal">/ ${(allocated / 100).toFixed(0)}</span>
                    </span>
                    <span className={`text-xs font-semibold ${
                      isOver ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {percentage}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Disclosures Note (Section 7 Requirement) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 flex items-start space-x-2.5">
        <ShieldCheck className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-semibold text-slate-700">Analytical Disclosure: </span>
          All spending calculations, ratios, and surplus projections reflect solely transactions recorded within this SpendWise AI prototype. External bank accounts and off-platform payments are outside current ledger coverage. This prototype does not claim to represent your official live PayPal account balance.
        </div>
      </div>

    </div>
  );
};
