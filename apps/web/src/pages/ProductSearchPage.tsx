import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
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
  Tag,
} from 'lucide-react';
import { ProductOffer } from '@spendwise/contracts';

interface ProductSearchPageProps {
  onOpenTestCheckoutWithItem: (title: string, priceMinor: number, purposeId: string, categoryId: string) => void;
}

export const ProductSearchPage: React.FC<ProductSearchPageProps> = ({ onOpenTestCheckoutWithItem }) => {
  const [searchParams] = useSearchParams();

  // Search input states (allowing any product, with or without purpose)
  const [queryDescription, setQueryDescription] = useState(
    searchParams.get('desc') || 'wireless noise cancelling headphones for productivity'
  );
  const [purchasePurposeId, setPurchasePurposeId] = useState(searchParams.get('purpose') || '');
  const [maxBudget, setMaxBudget] = useState(searchParams.get('budget') || '400');
  const [selectedOffer, setSelectedOffer] = useState<ProductOffer | null>(null);
  const [selectedBreakdownOffer, setSelectedBreakdownOffer] = useState<ProductOffer | null>(null);

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: () =>
      sdkClient.products.search({
        queryDescription: queryDescription.trim() || 'essential products',
        purchasePurposeId: purchasePurposeId ? purchasePurposeId : undefined,
        maxBudgetMinor: maxBudget && parseInt(maxBudget, 10) > 0 ? parseInt(maxBudget, 10) * 100 : undefined,
        currency: 'USD',
        quantity: 1,
        deliveryCountry: 'US',
      }),
  });

  // Run initial search automatically
  useEffect(() => {
    searchMutation.mutate();
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (queryDescription.trim()) {
      searchMutation.mutate();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  const searchData = searchMutation.data;
  const sameProducts = searchData?.sameProductOffers || [];
  const alternatives = searchData?.alternativeOffers || [];
  const budgetImpact = searchData?.budgetImpact;

  // Set default selected offer for budget impact preview
  useEffect(() => {
    if (sameProducts.length > 0) {
      setSelectedOffer(sameProducts[0]);
    } else if (alternatives.length > 0) {
      setSelectedOffer(alternatives[0]);
    }
  }, [sameProducts, alternatives]);

  // Suggested popular searches for comfortable testing
  const sampleSearches = [
    'Noise Cancelling Headphones',
    '4K USB-C Monitor',
    'MacBook Air Laptop',
    'Running Shoes',
    'Espresso Coffee Machine',
    'Ergonomic Office Chair',
    'Mechanical Keyboard',
    'Air Purifier',
  ];

  // AG Grid Column Definitions
  const productColumnDefs = useMemo<ColDef<ProductOffer>[]>(() => [
    {
      headerName: 'Brand & Model',
      field: 'model',
      width: 180,
      cellRenderer: (params: any) => (
        <div className="py-1">
          <div className="font-bold text-slate-900 leading-tight">{params.data.brand}</div>
          <div className="text-xs text-slate-500 truncate">{params.value}</div>
        </div>
      ),
    },
    {
      headerName: 'Merchant & Link',
      field: 'merchantName',
      width: 160,
      cellRenderer: (params: any) => (
        <a
          href={params.data.merchantUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-navy-800 hover:text-navy-900 flex items-center gap-1 hover:underline py-1"
        >
          <span>{params.value}</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
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
          <div className="flex items-center space-x-2 py-1">
            <span className="font-bold text-slate-900 text-sm">${total}</span>
            <button
              onClick={() => setSelectedBreakdownOffer(params.data)}
              className="text-[11px] text-blue-600 underline font-medium hover:text-blue-800"
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
      width: 95,
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
        return <span className="text-xs text-slate-600 truncate block py-1">{summary}</span>;
      },
    },
    {
      headerName: 'Public Reviews',
      field: 'productRating',
      width: 165,
      cellRenderer: (params: any) => {
        if (!params.value) return <span className="text-xs text-slate-400">No public rating</span>;
        return (
          <div className="text-xs flex items-center space-x-1 py-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
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
        <span className="text-xs text-slate-600 truncate block py-1">{params.value}</span>
      ),
    },
    {
      headerName: 'Return Policy',
      field: 'returnPolicy',
      width: 140,
      cellRenderer: (params: any) => (
        <span className="text-xs text-slate-600 truncate block py-1">{params.value}</span>
      ),
    },
    {
      headerName: 'Delivery',
      field: 'deliveryDetails',
      width: 140,
      cellRenderer: (params: any) => (
        <span className="text-xs text-slate-600 truncate block py-1">{params.value}</span>
      ),
    },
    {
      headerName: 'Action',
      width: 140,
      pinned: 'right',
      cellRenderer: (params: any) => (
        <div className="flex items-center space-x-1.5 py-1">
          <button
            onClick={() => {
              setSelectedOffer(params.data);
              onOpenTestCheckoutWithItem(
                params.data.title,
                params.data.totalDeliveredMinor,
                purchasePurposeId || 'purp-productivity',
                'cat-tech'
              );
            }}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Test Buy</span>
          </button>
        </div>
      ),
    },
  ], [purchasePurposeId, onOpenTestCheckoutWithItem]);

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold text-blue-700 mb-2">
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Feature 2 • Channel3 Multi-Merchant Discovery</span>
        </div>
        <h1 className="text-3xl font-extrabold text-navy-950">Smarter Product Search</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Search any product across verified merchant networks. View transparent delivered costs (including shipping, taxes, and discounts), explore vetted cost-saving alternatives, and simulate immediate monthly budget impact.
        </p>
      </div>

      {/* Search Input Criteria Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          {/* Product description / Search input (Takes up 6 cols) */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Product Name or Keywords <span className="text-slate-400 font-normal">(Works for any product)</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={queryDescription}
                onChange={(e) => setQueryDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search any product (e.g. shoes, 4K monitor, coffee machine, laptop)..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Purpose (Optional, auto-detect by default) */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Purchase Purpose <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <select
              value={purchasePurposeId}
              onChange={(e) => setPurchasePurposeId(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="">Any Purpose / Auto-Detect</option>
              <option value="purp-productivity">Work Productivity & Setup</option>
              <option value="purp-sustenance">Daily Sustenance & Meals</option>
              <option value="purp-living">Living & Shelter</option>
              <option value="purp-leisure">Dining & Social Leisure</option>
              <option value="purp-wellness">Fitness & Physical Health</option>
              <option value="purp-entertainment">Media & Digital Subscriptions</option>
            </select>
          </div>

          {/* Max Budget (Optional) */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Max Budget ($ USD)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="400"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={searchMutation.isPending}
                className="px-5 py-2.5 bg-navy-950 hover:bg-navy-900 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 shrink-0"
              >
                {searchMutation.isPending ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </form>

        {/* Quick Click Search Suggestions */}
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            Quick Searches:
          </span>
          {sampleSearches.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQueryDescription(s);
                sdkClient.products
                  .search({
                    queryDescription: s,
                    purchasePurposeId: purchasePurposeId || undefined,
                    currency: 'USD',
                    quantity: 1,
                    deliveryCountry: 'US',
                  })
                  .then((res) => {
                    searchMutation.mutate();
                  });
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors border border-slate-200"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Coverage Disclosure */}
        <div className="flex items-center space-x-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Channel3 aggregated verified merchant network. External merchant links are outbound links; PayPal Sandbox provides clearly separated test checkout capabilities.
          </span>
        </div>
      </div>

      {/* Immediate Budget Impact Simulation Card */}
      {budgetImpact && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Immediate Budget Impact Simulation
              </span>
              <p className="text-xs text-slate-600 mt-0.5">
                Targeting Category: <span className="font-bold text-navy-950">{budgetImpact.relevantCategoryName}</span> • Purpose: <span className="font-semibold text-slate-800">{budgetImpact.relevantPurposeName}</span>
              </p>
            </div>
            {budgetImpact.differenceFromBaselineMinor ? (
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-full border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                <TrendingDown className="w-4 h-4 text-emerald-600" />
                <span>Potential Savings: ${(budgetImpact.differenceFromBaselineMinor / 100).toFixed(2)}</span>
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-3.5 rounded-xl border border-blue-100/80 shadow-xs">
              <span className="text-slate-500 block text-xs">Category Budget:</span>
              <span className="font-bold text-lg text-slate-900">${(budgetImpact.currentBudgetMinor / 100).toFixed(2)}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-blue-100/80 shadow-xs">
              <span className="text-slate-500 block text-xs">Spent So Far:</span>
              <span className="font-bold text-lg text-slate-700">${(budgetImpact.spentSoFarMinor / 100).toFixed(2)}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-blue-100/80 shadow-xs">
              <span className="text-slate-500 block text-xs">Remaining Before:</span>
              <span className="font-bold text-lg text-slate-900">${(budgetImpact.remainingBudgetBeforePurchaseMinor / 100).toFixed(2)}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-blue-100/80 shadow-xs">
              <span className="text-slate-500 block text-xs">Estimated After:</span>
              <span className={`font-bold text-lg ${budgetImpact.estimatedRemainingAfterPurchaseMinor < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                ${(budgetImpact.estimatedRemainingAfterPurchaseMinor / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {budgetImpact.savingsDescription && (
            <p className="text-xs text-indigo-950 font-medium bg-white/80 p-3 rounded-xl border border-indigo-100 flex items-center gap-2">
              <span>💡</span>
              <span>{budgetImpact.savingsDescription}</span>
            </p>
          )}
        </div>
      )}

      {/* Section 1: Same Product, Different Merchants (AG Grid) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-navy-950">
              Same Product, Multiple Merchants
            </h3>
            <p className="text-xs text-slate-500">
              Direct model match across authorized retailers with transparent delivered cost calculations.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {sameProducts.length} Retailer Offers Available
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          <div className="ag-theme-alpine w-full h-[320px]">
            <AgGridReact
              rowData={sameProducts}
              columnDefs={productColumnDefs}
              rowHeight={52}
              headerHeight={44}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Alternative Products (Vetted Value Options) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-navy-950 flex items-center gap-2.5">
              <span>Smart Vetted Alternatives</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-0.5 rounded-full border border-emerald-300">
                High Value Vetted
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              High-value alternative options serving the exact same purchase purpose, clearly differentiated to protect budget headroom.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {alternatives.length} Alternatives Found
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {alternatives.map((alt) => (
            <div
              key={alt.id}
              className="bg-white p-6 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 shadow-card hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                      {alt.brand} • {alt.model}
                    </span>
                    <h4 className="font-bold text-base text-navy-900 mt-1">{alt.title}</h4>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-extrabold text-slate-900">
                      ${(alt.totalDeliveredMinor / 100).toFixed(2)}
                    </div>
                    <span className="text-[11px] text-emerald-600 font-bold">Total Delivered</span>
                  </div>
                </div>

                {/* Alternative Suitability Explanation */}
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-950 leading-relaxed">
                  <span className="font-bold text-emerald-800">Why this alternative: </span>
                  {alt.alternativeSuitabilityReason}
                </div>

                {/* Specs & Reviews preview */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Warranty & Return:</span>
                    <span className="font-medium text-slate-800">{alt.warrantySummary}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Verified Rating:</span>
                    <div className="flex items-center gap-1 font-bold text-slate-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      <span>{alt.productRating} ({alt.productReviewCount?.toLocaleString()} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <a
                  href={alt.merchantUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-navy-900 hover:text-blue-700 flex items-center gap-1 hover:underline"
                >
                  <span>Visit {alt.merchantName}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <button
                  onClick={() =>
                    onOpenTestCheckoutWithItem(
                      alt.title,
                      alt.totalDeliveredMinor,
                      purchasePurposeId || 'purp-productivity',
                      'cat-tech'
                    )
                  }
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Sandbox Demonstration Buy</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sourced Price Breakdown Modal */}
      {selectedBreakdownOffer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
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
                className="px-4 py-2 bg-navy-900 text-white rounded-xl text-xs font-bold"
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
