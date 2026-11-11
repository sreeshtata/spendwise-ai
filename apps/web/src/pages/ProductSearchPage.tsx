import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sdkClient } from '../services/api';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import {
  Search,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Star,
  Info,
  DollarSign,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ProductOffer, ProductSearchResponse } from '@spendwise/contracts';

interface ProductSearchPageProps {
  onOpenTestCheckoutWithItem: (title: string, priceMinor: number, purposeId: string, categoryId: string) => void;
}

export const ProductSearchPage: React.FC<ProductSearchPageProps> = ({ onOpenTestCheckoutWithItem }) => {
  const [searchParams] = useSearchParams();

  // Search input states
  const [queryDescription, setQueryDescription] = useState(searchParams.get('desc') || 'wireless noise cancelling headphones for productivity');
  const [purchasePurposeId, setPurchasePurposeId] = useState(searchParams.get('purpose') === 'productivity' ? 'purp-productivity' : 'purp-productivity');
  const [maxBudget, setMaxBudget] = useState(searchParams.get('budget') || '400');
  const [selectedOffer, setSelectedOffer] = useState<ProductOffer | null>(null);
  const [selectedBreakdownOffer, setSelectedBreakdownOffer] = useState<ProductOffer | null>(null);

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: () =>
      sdkClient.products.search({
        queryDescription,
        purchasePurposeId,
        maxBudgetMinor: maxBudget ? parseInt(maxBudget, 10) * 100 : undefined,
        currency: 'USD',
        quantity: 1,
        deliveryCountry: 'US',
      }),
  });

  // Run initial search automatically
  useEffect(() => {
    searchMutation.mutate();
  }, []);

  const searchData = searchMutation.data;
  const sameProducts = searchData?.sameProductOffers || [];
  const alternatives = searchData?.alternativeOffers || [];
  const budgetImpact = searchData?.budgetImpact;

  // Set default selected offer for budget impact preview
  useEffect(() => {
    if (sameProducts.length > 0 && !selectedOffer) {
      setSelectedOffer(sameProducts[0]);
    }
  }, [sameProducts]);

  // AG Grid Column Definitions (9 required columns from Section 9)
  const productColumnDefs = useMemo<ColDef<ProductOffer>[]>(() => [
    {
      headerName: 'Brand & Model',
      field: 'model',
      width: 170,
      cellRenderer: (params: any) => (
        <div>
          <div className="font-bold text-slate-900 leading-tight">{params.data.brand}</div>
          <div className="text-xs text-slate-500">{params.value}</div>
        </div>
      ),
    },
    {
      headerName: 'Merchant & Link',
      field: 'merchantName',
      width: 150,
      cellRenderer: (params: any) => (
        <a
          href={params.data.merchantUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-navy-800 hover:text-navy-900 flex items-center gap-1 hover:underline"
        >
          <span>{params.value}</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>
      ),
    },
    {
      headerName: 'Total Delivered Cost',
      field: 'totalDeliveredMinor',
      width: 170,
      cellRenderer: (params: any) => {
        const isComplete = params.data.isPriceComplete;
        const total = (params.value / 100).toFixed(2);
        return (
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-900 text-sm">${total}</span>
            <button
              onClick={() => setSelectedBreakdownOffer(params.data)}
              className="text-[10px] text-blue-600 underline font-medium hover:text-blue-800"
              title="Inspect fee & tax breakdown"
            >
              {isComplete ? 'Breakdown' : 'Estimated'}
            </button>
          </div>
        );
      },
    },
    {
      headerName: 'Stock',
      field: 'availableQuantity',
      width: 90,
      cellRenderer: (params: any) => (
        <span className="text-xs font-semibold text-slate-700">{params.value} units</span>
      ),
    },
    {
      headerName: 'Specs & Evidence',
      field: 'specs',
      flex: 1,
      minWidth: 200,
      cellRenderer: (params: any) => {
        const specs = params.value || {};
        const summary = Object.entries(specs)
          .slice(0, 2)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' • ');
        return <span className="text-xs text-slate-600 truncate block">{summary}</span>;
      },
    },
    {
      headerName: 'Public Reviews',
      field: 'productRating',
      width: 160,
      cellRenderer: (params: any) => {
        if (!params.value) return <span className="text-xs text-slate-400">No public rating</span>;
        return (
          <div className="text-xs flex items-center space-x-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-slate-800">{params.value}</span>
            <span className="text-[10px] text-slate-400">({params.data.productReviewCount?.toLocaleString()})</span>
            <span className="text-[10px] text-slate-400 ml-1">[{params.data.ratingSourceName?.split(' ')[0]}]</span>
          </div>
        );
      },
    },
    {
      headerName: 'Warranty',
      field: 'warrantySummary',
      width: 140,
      cellRenderer: (params: any) => (
        <span className="text-xs text-slate-600 truncate block">{params.value}</span>
      ),
    },
    {
      headerName: 'Return Policy',
      field: 'returnPolicy',
      width: 140,
      cellRenderer: (params: any) => (
        <span className="text-xs text-slate-600 truncate block">{params.value}</span>
      ),
    },
    {
      headerName: 'Delivery',
      field: 'deliveryDetails',
      width: 140,
      cellRenderer: (params: any) => (
        <span className="text-xs text-slate-600 truncate block">{params.value}</span>
      ),
    },
    {
      headerName: 'Action',
      width: 150,
      pinned: 'right',
      cellRenderer: (params: any) => (
        <div className="flex items-center space-x-1.5 py-1">
          <button
            onClick={() => {
              setSelectedOffer(params.data);
              onOpenTestCheckoutWithItem(
                params.data.title,
                params.data.totalDeliveredMinor,
                purchasePurposeId,
                'cat-tech'
              );
            }}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-sm"
          >
            <CreditCard className="w-3 h-3" />
            <span>Test Buy</span>
          </button>
        </div>
      ),
    },
  ], [purchasePurposeId, onOpenTestCheckoutWithItem]);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          Feature 2
        </span>
        <h1 className="text-2xl font-bold text-navy-900 mt-1.5">Smarter Product Search</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Channel3 merchant comparison with verified total delivered cost, sourced review attribution, and instant budget impact simulation.
        </p>
      </div>

      {/* Search Input Criteria Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Product Description & Requirement
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={queryDescription}
                onChange={(e) => setQueryDescription(e.target.value)}
                placeholder="e.g. noise cancelling wireless headphones for focus"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Purchase Purpose
            </label>
            <select
              value={purchasePurposeId}
              onChange={(e) => setPurchasePurposeId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium text-slate-800 focus:outline-none"
            >
              <option value="purp-productivity">Work Productivity & Setup</option>
              <option value="purp-sustenance">Daily Sustenance & Meals</option>
              <option value="purp-living">Living & Shelter</option>
              <option value="purp-leisure">Dining & Social Leisure</option>
              <option value="purp-wellness">Fitness & Physical Health</option>
              <option value="purp-entertainment">Media & Digital Subscriptions</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Max Budget ($ USD)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="400"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
              />
              <button
                onClick={() => searchMutation.mutate()}
                disabled={searchMutation.isPending}
                className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold shadow disabled:opacity-50"
              >
                {searchMutation.isPending ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>

        {/* Coverage Disclosure */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Search results aggregated via Channel3 merchant network adapter. External merchant links are outbound; PayPal Sandbox provides clearly separated test checkouts.
          </span>
        </div>
      </div>

      {/* Immediate Budget Impact Simulation Card */}
      {budgetImpact && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                Immediate Budget Impact Calculation
              </span>
              <p className="text-xs text-slate-600 mt-0.5">
                Simulating purchase effect on Category: <span className="font-semibold text-navy-900">{budgetImpact.relevantCategoryName}</span>
              </p>
            </div>
            {budgetImpact.differenceFromBaselineMinor && (
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Potential Savings: ${(budgetImpact.differenceFromBaselineMinor / 100).toFixed(2)}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <span className="text-slate-500 block">Monthly Budget:</span>
              <span className="font-bold text-base text-slate-900">${(budgetImpact.currentBudgetMinor / 100).toFixed(2)}</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <span className="text-slate-500 block">Spent So Far:</span>
              <span className="font-bold text-base text-slate-700">${(budgetImpact.spentSoFarMinor / 100).toFixed(2)}</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <span className="text-slate-500 block">Remaining Before Purchase:</span>
              <span className="font-bold text-base text-slate-900">${(budgetImpact.remainingBudgetBeforePurchaseMinor / 100).toFixed(2)}</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <span className="text-slate-500 block">Estimated Remaining After:</span>
              <span className={`font-bold text-base ${budgetImpact.estimatedRemainingAfterPurchaseMinor < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                ${(budgetImpact.estimatedRemainingAfterPurchaseMinor / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {budgetImpact.savingsDescription && (
            <p className="text-xs text-indigo-900 font-medium bg-white/70 p-2 rounded border border-indigo-100">
              💡 {budgetImpact.savingsDescription}
            </p>
          )}
        </div>
      )}

      {/* Section 1: Same Product, Different Merchants (AG Grid) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-navy-900">
              Same Product, Different Merchants
            </h3>
            <p className="text-xs text-slate-500">
              Matched model and variant comparison across authorized retailers with total delivered cost calculations.
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {sameProducts.length} Offers Available
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden">
          <div className="ag-theme-alpine w-full h-[320px]">
            <AgGridReact
              rowData={sameProducts}
              columnDefs={productColumnDefs}
              rowHeight={50}
              headerHeight={44}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Alternative Products (Vetted Value Options) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <span>Alternative Products</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                High Value Vetted
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Alternative options serving the exact same purchase purpose, clearly differentiated to prevent confusion.
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {alternatives.length} Alternatives Found
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alternatives.map((alt) => (
            <div
              key={alt.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-card hover:border-emerald-500/50 transition-all space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                    {alt.brand} • {alt.model}
                  </span>
                  <h4 className="font-bold text-base text-navy-900 mt-0.5">{alt.title}</h4>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900">
                    ${(alt.totalDeliveredMinor / 100).toFixed(2)}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">Total Delivered</span>
                </div>
              </div>

              {/* Alternative Suitability Explanation */}
              <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-lg text-xs text-emerald-900 leading-relaxed">
                <span className="font-bold">Why this alternative: </span>
                {alt.alternativeSuitabilityReason}
              </div>

              {/* Specs & Reviews preview */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Warranty & Return:</span>
                  <span className="font-medium text-slate-700">{alt.warrantySummary}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Sourced Rating:</span>
                  <div className="flex items-center gap-1 font-semibold text-slate-800">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{alt.productRating} ({alt.productReviewCount?.toLocaleString()} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <a
                  href={alt.merchantUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-navy-800 hover:text-navy-900 flex items-center gap-1 hover:underline"
                >
                  <span>Visit {alt.merchantName}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                <button
                  onClick={() =>
                    onOpenTestCheckoutWithItem(
                      alt.title,
                      alt.totalDeliveredMinor,
                      purchasePurposeId,
                      'cat-tech'
                    )
                  }
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Sandbox Demonstration Buy</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sourced Price Breakdown Modal */}
      {selectedBreakdownOffer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-navy-900">Total Delivered Cost Breakdown</h3>
            <p className="text-xs text-slate-500">{selectedBreakdownOffer.title} ({selectedBreakdownOffer.merchantName})</p>

            <div className="divide-y divide-slate-100 text-xs font-mono">
              <div className="py-2 flex justify-between">
                <span className="font-sans text-slate-600">Item Subtotal:</span>
                <span className="font-bold">${(selectedBreakdownOffer.itemSubtotalMinor / 100).toFixed(2)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="font-sans text-slate-600">Shipping:</span>
                <span>{selectedBreakdownOffer.shippingMinor > 0 ? `$${(selectedBreakdownOffer.shippingMinor / 100).toFixed(2)}` : 'Free ($0.00)'}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="font-sans text-slate-600">Estimated Taxes:</span>
                <span>${(selectedBreakdownOffer.taxesMinor / 100).toFixed(2)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="font-sans text-slate-600">Applicable Discounts:</span>
                <span className="text-emerald-600">−${(selectedBreakdownOffer.discountsMinor / 100).toFixed(2)}</span>
              </div>
              <div className="py-2.5 flex justify-between text-sm font-bold border-t-2 border-slate-200 font-sans">
                <span>Total Delivered Cost:</span>
                <span className="text-navy-900">${(selectedBreakdownOffer.totalDeliveredMinor / 100).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedBreakdownOffer(null)}
                className="px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
