import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sdkClient } from '../services/api';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Lock,
  DollarSign,
  Search,
  RefreshCw,
  Info,
  Calendar,
} from 'lucide-react';
import { BudgetRecommendationItem } from '@spendwise/contracts';

export const BudgetsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [plannedSavings, setPlannedSavings] = useState(1000);
  const [allocationEdits, setAllocationEdits] = useState<Record<string, number>>({});
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [isRecommendationDismissed, setIsRecommendationDismissed] = useState(false);

  // 1. Fetch Active Budget
  const { data: budget, isLoading: isBudgetLoading } = useQuery({
    queryKey: ['active-budget'],
    queryFn: () => sdkClient.budgets.getActive(),
  });

  // 2. Fetch AI Recommendations
  const { data: recommendations, isLoading: isRecsLoading, refetch: refetchRecs } = useQuery({
    queryKey: ['budget-recommendations'],
    queryFn: () => sdkClient.budgets.getRecommendations(),
  });

  // Save budget mutation
  const saveBudgetMutation = useMutation({
    mutationFn: ({ allocations: newAllocations, savingsMinor }: { allocations: any[]; savingsMinor?: number }) => {
      const envelopeMinor = budget?.totalIncomeEnvelopeMinor || 520000;
      const targetSavingsMinor = savingsMinor !== undefined ? savingsMinor : plannedSavings * 100;
      return sdkClient.budgets.createOrUpdate({
        periodYear: budget?.periodYear || new Date().getFullYear(),
        periodMonth: budget?.periodMonth || (new Date().getMonth() + 1),
        currency: budget?.currency || 'USD',
        totalIncomeEnvelopeMinor: envelopeMinor,
        plannedSavingsMinor: targetSavingsMinor,
        allocations: newAllocations,
      });
    },
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['active-budget'] });
      queryClient.invalidateQueries({ queryKey: ['budget-recommendations'] });
    },
  });

  // Feedback mutation (accept / reject recommendation)
  const feedbackMutation = useMutation({
    mutationFn: ({ recommendationId, action, reason }: { recommendationId: string; action: 'accepted' | 'rejected'; reason?: string }) =>
      sdkClient.budgets.submitFeedback({ recommendationId, feedbackAction: action, feedbackReason: reason }),
    onSuccess: (_, vars) => {
      if (vars.action === 'rejected') {
        setFeedbackSuccess('Recommendation dismissed.');
        setTimeout(() => setFeedbackSuccess(null), 4000);
      }
    },
  });

  const allocations = budget?.allocations || [];
  const totalAllocatedMinor = allocations.reduce((sum, a) => sum + (allocationEdits[a.categoryId] !== undefined ? allocationEdits[a.categoryId] * 100 : a.allocatedAmountMinor), 0);
  const totalEnvelopeMinor = budget?.totalIncomeEnvelopeMinor || 520000;
  const plannedSavingsMinor = plannedSavings * 100;
  const totalPlannedOutflowMinor = totalAllocatedMinor + plannedSavingsMinor;
  const isBudgetBalanced = totalPlannedOutflowMinor <= totalEnvelopeMinor;

  const handleEditAllocation = (catId: string, val: number) => {
    setAllocationEdits(prev => ({ ...prev, [catId]: val }));
  };

  const handleSaveEdits = () => {
    const updated = allocations.map(a => ({
      ...a,
      allocatedAmountMinor: allocationEdits[a.categoryId] !== undefined ? allocationEdits[a.categoryId] * 100 : a.allocatedAmountMinor,
    }));
    saveBudgetMutation.mutate({ allocations: updated });
  };

  const handleAcceptPlan = () => {
    if (!recommendations) return;
    const updatedAllocations = (budget?.allocations || []).map(currentAlloc => {
      const rec = recommendations.allocations.find(r => r.categoryId === currentAlloc.categoryId);
      return {
        ...currentAlloc,
        allocatedAmountMinor: rec ? rec.proposedAllocatedMinor : currentAlloc.allocatedAmountMinor,
        essentialMinimumMinor: rec ? rec.essentialMinimumMinor : currentAlloc.essentialMinimumMinor,
        isEssential: rec ? rec.isEssential : currentAlloc.isEssential,
      };
    });
    setPlannedSavings(Math.round(recommendations.recommendedSavingsMinor / 100));
    saveBudgetMutation.mutate({
      allocations: updatedAllocations,
      savingsMinor: recommendations.recommendedSavingsMinor,
    });
    feedbackMutation.mutate({ recommendationId: recommendations.id, action: 'accepted' });
    setIsRecommendationDismissed(true);
    setFeedbackSuccess('AI Budget Plan accepted and successfully applied to your active allocations!');
    setTimeout(() => setFeedbackSuccess(null), 5000);
  };

  const handleDismissPlan = () => {
    if (!recommendations) return;
    feedbackMutation.mutate({
      recommendationId: recommendations.id,
      action: 'rejected',
      reason: 'User preferred custom allocation',
    });
    setIsRecommendationDismissed(true);
    setFeedbackSuccess('Budget recommendation dismissed.');
    setTimeout(() => setFeedbackSuccess(null), 4000);
  };

  // Bridge action: "Find options within this budget"
  const handleFindOptionsInBudget = (rec: BudgetRecommendationItem) => {
    // Navigate to Product Search carrying the purpose, budget headroom, and category!
    navigate(`/search?purpose=productivity&budget=${(rec.proposedAllocatedMinor / 100).toFixed(0)}&desc=${encodeURIComponent(rec.categoryName)}`);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Feature 1
          </span>
          <h1 className="text-2xl font-bold text-navy-900 mt-1.5">Smart Budget Plans</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Deterministic baseline calculations combined with structured AI optimization and essential constraint protections.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setAllocationEdits({});
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdits}
                disabled={!isBudgetBalanced || saveBudgetMutation.isPending}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm disabled:opacity-50"
              >
                {saveBudgetMutation.isPending ? 'Saving...' : 'Save Plan'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-xs font-semibold bg-navy-900 hover:bg-navy-800 text-white rounded-lg shadow-sm"
            >
              Adjust Allocations
            </button>
          )}
        </div>
      </div>

      {feedbackSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {/* Monthly Income Envelope & Envelope Balance Bar */}
      <div className="bg-white rounded-xl p-6 shadow-card border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Monthly Envelope</span>
            <div className="text-2xl font-bold text-navy-900 mt-0.5">
              ${(totalEnvelopeMinor / 100).toLocaleString()} <span className="text-xs font-normal text-slate-400">USD</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Derived from verified employer deposits ($2,600 biweekly).
            </span>
          </div>

          <div className="flex items-center space-x-6 text-xs">
            <div>
              <span className="text-slate-500 block">Allocated Categories:</span>
              <span className="font-bold text-slate-800 text-sm">${(totalAllocatedMinor / 100).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Target Savings:</span>
              <span className="font-bold text-emerald-600 text-sm">${(plannedSavingsMinor / 100).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Envelope Remaining:</span>
              <span className={`font-bold text-sm ${totalEnvelopeMinor - totalPlannedOutflowMinor < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                ${((totalEnvelopeMinor - totalPlannedOutflowMinor) / 100).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Balance Warning if Over Envelope */}
        {!isBudgetBalanced && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              Total planned spending and savings exceed your income envelope by ${((totalPlannedOutflowMinor - totalEnvelopeMinor) / 100).toFixed(0)}. Please reduce discretionary allocations.
            </span>
          </div>
        )}
      </div>

      {/* Error banner */}
      {(saveBudgetMutation.isError || feedbackMutation.isError) && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-medium flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{((saveBudgetMutation.error as any)?.message || (feedbackMutation.error as any)?.message || 'Failed to update budget plan.')}</span>
        </div>
      )}

      {/* Structured AI Recommendation Panel */}
      {recommendations && !isRecommendationDismissed && (
        <div className="bg-gradient-to-br from-navy-950 to-navy-900 text-white rounded-2xl p-6 shadow-xl border border-navy-800 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <span>AI Structured Budget Adjustments</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-navy-800 text-emerald-400 border border-emerald-500/30">
                    {recommendations.isRuleBasedFallback ? 'Deterministic Verified Rules' : 'Live Gemini Synthesis'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Calculation Model: {recommendations.calculationVersion} • Tested against verified essential minimum constraints
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleAcceptPlan}
                disabled={saveBudgetMutation.isPending}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center space-x-1 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{saveBudgetMutation.isPending ? 'Applying...' : 'Accept Plan'}</span>
              </button>
              <button
                onClick={handleDismissPlan}
                disabled={feedbackMutation.isPending}
                className="px-3 py-1.5 text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-slate-300 rounded-lg transition-colors flex items-center space-x-1 disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Dismiss</span>
              </button>
            </div>
          </div>

          <div className="bg-navy-900/80 rounded-xl p-4 border border-navy-800 text-xs text-slate-200 leading-relaxed">
            {recommendations.explanationNarrative}
          </div>

          {/* Recommendation Items Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Proposed Category Adjustments
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendations.allocations
                .filter(rec => rec.differenceMinor !== 0 || rec.categoryId === 'cat-tech')
                .map((rec) => {
                  const isDecrease = rec.differenceMinor < 0;
                  return (
                    <div
                      key={rec.categoryId}
                      className="bg-navy-900/60 p-4 rounded-xl border border-navy-800 hover:border-slate-700 transition-colors space-y-2.5"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-sm text-white">{rec.categoryName}</span>
                          {rec.isEssential && (
                            <span className="ml-2 text-[10px] bg-navy-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                              Essential Locked
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          isDecrease ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {isDecrease ? `−$${(Math.abs(rec.differenceMinor) / 100).toFixed(0)}/mo` : 'No Change'}
                        </span>
                      </div>

                      <div className="flex justify-between items-baseline text-xs font-mono">
                        <span className="text-slate-400">Current: ${(rec.currentAllocatedMinor / 100).toFixed(0)}</span>
                        <span className="text-emerald-400 font-bold">Proposed: ${(rec.proposedAllocatedMinor / 100).toFixed(0)}</span>
                      </div>

                      <p className="text-xs text-slate-400 leading-normal">
                        {rec.reason}
                      </p>

                      {/* Bridge to Feature 2: Find options within this budget */}
                      {rec.categoryId === 'cat-tech' && (
                        <div className="pt-1">
                          <button
                            onClick={() => handleFindOptionsInBudget(rec)}
                            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            <span>Find tech options within this ${(rec.proposedAllocatedMinor / 100).toFixed(0)} budget</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {recommendations && isRecommendationDismissed && (
        <div className="flex items-center justify-between p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            AI structured budget recommendations are currently dismissed for this view.
          </span>
          <button
            onClick={() => setIsRecommendationDismissed(false)}
            className="text-navy-900 font-semibold hover:underline"
          >
            Show Recommendations
          </button>
        </div>
      )}

      {/* Category Allocations Cards with Essential Constraint Markers */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-navy-900">Category Allocations</h3>
          <span className="text-xs text-slate-500">
            Essential categories feature verified baseline minimum constraint locks.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allocations.map((alloc) => {
            const currentVal = allocationEdits[alloc.categoryId] !== undefined
              ? allocationEdits[alloc.categoryId]
              : alloc.allocatedAmountMinor / 100;
            const spent = alloc.actualSpentMinor;
            const percentage = alloc.allocatedAmountMinor > 0 ? Math.round((spent / alloc.allocatedAmountMinor) * 100) : 0;
            const isOver = spent > alloc.allocatedAmountMinor;
            const isWarning = percentage >= 85 && !isOver;

            return (
              <div
                key={alloc.categoryId}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-card space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{alloc.categoryName}</h4>
                    {alloc.isEssential && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded mt-1 border border-slate-200">
                        <Lock className="w-3 h-3 text-slate-500" />
                        Min: ${(alloc.essentialMinimumMinor / 100).toFixed(0)}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-bold ${
                    isOver ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {percentage}% spent
                  </span>
                </div>

                {isEditing ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Monthly Allocation ($)
                    </label>
                    <input
                      type="number"
                      min={alloc.essentialMinimumMinor / 100}
                      value={currentVal}
                      onChange={(e) => handleEditAllocation(alloc.categoryId, parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="text-lg font-bold text-navy-900">
                      ${(alloc.allocatedAmountMinor / 100).toFixed(0)}{' '}
                      <span className="text-xs text-slate-400 font-normal">
                        (spent ${(spent / 100).toFixed(0)})
                      </span>
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
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

    </div>
  );
};
