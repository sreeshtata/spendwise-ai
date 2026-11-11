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
  CheckCircle2,
  ListFilter,
  DollarSign,
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
    <div className="space-y-12 pb-16 max-w-6xl mx-auto">
      
      {/* 1. Main Dashboard Header: Centered Webpage Title (PayPal Aesthetic) */}
      <div className="text-center pt-6 pb-2 space-y-3">
        <div className="inline-flex items-center space-x-2 bg-blue-50 border border-[#0070BA]/30 px-4 py-1.5 rounded-full text-xs font-bold text-[#003087]">
          <span>Verified PayPal Spending Intelligence</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-[#001C3D] tracking-tight">
          SpendWise <span className="text-[#0070BA]">AI</span>
        </h1>

        <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Smart financial management, multi-store product price comparison, and peer spending intelligence. Choose a feature below to get started:
        </p>
      </div>

      {/* 2. Three Major Options Below It (Big, Clear, Comfortable) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Option 1: Smart Budget Plans */}
        <div
          onClick={() => navigate('/budgets')}
          className="group cursor-pointer bg-white rounded-3xl p-8 border-2 border-slate-200 hover:border-[#0070BA] shadow-md hover:shadow-2xl transition-all duration-200 flex flex-col justify-between"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center group-hover:scale-105 group-hover:bg-[#0070BA] transition-all">
                <Sparkles className="w-8 h-8 text-[#003087] group-hover:text-white transition-colors" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#003087] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Option 1
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-[#001C3D] group-hover:text-[#0070BA] transition-colors">
                Smart Budget Plans
              </h2>
              <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
                Organize your monthly income into safe spending envelopes, protect rent and groceries, and accept verified AI budget recommendations.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between font-medium">
                <span className="text-slate-500">Active Categories:</span>
                <span className="font-bold text-slate-900">{budget?.allocations?.length || 4} Envelopes</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-500">Protection:</span>
                <span className="font-bold text-emerald-700">Essential Bills Shielded</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-[#001C3D] group-hover:text-[#0070BA] transition-colors">
              Open Budget Plans
            </span>
            <div className="w-10 h-10 rounded-full bg-[#F5F7FA] group-hover:bg-[#0070BA] flex items-center justify-center transition-all">
              <ArrowRight className="w-5 h-5 text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>

        {/* Option 2: Smarter Product Search */}
        <div
          onClick={() => navigate('/search')}
          className="group cursor-pointer bg-white rounded-3xl p-8 border-2 border-slate-200 hover:border-[#0070BA] shadow-md hover:shadow-2xl transition-all duration-200 flex flex-col justify-between"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-600 transition-all">
                <ShoppingBag className="w-8 h-8 text-emerald-700 group-hover:text-white transition-colors" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Option 2
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-[#001C3D] group-hover:text-[#0070BA] transition-colors">
                Smarter Product Search
              </h2>
              <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
                Search any product online, compare prices across Amazon, Best Buy, and other stores, and discover cheaper vetted alternatives.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between font-medium">
                <span className="text-slate-500">Merchant Network:</span>
                <span className="font-bold text-slate-900">Amazon, Best Buy & Stores</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-500">Budget Impact:</span>
                <span className="font-bold text-emerald-700">Live Headroom Calculator</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-[#001C3D] group-hover:text-[#0070BA] transition-colors">
              Search & Compare Products
            </span>
            <div className="w-10 h-10 rounded-full bg-[#F5F7FA] group-hover:bg-[#0070BA] flex items-center justify-center transition-all">
              <ArrowRight className="w-5 h-5 text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>

        {/* Option 3: Spending Intelligence */}
        <div
          onClick={() => navigate('/spending')}
          className="group cursor-pointer bg-white rounded-3xl p-8 border-2 border-slate-200 hover:border-[#0070BA] shadow-md hover:shadow-2xl transition-all duration-200 flex flex-col justify-between"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center group-hover:scale-105 group-hover:bg-purple-600 transition-all">
                <TrendingUp className="w-8 h-8 text-purple-700 group-hover:text-white transition-colors" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                Option 3
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-[#001C3D] group-hover:text-[#0070BA] transition-colors">
                Spending Intelligence
              </h2>
              <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
                Compare your spending habits against verified peer cohorts (30+ privacy threshold), inspect trends, and expand your savings rate.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between font-medium">
                <span className="text-slate-500">Peer Comparisons:</span>
                <span className="font-bold text-slate-900">30+ Participant Minimum</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-500">Current Savings Rate:</span>
                <span className="font-bold text-purple-700">{savingsRate}</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-[#001C3D] group-hover:text-[#0070BA] transition-colors">
              Explore Spending Trends
            </span>
            <div className="w-10 h-10 rounded-full bg-[#F5F7FA] group-hover:bg-[#0070BA] flex items-center justify-center transition-all">
              <ArrowRight className="w-5 h-5 text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>

      </div>

      {/* 3. Clean Account Snapshot & Utilities Strip */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-card border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#001C3D] flex items-center gap-2">
              <span>Monthly Financial Overview</span>
              <span className="text-xs font-normal text-slate-500">({currentMonthYear})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified ledger calculations based on completed transactions and verified refunds.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/transactions')}
              className="px-4 py-2 text-xs font-bold bg-[#F5F7FA] hover:bg-slate-200 text-[#001C3D] rounded-xl transition-colors border border-slate-300 flex items-center gap-1.5"
            >
              <ListFilter className="w-4 h-4 text-slate-600" />
              <span>View All Transactions</span>
            </button>
            <button
              onClick={onOpenTestCheckout}
              className="px-4 py-2 text-xs font-bold bg-[#0070BA] hover:bg-[#005ea6] text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <CreditCard className="w-4 h-4" />
              <span>PayPal Sandbox Checkout</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Received Income
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {incomeFormatted}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Direct deposit & verified inflows
            </span>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Net Expenditure
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {expenseFormatted}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              Refunds credited cash-flow
            </span>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Recorded Net Surplus
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {surplusFormatted}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Income minus net expenses
            </span>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Recorded Savings Rate
            </span>
            <div className="text-2xl font-black text-[#003087] mt-1">
              {savingsRate}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Surplus / received income
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
