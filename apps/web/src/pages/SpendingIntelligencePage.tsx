import React, { useState } from 'react';
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
} from 'recharts';

export const SpendingIntelligencePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'peer' | 'progress'>('peer');

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

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          Feature 3
        </span>
        <h1 className="text-2xl font-bold text-navy-900 mt-1.5">Spending Intelligence</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Contextualize your spending against verified peer cohorts and examine meaningfully aligned historical trends.
        </p>
      </div>

      {/* Tab Switcher (Section 4 & 10 Requirement: Exactly Two Tabs) */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('peer')}
          className={`flex items-center space-x-2 py-3 px-6 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'peer'
              ? 'border-navy-900 text-navy-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Peer Spending Context</span>
        </button>

        <button
          onClick={() => setActiveTab('progress')}
          className={`flex items-center space-x-2 py-3 px-6 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'progress'
              ? 'border-navy-900 text-navy-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>My Spending Progress</span>
        </button>
      </div>

      {/* TAB A: Peer Spending Context */}
      {activeTab === 'peer' && (
        <div className="space-y-6">
          
          {/* Cohort Selection Controls */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Payment Purpose
                </label>
                <select
                  value={selectedPurpose}
                  onChange={(e) => setSelectedPurpose(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="sustenance">Daily Sustenance & Meals</option>
                  <option value="leisure">Dining & Social Leisure</option>
                  <option value="living">Living & Shelter</option>
                  <option value="productivity">Work Productivity & Setup</option>
                  <option value="niche-specialty">Niche Specialty (Test &lt; 30 threshold)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Age Band
                </label>
                <select
                  value={selectedAgeBand}
                  onChange={(e) => setSelectedAgeBand(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="18-24">18-24</option>
                  <option value="25-34">25-34</option>
                  <option value="35-49">35-49</option>
                  <option value="50+">50+</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={selectedEmployment}
                  onChange={(e) => setSelectedEmployment(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="professional">Professional</option>
                  <option value="student">Student</option>
                  <option value="business">Business / Founder</option>
                </select>
              </div>
            </div>

            {peerData?.cohortDefinition && (
              <div className="text-right text-xs">
                <span className="text-slate-400 block text-[10px]">Cohort Sample Size:</span>
                <span className="font-bold text-navy-900 text-sm">
                  {peerData.cohortDefinition.sampleSize} participants
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Threshold: 30 min
                </span>
              </div>
            )}
          </div>

          {/* Insufficient Data State Check (Section 10 Requirement) */}
          {peerData && !peerData.cohortDefinition.isSufficientCohort ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center space-y-3">
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
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-card space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-bold text-navy-900">
                        {peerData.purposeName} Benchmark Comparison
                      </h3>
                      <p className="text-xs text-slate-500">
                        Comparing your recorded monthly expenditure against cohort median and distribution.
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Synthetic Benchmark Model
                    </span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={peerChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value: any) => [`$${value}`, 'Amount']} />
                        <Bar dataKey="Amount" radius={[6, 6, 0, 0]} />
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
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card space-y-4">
                  <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider">
                    Cohort & Model Metadata
                  </h3>

                  <div className="divide-y divide-slate-100 text-xs space-y-2">
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

                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-900">
                    <span className="font-semibold block mb-0.5">Comparability Limitations:</span>
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

      {/* TAB B: My Spending Progress */}
      {activeTab === 'progress' && progressData && (
        <div className="space-y-6">
          
          {/* Comparison Period Selector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center space-x-3 text-xs">
              <span className="font-bold text-slate-700">Comparison Baseline:</span>
              <div className="inline-flex rounded-lg border border-slate-300 p-1 bg-slate-50">
                <button
                  onClick={() => setComparisonType('prior_year_month')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    comparisonType === 'prior_year_month' ? 'bg-navy-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Prior-Year Month (Nov '23)
                </button>
                <button
                  onClick={() => setComparisonType('prior_year_ytd')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    comparisonType === 'prior_year_ytd' ? 'bg-navy-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  YTD vs Prior YTD
                </button>
                <button
                  onClick={() => setComparisonType('prior_month')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    comparisonType === 'prior_month' ? 'bg-navy-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Prior Month (Oct '24)
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Comparing {progressData.currentPeriod.periodLabel} vs {progressData.comparisonPeriod.periodLabel}</span>
            </div>
          </div>

          {/* Key Metrics Comparison Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Metric 1: Net Expenditure */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Net Expenditure
              </span>
              <div className="text-xl font-bold text-navy-900 mt-1">
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

            {/* Metric 2: Savings Rate Difference */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Savings Rate
              </span>
              <div className="text-xl font-bold text-emerald-600 mt-1">
                {progressData.currentPeriod.savingsRatePercentage !== null ? `${progressData.currentPeriod.savingsRatePercentage}%` : 'Not available'}
              </div>
              <div className="text-xs mt-1 font-semibold text-slate-600">
                {progressData.percentageChange.savingsRateDiffPercentagePoints !== null
                  ? `${progressData.percentageChange.savingsRateDiffPercentagePoints > 0 ? `+${progressData.percentageChange.savingsRateDiffPercentagePoints}% pts` : `${progressData.percentageChange.savingsRateDiffPercentagePoints}% pts`} vs prior`
                  : 'Prior: N/A'}
              </div>
            </div>

            {/* Metric 3: Budget Adherence */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Budget Adherence
              </span>
              <div className="text-xl font-bold text-navy-900 mt-1">
                {progressData.currentPeriod.budgetAdherencePercentage}%
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                Prior: {progressData.comparisonPeriod.budgetAdherencePercentage}%
              </span>
            </div>

            {/* Metric 4: Verified Transaction Count */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Verified Records
              </span>
              <div className="text-xl font-bold text-slate-800 mt-1">
                {progressData.currentPeriod.transactionCount} transactions
              </div>
              <span className="text-xs text-emerald-600 font-medium mt-1 block">
                Complete coverage
              </span>
            </div>
          </div>

          {/* Category Change Breakdown Chart & Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Visual Bar Comparison */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card space-y-4">
              <h3 className="text-base font-bold text-navy-900">
                Category Spending Comparison
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryComparisonData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => [`$${value}`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Current" fill="#0A2540" name="Current Period" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Prior" fill="#94A3B8" name="Prior Period" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Evidence Narrative & Disclosures */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card space-y-4">
              <h3 className="text-base font-bold text-navy-900">
                Evidence-Based Historical Narrative
              </h3>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                {progressData.evidenceNarrative}
              </div>

              {/* Recurring commitment change preview */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Recurring Commitments Evolution
                </h4>
                {progressData.recurringChanges.map((rec) => (
                  <div key={rec.name} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
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

              {/* Disclosures list */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                {progressData.dataCoverageDisclosures.map((disc, idx) => (
                  <p key={idx} className="text-[11px] text-slate-400">
                    • {disc}
                  </p>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
