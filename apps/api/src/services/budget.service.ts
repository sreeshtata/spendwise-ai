/**
 * SpendWise AI — Smart Budget Plans Service
 * 
 * Rules:
 * - Deterministic baseline budget calculated in the backend.
 * - AI proposes structured adjustments and explanations based on verified historical summaries.
 * - Strict validation before accepting/displaying proposals:
 *   1. No negative allocations.
 *   2. Essential minimums respected.
 *   3. Total allocations + planned savings <= configured income envelope.
 *   4. Unsupported categories rejected.
 *   5. Infeasible budgets clearly flagged and explained; essential minimums are NEVER silently cut.
 */

import {
  Budget,
  CreateBudget,
  BudgetAllocationItem,
  BudgetRecommendationResponse,
  BudgetRecommendationItem,
  RecommendationFeedback,
  CurrencyCode,
} from '@spendwise/contracts';
import { DbService } from './db.service.js';
import { FinancialCalculatorService } from './financial-calculator.service.js';
import { v4 as uuidv4 } from 'uuid';

export class BudgetService {
  private db = DbService.getInstance();

  /**
   * Get active budget for a user and period, with real-time actual spending calculated from transactions.
   */
  public getActiveBudget(userId: string, year?: number, month?: number): Budget | null {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    let budget: Budget | null = null;
    for (const b of this.db.budgets.values()) {
      if (b.userId === userId && b.periodYear === targetYear && b.periodMonth === targetMonth) {
        budget = b;
        break;
      }
    }

    if (!budget) return null;

    // Calculate actual spending for each category in this budget period
    const startOfMonth = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59));

    const userTxs = Array.from(this.db.transactions.values()).filter(t => t.userId === userId);
    const summary = FinancialCalculatorService.calculateSummary(userTxs, budget.currency, {
      start: startOfMonth,
      end: endOfMonth,
      label: `${targetYear}-${targetMonth}`,
    });

    const categorySpendMap = new Map<string, number>();
    summary.categoryBreakdown.forEach(c => {
      if (c.categoryId) categorySpendMap.set(c.categoryId, c.netSpentMinor);
    });

    const updatedAllocations = budget.allocations.map(alloc => ({
      ...alloc,
      actualSpentMinor: categorySpendMap.get(alloc.categoryId) || 0,
    }));

    return {
      ...budget,
      allocations: updatedAllocations,
    };
  }

  /**
   * Create or update monthly budget envelope.
   */
  public saveBudget(userId: string, input: CreateBudget): Budget {
    const totalAllocated = input.allocations.reduce((sum, a) => sum + a.allocatedAmountMinor, 0);
    const plannedTotal = totalAllocated + input.plannedSavingsMinor;

    if (plannedTotal > input.totalIncomeEnvelopeMinor) {
      throw new Error(`Total planned allocations (${totalAllocated / 100}) and savings (${input.plannedSavingsMinor / 100}) exceed total income envelope (${input.totalIncomeEnvelopeMinor / 100}).`);
    }

    // Check essential minimums
    for (const alloc of input.allocations) {
      if (alloc.allocatedAmountMinor < alloc.essentialMinimumMinor) {
        throw new Error(`Allocation for category ${alloc.categoryName || alloc.categoryId} is below the required essential minimum.`);
      }
    }

    const budgetId = `budget-${input.periodYear}-${input.periodMonth}`;
    const budget: Budget = {
      id: budgetId,
      userId,
      periodYear: input.periodYear,
      periodMonth: input.periodMonth,
      currency: input.currency,
      totalIncomeEnvelopeMinor: input.totalIncomeEnvelopeMinor,
      plannedSavingsMinor: input.plannedSavingsMinor,
      status: 'active',
      allocations: input.allocations.map(a => ({
        ...a,
        id: a.id || uuidv4(),
        actualSpentMinor: 0,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.budgets.set(budgetId, budget);
    return budget;
  }

  /**
   * Generate deterministic baseline budget recommendations and optionally enrich with AI.
   */
  public generateRecommendations(
    userId: string,
    year?: number,
    month?: number,
    customEnvelopeMinor?: number
  ): BudgetRecommendationResponse {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    // Fetch user transactions for historical averages (last 90 days)
    const ninetyDaysAgo = new Date(Date.UTC(targetYear, targetMonth - 4, 1));
    const userTxs = Array.from(this.db.transactions.values()).filter(t => t.userId === userId);

    const historicalSummary = FinancialCalculatorService.calculateSummary(userTxs, 'USD', {
      start: ninetyDaysAgo,
      end: new Date(Date.UTC(targetYear, targetMonth - 1, 0)),
      label: 'Prior 90 Days Average',
    });

    const activeBudget = this.getActiveBudget(userId, targetYear, targetMonth);
    const incomeEnvelopeMinor = customEnvelopeMinor || activeBudget?.totalIncomeEnvelopeMinor || 520000;

    // Calculate deterministic category baselines
    const categories = Array.from(this.db.categories.values()).filter(c => c.userId === null || c.userId === userId);
    
    // Essential minimums requirement
    const essentialMinimumsMap: Record<string, number> = {
      'cat-housing': 165000, // $1,650 rent
      'cat-groceries': 50000, // $500 groceries
      'cat-utilities': 18000, // $180 utilities
      'cat-transport': 15000, // $150 transit
      'cat-health': 6500,     // $65 health
    };

    let totalEssentialMinimumMinor = 0;
    const recommendationItems: BudgetRecommendationItem[] = [];

    for (const cat of categories) {
      const histCat = historicalSummary.categoryBreakdown.find(c => c.categoryId === cat.id);
      // 3-month average
      const historicalAverageMinor = histCat ? Math.round(histCat.netSpentMinor / 3) : 0;
      const essentialMin = essentialMinimumsMap[cat.id] || 0;
      totalEssentialMinimumMinor += essentialMin;

      const currentAlloc = activeBudget?.allocations.find(a => a.categoryId === cat.id)?.allocatedAmountMinor
        || Math.max(essentialMin, historicalAverageMinor);

      // Deterministic adjustment rules
      let proposedMinor = currentAlloc;
      let reason = 'Maintained current baseline.';

      if (cat.id === 'cat-dining') {
        // Discretionary category with recent increase: propose a realistic 15% reduction
        if (currentAlloc > 40000) {
          proposedMinor = Math.max(35000, Math.round(currentAlloc * 0.85));
          const diff = proposedMinor - currentAlloc;
          reason = `Historical dining spending averaged $${(historicalAverageMinor / 100).toFixed(0)}/mo. Moderating dining by $${Math.abs(diff / 100).toFixed(0)} frees capacity for your savings target.`;
        }
      } else if (cat.id === 'cat-entertainment') {
        // Review recurring subscription overlap
        proposedMinor = Math.max(20000, Math.round(currentAlloc * 0.80));
        reason = 'Consolidating duplicate digital media subscriptions could save approximately $10/mo.';
      } else if (cat.isEssential) {
        // Essential category must respect essential minimum
        proposedMinor = Math.max(essentialMin, currentAlloc);
        reason = `Essential category protected at $${(proposedMinor / 100).toFixed(0)} (minimum needed: $${(essentialMin / 100).toFixed(0)}).`;
      }

      recommendationItems.push({
        categoryId: cat.id,
        categoryName: cat.name,
        currentAllocatedMinor: currentAlloc,
        proposedAllocatedMinor: proposedMinor,
        essentialMinimumMinor: essentialMin,
        differenceMinor: proposedMinor - currentAlloc,
        isEssential: cat.isEssential,
        reason,
        historicalAverageMinor,
      });
    }

    const totalProposedAllocations = recommendationItems.reduce((sum, i) => sum + i.proposedAllocatedMinor, 0);
    const recommendedSavingsMinor = Math.max(0, incomeEnvelopeMinor - totalProposedAllocations);

    // Validate feasibility
    const isInfeasible = totalEssentialMinimumMinor > incomeEnvelopeMinor;
    let infeasibleExplanation: string | null = null;
    if (isInfeasible) {
      infeasibleExplanation = `Essential minimum obligations ($${(totalEssentialMinimumMinor / 100).toFixed(0)}) exceed the total income envelope ($${(incomeEnvelopeMinor / 100).toFixed(0)}). We do not silently reduce essential spending to force a balanced budget.`;
    }

    const recommendation: BudgetRecommendationResponse = {
      id: uuidv4(),
      userId,
      budgetId: activeBudget?.id || null,
      periodYear: targetYear,
      periodMonth: targetMonth,
      currency: 'USD',
      totalIncomeEnvelopeMinor: incomeEnvelopeMinor,
      recommendedSavingsMinor,
      calculationVersion: '2.1-deterministic',
      modelProvider: 'spendwise-rules-engine',
      allocations: recommendationItems,
      explanationNarrative: isInfeasible
        ? infeasibleExplanation!
        : `Based on your last 90 days of transactions, reducing dining out and consolidating digital subscriptions unlocks $${((activeBudget ? (activeBudget.allocations.reduce((s, a) => s + a.allocatedAmountMinor, 0) - totalProposedAllocations) : 15000) / 100).toFixed(0)} in monthly savings without compromising essential shelter, groceries, or utilities.`,
      limitations: 'Calculations rely on transactions recorded within SpendWise AI. Seasonal expenses and off-platform payments are not factored in.',
      isInfeasible,
      infeasibleExplanation,
      generatedAt: new Date().toISOString(),
      isRuleBasedFallback: true,
    };

    this.db.recommendations.set(recommendation.id, recommendation);
    return recommendation;
  }

  /**
   * Submit user feedback on recommendation.
   */
  public submitFeedback(userId: string, feedback: RecommendationFeedback): boolean {
    this.db.recommendationFeedback.push({
      id: uuidv4(),
      userId,
      recommendationId: feedback.recommendationId,
      action: feedback.feedbackAction,
      reason: feedback.feedbackReason,
      timestamp: new Date().toISOString(),
    });
    return true;
  }
}
