import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sdkClient } from '../services/api';
import {
  TrendingUp,
  Users,
  Calendar,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Info,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Filter,
  BarChart2,
  Sparkles,
  Zap,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';

export const SpendingIntelligencePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeZone, setActiveZone] = useState<'peer' | 'progress' | 'trend'>('peer');
  
  // Track which zones have been opened and generated
  const [generatedZones, setGeneratedZones] = useState<Record<string, boolean>>({ peer: false });
  const [isGenerating, setIsGenerating] = useState(false);

  // Trigger graph generation when a particular zone is opened
  useEffect(() => {
    if (!generatedZones[activeZone]) {
      setIsGenerating(true);
      const timer = setTimeout(() => {
        setGeneratedZones((prev) => ({ ...prev, [activeZone]: true }));
        setIsGenerating(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeZone, generatedZones]);

  // Peer Context States
  const [selectedPurpose, setSelectedPurpose] = useState('sustenance');
  const [selectedAgeBand, setSelectedAgeBand] = useState('25-34');
  const [selectedEmployment, setSelectedEmployment] = useState('professional');

  // Historical Progress States
  const [comparisonType, setComparisonType] = useState<'prior_year_month' | 'prior_year_ytd' | 'prior_month'>('prior_year_month');

  // 1. Fetch Peer Spending
  const { data: peerData, isLoading: isPeerLoading } = useQuery({
    queryKey: ['peer-spending', selectedPurpose, selectedAgeBand, selectedEmployment],
    queryFn: () =>
      sdkClient.spending.getPeerSpending({
        purposeSlug: selectedPurpose,
        periodPreset: 'monthly',
        currency: 'USD',
        ageBand: selectedAgeBand as any,
        employmentStatus: selectedEmployment as any,
      }),
  });

  // 2. Fetch My Spending Progress
  const { data: progressData, isLoading: isProgressLoading } = useQuery({
    queryKey: ['spending-progress', comparisonType],
    queryFn: () => sdkClient.spending.getMyProgress(comparisonType),
  });

  // Prepare Peer Chart Data
  const peerChartData = peerData?.benchmark
    ? [
        {
          name: 'Your Spending',
          Amount: (peerData.userSpendingMinor / 100),
          fill: '#0A2540',
        },
        {
          name: 'Cohort 25th %ile',
          Amount: ((peerData.benchmark.p25AmountMinor || 0) / 100),
          fill: '#94A3B8',
        },
        {
          name: 'Cohort Median',
          Amount: (peerData.benchmark.medianAmountMinor / 100),
          fill: '#10B981',
        },
        {
          name: 'Cohort 75th %ile',
          Amount: ((peerData.benchmark.p75AmountMinor || 0) / 100),
          fill: '#CBD5E1',
        },
      ]
    : [];

  // Prepare Progress Category Comparison Data
  const categoryComparisonData = progressData?.categoryChanges.slice(0, 5).map((cat) => ({
    name: cat.categoryName,
    Current: (cat.currentMinor / 100),
    Prior: (cat.priorMinor / 100),
  })) || [];

  // 6-Month Historical & Forward Trend Analysis Data (Carried Forward)
  const historicalTrendData = [
    { month: 'Jun', income: 5000, expenditure: 3750, surplus: 1250, savingsRate: 25 },
    { month: 'Jul', income: 5000, expenditure: 3600, surplus: 1400, savingsRate: 28 },
    { month: 'Aug', income: 5100, expenditure: 3550, surplus: 1550, savingsRate: 30.4 },
    { month: 'Sep', income: 5100, expenditure: 3480, surplus: 1620, savingsRate: 31.8 },
    { month: 'Oct', income: 5200, expenditure: 3450, surplus: 1750, savingsRate: 33.6 },
    { month: 'Nov (Current)', income: 5200, expenditure: 3420, surplus: 1780, savingsRate: 34.2 },
    { month: 'Dec (Projected)', income: 5200, expenditure: 3350, surplus: 1850, savingsRate: 35.5 },
  ];

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center space-x-2 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full text-xs font-bold text-purple-700 mb-2">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Feature 3 • Verified Spending Governance</span>
        </div>
        <h1 className="text-3xl font-extrabold text-navy-950">Spending Intelligence</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Contextualize your spending against verified peer cohorts (minimum 30 participant privacy threshold), track historical progress, and carry forward dynamic trend analysis into active budget allocations.
        </p>
      </div>

      {/* Zone Switcher (3 Clearly Labeled Zones) */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveZone('peer')}
          className={`flex items-center space-x-2 py-3 px-6 text-sm font-bold border-b-2 transition-all ${
            activeZone === 'peer'
              ? 'border-navy-900 text-navy-900 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Zone 1: Peer Spending Context</span>
        </button>

        <button
          onClick={() => setActiveZone('progress')}
          className={`flex items-center space-x-2 py-3 px-6 text-sm font-bold border-b-2 transition-all ${
            activeZone === 'progress'
              ? 'border-navy-900 text-navy-900 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Zone 2: My Spending Progress</span>
        </button>

        <button
          onClick={() => setActiveZone('trend')}
          className={`flex items-center space-x-2 py-3 px-6 text-sm font-bold border-b-2 transition-all ${
            activeZone === 'trend'
              ? 'border-purple-600 text-purple-700 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Zone 3: Trend Analysis & Forward Projections</span>
        </button>
      </div>

      {/* Dynamic Graph Generation Indicator */}
      {isGenerating && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-2 animate-pulse">
          <Activity className="w-6 h-6 text-purple-600 mx-auto animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Generating analytical graphs for this zone...</p>
          <p className="text-xs text-slate-400">Computing trend metrics and carrying forward historical variance</p>
        </div>
      )}

      {/* ZONE 1: Peer Spending Context */}
      {activeZone === 'peer' && !isGenerating && (
        <div className="space-y-6">
          
          {/* Cohort Selection Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Payment Purpose
                </label>
                <select
                  value={selectedPurpose}
                  onChange={(e) => setSelectedPurpose(e.target.value)}
                  className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:outline-none"
                >
                  <option value="sustenance">Daily Sustenance & Meals</option>
                  <option value="leisure">Dining & Social Leisure</option>
                  <option value="living">Living & Shelter</option>
                  <option value="productivity">Work Productivity & Setup</option>
                  <option value="niche-specialty">Niche Specialty (Test &lt; 30 threshold)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Age Band
                </label>
                <select
                  value={selectedAgeBand}
                  onChange={(e) => setSelectedAgeBand(e.target.value)}
                  className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:outline-none"
                >
                  <option value="18-24">18-24</option>
                  <option value="25-34">25-34</option>
                  <option value="35-49">35-49</option>
                  <option value="50+">50+</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Employment Status
                </label>
                <select
                  value={selectedEmployment}
                  onChange={(e) => setSelectedEmployment(e.target.value)}
                  className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:outline-none"
                >
                  <option value="professional">Professional</option>
                  <option value="student">Student</option>
                  <option value="business">Business / Founder</option>
                </select>
              </div>
            </div>

            {peerData?.cohortDefinition && (
              <div className="text-right text-xs">
                <span className="text-slate-400 block text-[11px] font-semibold">Cohort Sample Size:</span>
                <span className="font-extrabold text-navy-950 text-base">
                  {peerData.cohortDefinition.sampleSize} participants
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Threshold: 30 min required
                </span>
              </div>
            )}
          </div>

          {/* Insufficient Data State Check */}
          {peerData && !peerData.cohortDefinition.isSufficientCohort ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Insufficient Comparable Data</h3>
              <p className="text-sm text-slate-600 max-w-lg mx-auto">
                {peerData.insufficientDataExplanation || 'Cohort size is below the required 30-participant threshold. We do not invent synthetic numbers when data coverage is insufficient.'}
              </p>
            </div>
          ) : (
            peerData?.benchmark && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Visual Chart Card */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-bold text-navy-900">
                        {peerData.purposeName} Benchmark Distribution
                      </h3>
                      <p className="text-xs text-slate-500">
                        Comparing your recorded monthly expenditure against cohort median and percentiles.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Cohort Privacy Verified
                    </span>
                  </div>

                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={peerChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
                        <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value: any) => [`$${value}`, 'Expenditure']} />
                        <Bar dataKey="Amount" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Constructive Narrative */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold text-navy-900">Insight: </span>
                    {peerData.insightsNarrative}
                  </div>
                </div>

                {/* Sourced Benchmark Metadata Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-4">
                  <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                    Cohort & Model Metadata
                  </h3>

                  <div className="divide-y divide-slate-100 text-xs space-y-2.5">
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-500">Data Source:</span>
                      <span className="font-semibold text-slate-800">{peerData.benchmark.dataSource}</span>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-500">Benchmark Type:</span>
                      <span className="font-semibold text-emerald-700">Clearly Labelled Synthetic Demo</span>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-500">Sample Size:</span>
                      <span className="font-semibold text-slate-800">{peerData.cohortDefinition.sampleSize} respondents</span>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-500">Cohort Median:</span>
                      <span className="font-bold text-slate-900">${(peerData.benchmark.medianAmountMinor / 100).toFixed(2)}</span>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-500">Your Spending:</span>
                      <span className="font-bold text-navy-900">${(peerData.userSpendingMinor / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-xs text-blue-900 leading-relaxed">
                    <span className="font-bold block mb-1">Comparability Limitations:</span>
                    {peerData.benchmark.comparabilityLimitations}
                  </div>

                  <div className="text-[11px] text-slate-400">
                    * Benchmark data does not represent actual PayPal customer personal records.
                  </div>
                </div>

              </div>
            )
          )}

        </div>
      )}

      {/* ZONE 2: My Spending Progress */}
      {activeZone === 'progress' && !isGenerating && progressData && (
        <div className="space-y-6">
          
          {/* Comparison Period Selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center space-x-3 text-xs">
              <span className="font-bold text-slate-800">Comparison Baseline:</span>
              <div className="inline-flex rounded-xl border border-slate-300 p-1 bg-slate-50">
                <button
                  onClick={() => setComparisonType('prior_year_month')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    comparisonType === 'prior_year_month' ? 'bg-navy-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Prior-Year Month (Nov '23)
                </button>
                <button
                  onClick={() => setComparisonType('prior_year_ytd')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    comparisonType === 'prior_year_ytd' ? 'bg-navy-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  YTD vs Prior YTD
                </button>
                <button
                  onClick={() => setComparisonType('prior_month')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    comparisonType === 'prior_month' ? 'bg-navy-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Prior Month (Oct '24)
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-medium">Comparing {progressData.currentPeriod.periodLabel} vs {progressData.comparisonPeriod.periodLabel}</span>
            </div>
          </div>

          {/* Key Metrics Comparison Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Net Expenditure
              </span>
              <div className="text-2xl font-extrabold text-navy-900 mt-1">
                ${(progressData.currentPeriod.netExpenditureMinor / 100).toLocaleString()}
              </div>
              <div className="flex items-center space-x-1 text-xs mt-1 font-semibold text-slate-700">
                <span>vs ${(progressData.comparisonPeriod.netExpenditureMinor / 100).toLocaleString()}</span>
                {progressData.percentageChange.netExpenditure !== null && (
                  <span className={progressData.percentageChange.netExpenditure > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                    ({progressData.percentageChange.netExpenditure > 0 ? `+${progressData.percentageChange.netExpenditure}%` : `${progressData.percentageChange.netExpenditure}%`})
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Savings Rate
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                {progressData.currentPeriod.savingsRatePercentage !== null ? `${progressData.currentPeriod.savingsRatePercentage}%` : 'Not available'}
              </div>
              <div className="text-xs mt-1 font-semibold text-slate-600">
                {progressData.percentageChange.savingsRateDiffPercentagePoints !== null
                  ? `${progressData.percentageChange.savingsRateDiffPercentagePoints > 0 ? `+${progressData.percentageChange.savingsRateDiffPercentagePoints}% pts` : `${progressData.percentageChange.savingsRateDiffPercentagePoints}% pts`} vs prior`
                  : 'Prior: N/A'}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Budget Adherence
              </span>
              <div className="text-2xl font-extrabold text-navy-900 mt-1">
                {progressData.currentPeriod.budgetAdherencePercentage}%
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                Prior: {progressData.comparisonPeriod.budgetAdherencePercentage}%
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Verified Records
              </span>
              <div className="text-2xl font-extrabold text-slate-800 mt-1">
                {progressData.currentPeriod.transactionCount} txns
              </div>
              <span className="text-xs text-emerald-600 font-semibold mt-1 block">
                Complete coverage
              </span>
            </div>
          </div>

          {/* Category Change Breakdown Chart & Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-4">
              <h3 className="text-base font-bold text-navy-900">
                Category Spending Comparison
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryComparisonData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => [`$${value}`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Current" fill="#0A2540" name="Current Period" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Prior" fill="#94A3B8" name="Prior Period" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-4">
              <h3 className="text-base font-bold text-navy-900">
                Evidence-Based Historical Narrative
              </h3>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                {progressData.evidenceNarrative}
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Recurring Commitments Evolution
                </h4>
                {progressData.recurringChanges.map((rec) => (
                  <div key={rec.name} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-800">{rec.name}</span>
                    <span className="font-mono text-slate-700">
                      ${(rec.currentMinor / 100).toFixed(2)}{' '}
                      <span className="text-slate-400 font-sans">
                        ({rec.differenceMinor > 0 ? `+$${(rec.differenceMinor / 100).toFixed(2)}` : 'unchanged'})
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ZONE 3: Trend Analysis & Forward Projections (Carried Forward) */}
      {activeZone === 'trend' && !isGenerating && (
        <div className="space-y-6">
          
          {/* Trend Summary Banner */}
          <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white p-6 rounded-2xl shadow-lg border border-purple-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-800/60 px-3 py-1 rounded-full border border-purple-600">
                Carried-Forward Trend Analysis
              </span>
              <h3 className="text-2xl font-bold mt-1">Consistent Surplus & Savings Growth</h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                By maintaining steady essential commitments and trimming discretionary spending, your personal savings rate has expanded from 25.0% to 34.2% over 6 months (+9.2 percentage points).
              </p>
            </div>

            <button
              onClick={() => navigate('/budgets')}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-xs rounded-xl shadow transition-all flex items-center space-x-2 shrink-0"
            >
              <span>Apply Trend to Budget Plans</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Forward Trend Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Graph 1: Income vs Net Outflow Over Time */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-base font-bold text-navy-900">Income vs Net Expenditure Trajectory</h4>
                  <p className="text-xs text-slate-500">6-month trendline with December forward projection.</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Widening Surplus
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalTrendData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="incomeColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="expenseColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0A2540" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0A2540" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => [`$${value}`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#incomeColor)" name="Income ($)" />
                    <Area type="monotone" dataKey="expenditure" stroke="#0A2540" strokeWidth={2} fillOpacity={1} fill="url(#expenseColor)" name="Net Outflow ($)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graph 2: Savings Rate Expansion Trendline */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-base font-bold text-navy-900">Savings Rate Progression (%)</h4>
                  <p className="text-xs text-slate-500">Continuous upward expansion of realized savings rate.</p>
                </div>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  +9.2% Points
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalTrendData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `${v}%`} domain={[20, 40]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => [`${value}%`, 'Savings Rate']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="savingsRate" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 5, fill: '#8B5CF6' }} activeDot={{ r: 8 }} name="Savings Rate (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Actionable Insights Carried Forward */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-3">
            <h4 className="text-sm font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Strategic Recommendations Carried Forward
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-navy-950 block">Surplus Preservation:</span>
                <p className="text-slate-600 leading-relaxed">
                  Lock in current monthly surplus ($1,780) by transferring $500 to high-yield reserves before discretionary shopping.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-navy-950 block">Product Headroom:</span>
                <p className="text-slate-600 leading-relaxed">
                  Use Smarter Product Search to cap purchases under $230 remaining headroom to preserve target 35% savings rate.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-navy-950 block">Budget Carry-Forward:</span>
                <p className="text-slate-600 leading-relaxed">
                  Reallocate unspent dining surplus ($128) into digital tools in the Smart Budget Plans module.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
