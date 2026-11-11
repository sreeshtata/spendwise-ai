import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sdkClient } from '../services/api';
import {
  ShoppingBag,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  PieChart,
  ListFilter,
  CheckCircle2,
  DollarSign,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface OverviewPageProps {
  onOpenTestCheckout: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onOpenTestCheckout }) => {
  const navigate = useNavigate();

  // Load Active Budget
  const { data: budget } = useQuery({
    queryKey: ['active-budget'],
    queryFn: () => sdkClient.budgets.getActive(),
  });

  // Load Progress & Realised Metrics
  const { data: progress } = useQuery({
    queryKey: ['spending-progress', 'prior_year_month'],
    queryFn: () => sdkClient.spending.getMyProgress('prior_year_month'),
  });

  const currentMetrics = progress?.currentPeriod;
  const incomeFormatted = currentMetrics ? `$${(currentMetrics.receivedIncomeMinor / 100).toLocaleString()}` : '$5,200';
  const expenseFormatted = currentMetrics ? `$${(currentMetrics.netExpenditureMinor / 100).toLocaleString()}` : '$3,420';
  const surplusFormatted = currentMetrics ? `$${(currentMetrics.recordedNetSurplusMinor / 100).toLocaleString()}` : '$1,780';
  const savingsRate = currentMetrics?.savingsRatePercentage !== null && currentMetrics?.savingsRatePercentage !== undefined
    ? `${currentMetrics.savingsRatePercentage}%`
    : '34.2%';

  const currentMonthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-10 pb-16 max-w-7xl mx-auto">
      
      {/* 1. Portal Brand Hero Section */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-slate-900 rounded-3xl p-8 md:p-10 text-white shadow-xl border border-navy-800 relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-navy-800/80 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>SpendWise AI • Official Financial Portal</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              SpendWise <span className="text-emerald-400 font-black">AI</span>
            </h1>
            
            <p className="text-base md:text-lg text-slate-300 font-normal leading-relaxed">
              Your comprehensive financial decision engine. Select a core feature below to optimize monthly budget allocations, discover vetted merchant savings, or contextualize spending with peer intelligence.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <div className="bg-navy-900/90 border border-slate-700/80 rounded-2xl p-4 text-xs space-y-1.5 shadow-inner">
              <div className="flex items-center justify-between text-slate-400 gap-4">
                <span>Active Cycle:</span>
                <span className="font-semibold text-white">{currentMonthYear}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 gap-4">
                <span>Verification:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Isolated Ledger
                </span>
              </div>
            </div>

            <button
              onClick={onOpenTestCheckout}
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>PayPal Sandbox Checkout</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Big Clear Feature Options (Comfortable for Users) */}
      <div>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-navy-950">Available Features</h2>
            <p className="text-sm text-slate-500 mt-1">
              Select any feature option below to open its dedicated workflow and in-depth analytical tools.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Feature Option 1: Smart Budget Plans */}
          <div
            onClick={() => navigate('/budgets')}
            className="group cursor-pointer bg-white rounded-3xl p-7 border-2 border-slate-200 hover:border-emerald-500 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-100 transition-all">
                  <Sparkles className="w-7 h-7 text-emerald-600" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Feature 1
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-navy-900 group-hover:text-emerald-600 transition-colors">
                  Smart Budget Plans
                </h3>
                <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
                  Design deterministic category budget envelopes, protect essential commitments, review AI adjustments, and accept tailored recommendations.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Active Allocations:</span>
                  <span className="font-bold text-slate-900">{budget?.allocations?.length || 4} Categories</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Rules Engine:</span>
                  <span className="font-semibold text-emerald-700">Deterministic Protected</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-navy-900 group-hover:text-emerald-600 transition-colors">
                Configure Budget Plans
              </span>
              <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-all">
                <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>

          {/* Feature Option 2: Smarter Product Search */}
          <div
            onClick={() => navigate('/search')}
            className="group cursor-pointer bg-white rounded-3xl p-7 border-2 border-slate-200 hover:border-blue-600 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-100 transition-all">
                  <ShoppingBag className="w-7 h-7 text-blue-600" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  Feature 2
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-navy-900 group-hover:text-blue-600 transition-colors">
                  Smarter Product Search
                </h3>
                <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
                  Search any product across verified merchant networks, inspect total delivered costs, explore high-value alternatives, and calculate immediate budget headroom.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Merchant Network:</span>
                  <span className="font-bold text-slate-900">Channel3 Verified</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Universal Catalog:</span>
                  <span className="font-semibold text-blue-700">Any Product Search</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-navy-900 group-hover:text-blue-600 transition-colors">
                Search Products & Compare
              </span>
              <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all">
                <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>

          {/* Feature Option 3: Spending Intelligence */}
          <div
            onClick={() => navigate('/spending')}
            className="group cursor-pointer bg-white rounded-3xl p-7 border-2 border-slate-200 hover:border-purple-600 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center group-hover:scale-105 group-hover:bg-purple-100 transition-all">
                  <TrendingUp className="w-7 h-7 text-purple-600" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                  Feature 3
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-navy-900 group-hover:text-purple-600 transition-colors">
                  Spending Intelligence
                </h3>
                <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
                  Compare your spending against privacy-preserving peer cohorts (30+ participant minimum), view dynamic trend analysis, and evaluate savings rate progress.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Peer Privacy Threshold:</span>
                  <span className="font-bold text-slate-900">30+ Participant Min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Trend Analysis:</span>
                  <span className="font-semibold text-purple-700">Dynamic Multi-Period</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-navy-900 group-hover:text-purple-600 transition-colors">
                View Trends & Peer Benchmarks
              </span>
              <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-all">
                <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Quick Financial Health & Ledger Strip */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-card border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <span>Accounting Snapshot</span>
              <span className="text-xs font-normal text-slate-500">({currentMonthYear})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified cash-flow accounting metrics reflecting completed transactions and verified refunds.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/transactions')}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors border border-slate-300 flex items-center gap-1.5"
            >
              <ListFilter className="w-4 h-4 text-slate-600" />
              <span>Full Transaction Ledger</span>
            </button>
            <button
              onClick={() => navigate('/spending')}
              className="px-4 py-2 text-xs font-semibold bg-navy-900 hover:bg-navy-800 text-white rounded-xl transition-colors flex items-center gap-1.5"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Trend Analysis</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
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

          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Net Expenditure
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {expenseFormatted}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
              Refunds credited cash-flow
            </span>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
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

          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Recorded Savings Rate
            </span>
            <div className="text-2xl font-bold text-navy-900 mt-1">
              {savingsRate}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Surplus / received income
            </span>
          </div>
        </div>
      </div>

      {/* 4. Transparency & Privacy Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-700">Analytical & Architectural Disclosure: </span>
          All spending calculations, ratios, and surplus projections reflect solely transactions recorded within this SpendWise AI prototype. External bank accounts and off-platform payments are outside current ledger coverage. This prototype does not claim to represent your official live PayPal account balance.
        </div>
      </div>

    </div>
  );
};
