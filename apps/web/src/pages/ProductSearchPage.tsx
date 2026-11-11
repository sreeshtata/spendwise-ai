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
  CreditCard,
  Star,
  Info,
  DollarSign,
  TrendingDown,
  Sparkles,
  Tag,
  Store,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { ProductOffer } from '@spendwise/contracts';

interface ProductSearchPageProps {
  onOpenTestCheckoutWithItem: (title: string, priceMinor: number, purposeId: string, categoryId: string) => void;
}

export const ProductSearchPage: React.FC<ProductSearchPageProps> = ({ onOpenTestCheckoutWithItem }) => {
  const [searchParams] = useSearchParams();

  // Search input states (allowing any product, with or without purpose)
  const [queryDescription, setQueryDescription] = useState(
    searchParams.get('desc') || 'wireless noise cancelling headphones'
  );
  const [purchasePurposeId, setPurchasePurposeId] = useState(searchParams.get('purpose') || '');
  const [maxBudget, setMaxBudget] = useState(searchParams.get('budget') || '400');
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

  // Suggested everyday searches for comfortable testing
  const sampleSearches = [
    'iPhone 15 Pro',
    'Nike Running Shoes',
    '4K USB-C Monitor',
    'MacBook Air Laptop',
    'Espresso Coffee Machine',
    'Ergonomic Office Chair',
    'Dyson Vacuum Cleaner',
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
      headerName: 'Where to Buy Online',
      field: 'merchantName',
      width: 170,
      cellRenderer: (params: any) => (
        <a
          href={params.data.merchantUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-[#0070BA] hover:text-[#003087] flex items-center gap-1.5 hover:underline py-1"
        >
          <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{params.value}</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>
      ),
    },
    {
      headerName: 'Delivered Total',
      field: 'totalDeliveredMinor',
      width: 160,
      cellRenderer: (params: any) => {
        const isComplete = params.data.isPriceComplete;
        const total = (params.value / 100).toFixed(2);
        return (
          <div className="flex items-center space-x-2 py-1">
            <span className="font-extrabold text-[#001C3D] text-sm">${total}</span>
            <button
              onClick={() => setSelectedBreakdownOffer(params.data)}
              className="text-[11px] text-[#0070BA] underline font-semibold hover:text-[#003087]"
              title="Inspect fee & tax breakdown"
            >
              {isComplete ? 'Details' : 'Est.'}
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
      headerName: 'Online Delivery',
      field: 'deliveryDetails',
      width: 180,
      cellRenderer: (params: any) => (
        <span className="text-xs text-slate-600 truncate block py-1 font-medium">{params.value}</span>
      ),
    },
    {
      headerName: 'Customer Reviews',
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
      headerName: 'Warranty & Returns',
      field: 'warrantySummary',
      width: 160,
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
              onOpenTestCheckoutWithItem(
                params.data.title,
                params.data.totalDeliveredMinor,
                purchasePurposeId || 'purp-productivity',
                'cat-tech'
              );
            }}
            className="px-3.5 py-1.5 bg-[#0070BA] hover:bg-[#005ea6] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
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
        <div className="inline-flex items-center space-x-2 bg-blue-50 border border-[#0070BA]/30 px-3 py-1 rounded-full text-xs font-bold text-[#003087] mb-2">
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Option 2 • Multi-Merchant Online Product Search</span>
        </div>
        <h1 className="text-3xl font-black text-[#001C3D]">Smarter Product Search</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Search any product to compare delivered prices across verified online stores (Amazon, Best Buy, etc.), discover budget-saving alternatives, and simulate immediate monthly budget impact.
        </p>
      </div>

      {/* Search Input Criteria Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          {/* Product description / Search input (Takes up 6 cols) */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Product to Search <span className="text-[#0070BA] font-normal">(Works for any product you type)</span>
            </label>
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={queryDescription}
                onChange={(e) => setQueryDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type any product (e.g. iPhone, Nike shoes, 4K monitor, coffee machine, desk chair)..."
                className="w-full pl-11 pr-4 py-3 border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:border-[#0070BA] focus:outline-none"
              />
            </div>
          </div>

          {/* Purpose (Optional, auto-detect by default) */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Purpose <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <select
              value={purchasePurposeId}
              onChange={(e) => setPurchasePurposeId(e.target.value)}
              className="w-full px-3 py-3 border-2 border-slate-300 rounded-xl text-sm bg-white font-semibold text-slate-800 focus:border-[#0070BA] focus:outline-none"
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
                className="w-full px-3 py-3 border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:border-[#0070BA] focus:outline-none"
              />
              <button
                type="submit"
                disabled={searchMutation.isPending}
                className="px-6 py-3 bg-[#0070BA] hover:bg-[#005ea6] text-white rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 shrink-0"
              >
                {searchMutation.isPending ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </form>

        {/* Quick Click Everyday Product Suggestions */}
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-500 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            Try Common Products:
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
                  .then(() => {
                    searchMutation.mutate();
                  });
              }}
              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#0070BA] text-slate-700 font-semibold transition-colors border border-slate-200"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Immediate Budget Impact Simulation Card */}
      {budgetImpact && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[#001C3D] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#0070BA]" />
                Immediate Budget Headroom Impact
              </span>
              <p className="text-xs text-slate-600 mt-0.5">
                Category: <span className="font-bold text-[#001C3D]">{budgetImpact.relevantCategoryName}</span> • Purpose: <span className="font-semibold text-slate-800">{budgetImpact.relevantPurposeName}</span>
              </p>
            </div>
            {budgetImpact.differenceFromBaselineMinor ? (
              <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-full border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                <TrendingDown className="w-4 h-4 text-emerald-600" />
                <span>Alternative Saves: ${(budgetImpact.differenceFromBaselineMinor / 100).toFixed(2)}</span>
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs">
              <span className="text-slate-500 block text-xs font-medium">Category Budget:</span>
              <span className="font-black text-lg text-slate-900">${(budgetImpact.currentBudgetMinor / 100).toFixed(2)}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs">
              <span className="text-slate-500 block text-xs font-medium">Spent So Far:</span>
              <span className="font-black text-lg text-slate-700">${(budgetImpact.spentSoFarMinor / 100).toFixed(2)}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs">
              <span className="text-slate-500 block text-xs font-medium">Remaining Before:</span>
              <span className="font-black text-lg text-slate-900">${(budgetImpact.remainingBudgetBeforePurchaseMinor / 100).toFixed(2)}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs">
              <span className="text-slate-500 block text-xs font-medium">Estimated After:</span>
              <span className={`font-black text-lg ${budgetImpact.estimatedRemainingAfterPurchaseMinor < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                ${(budgetImpact.estimatedRemainingAfterPurchaseMinor / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {budgetImpact.savingsDescription && (
            <p className="text-xs text-[#001C3D] font-semibold bg-white/90 p-3 rounded-xl border border-indigo-100 flex items-center gap-2">
              <span>💡</span>
              <span>{budgetImpact.savingsDescription}</span>
            </p>
          )}
        </div>
      )}

      {/* Online Merchant Store Cards: Where It Is Available To Be Bought Online */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-[#001C3D]">
            Where to Buy Online & Price Comparison
          </h2>
          <p className="text-xs text-slate-500">
            Available online retailers with total delivered cost comparison (item price + shipping + taxes).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {sameProducts.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-2xl p-5 border-2 border-slate-200 hover:border-[#0070BA] shadow-card hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-md bg-blue-50 text-[#003087] border border-blue-200 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-[#0070BA]" />
                    {offer.merchantName}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {offer.availableQuantity} in stock
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-snug line-clamp-2">
                    {offer.title}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-slate-800">{offer.productRating}</span>
                    <span>({offer.productReviewCount?.toLocaleString()} reviews)</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Delivery:</span>
                    <span className="font-semibold text-slate-800">{offer.deliveryDetails}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Warranty:</span>
                    <span className="font-semibold text-slate-800">{offer.warrantySummary}</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Delivered:</span>
                  <span className="text-2xl font-black text-[#001C3D]">
                    ${(offer.totalDeliveredMinor / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={offer.merchantUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-[#003087] rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <span>Visit Store</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() =>
                    onOpenTestCheckoutWithItem(
                      offer.title,
                      offer.totalDeliveredMinor,
                      purchasePurposeId || 'purp-productivity',
                      'cat-tech'
                    )
                  }
                  className="px-3.5 py-2 bg-[#0070BA] hover:bg-[#005ea6] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Sandbox Test Buy</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Alternative Products (Vetted Value Options) */}
      {alternatives.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-[#001C3D] flex items-center gap-2.5">
                <span>Smart Budget-Saving Alternatives</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-3 py-0.5 rounded-full border border-emerald-300">
                  Cost-Saving Pick
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Alternative options serving the exact same purpose with lower prices to preserve budget headroom.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {alternatives.map((alt) => (
              <div
                key={alt.id}
                className="bg-white p-6 rounded-3xl border-2 border-emerald-300 shadow-card hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                        {alt.brand} • {alt.model}
                      </span>
                      <h3 className="font-bold text-base text-navy-900 mt-1">{alt.title}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-black text-slate-900">
                        ${(alt.totalDeliveredMinor / 100).toFixed(2)}
                      </div>
                      <span className="text-[11px] text-emerald-600 font-bold">Total Delivered</span>
                    </div>
                  </div>

                  {/* Alternative Suitability Explanation */}
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-950 leading-relaxed">
                    <span className="font-bold text-emerald-800">Why this saves money: </span>
                    {alt.alternativeSuitabilityReason}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Warranty:</span>
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

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <a
                    href={alt.merchantUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#0070BA] hover:text-[#003087] flex items-center gap-1 hover:underline"
                  >
                    <span>Available on {alt.merchantName}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
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
                    <span>Sandbox Test Buy</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sourced Price Breakdown Modal (Solid dimming, NO blur) */}
      {selectedBreakdownOffer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border-2 border-slate-300 space-y-4">
            <h3 className="text-base font-bold text-[#001C3D]">Total Delivered Cost Breakdown</h3>
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
                <span className="text-emerald-600 font-bold">−${(selectedBreakdownOffer.discountsMinor / 100).toFixed(2)}</span>
              </div>
              <div className="py-2.5 flex justify-between text-sm font-black border-t-2 border-slate-200 font-sans">
                <span>Total Delivered Cost:</span>
                <span className="text-[#001C3D]">${(selectedBreakdownOffer.totalDeliveredMinor / 100).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedBreakdownOffer(null)}
                className="px-5 py-2.5 bg-[#001C3D] text-white rounded-xl text-xs font-bold"
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
