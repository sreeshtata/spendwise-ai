import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sdkClient } from '../services/api';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import {
  Search,
  Plus,
  Upload,
  RefreshCw,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Filter,
  FileText,
} from 'lucide-react';
import { Transaction } from '@spendwise/contracts';

export const TransactionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [csvPreviewData, setCsvPreviewData] = useState<any>(null);

  // Form state for Manual Add
  const [newMerchant, setNewMerchant] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'expense' | 'income' | 'transfer' | 'refund'>('expense');
  const [newCategory, setNewCategory] = useState('cat-dining');

  // Prevent scroll shift when modal is open
  useEffect(() => {
    if (isAddModalOpen || isCsvModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAddModalOpen, isCsvModalOpen]);

  // Load Transactions with search filters
  const { data: txResponse, isLoading, refetch } = useQuery({
    queryKey: ['transactions', { query: searchQuery.trim(), categoryId: selectedCategory || undefined }],
    queryFn: () =>
      sdkClient.transactions.list({
        query: searchQuery.trim() || undefined,
        categoryId: selectedCategory || undefined,
        limit: 100,
      }),
  });

  const transactions = txResponse?.data || [];
  const searchDriver = (txResponse as any)?.sourceDriver || 'postgresql_fallback';

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => sdkClient.transactions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['active-budget'] });
      queryClient.invalidateQueries({ queryKey: ['spending-progress'] });
    },
  });

  // Manual Add mutation
  const addMutation = useMutation({
    mutationFn: () => {
      const amountMinor = Math.round(parseFloat(newAmount) * 100);
      if (!newMerchant.trim() || isNaN(amountMinor) || amountMinor <= 0) {
        return Promise.reject(new Error('Please enter a valid merchant name and amount.'));
      }
      return sdkClient.transactions.create({
        merchant: newMerchant.trim(),
        amountMinor,
        currency: 'USD',
        transactionType: newType,
        categoryId: newCategory,
        occurredAt: new Date().toISOString(),
        source: 'manual',
      });
    },
    onSuccess: () => {
      setIsAddModalOpen(false);
      setNewMerchant('');
      setNewAmount('');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['active-budget'] });
    },
    onError: (err: unknown) => {
      // Error is displayed inline; no silent abort
      console.error('[AddTransaction] Failed:', err);
    },
  });

  // CSV Preview mutation
  const csvPreviewMutation = useMutation({
    mutationFn: (csvContent: string) => sdkClient.transactions.importCsvPreview(csvContent),
    onSuccess: (data) => {
      setCsvPreviewData(data);
    },
  });

  // CSV Commit mutation
  const csvCommitMutation = useMutation({
    mutationFn: (validRows: any[]) => {
      const payload = validRows.map((r) => ({
        merchant: r.merchant,
        amountMinor: r.amountMinor,
        currency: r.currency,
        transactionType: r.transactionType,
        occurredAt: r.occurredAt,
        source: 'import' as const,
      }));
      return sdkClient.transactions.importCsvCommit(payload);
    },
    onSuccess: () => {
      setIsCsvModalOpen(false);
      setCsvPreviewData(null);
      setCsvRawText('');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['active-budget'] });
    },
  });

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<Transaction>[]>(() => [
    {
      headerName: 'Date',
      field: 'occurredAt',
      width: 130,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      },
    },
    {
      headerName: 'Merchant',
      field: 'merchant',
      flex: 1,
      minWidth: 180,
      cellRenderer: (params: any) => (
        <span className="font-semibold text-slate-800">{params.value}</span>
      ),
    },
    {
      headerName: 'Category',
      field: 'categoryName',
      width: 160,
      cellRenderer: (params: any) => (
        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium border border-slate-200">
          {params.value || 'Uncategorized'}
        </span>
      ),
    },
    {
      headerName: 'Type',
      field: 'transactionType',
      width: 110,
      cellRenderer: (params: any) => {
        const type = params.value;
        const colorClass =
          type === 'income'
            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
            : type === 'refund'
            ? 'bg-blue-100 text-blue-800 border-blue-200'
            : type === 'transfer'
            ? 'bg-purple-100 text-purple-800 border-purple-200'
            : 'bg-slate-100 text-slate-700 border-slate-200';
        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase border ${colorClass}`}>
            {type}
          </span>
        );
      },
    },
    {
      headerName: 'Amount',
      field: 'amountMinor',
      width: 130,
      cellRenderer: (params: any) => {
        const isIncome = params.data?.transactionType === 'income';
        const isRefund = params.data?.transactionType === 'refund';
        const formatted = `$${((params.value || 0) / 100).toFixed(2)}`;
        const sign = isIncome ? '+' : isRefund ? '−' : '';
        const textColor = isIncome ? 'text-emerald-600 font-bold' : isRefund ? 'text-blue-600 font-semibold' : 'text-slate-900 font-semibold';
        return <span className={textColor}>{sign}{formatted}</span>;
      },
    },
    {
      headerName: 'Source',
      field: 'source',
      width: 110,
      cellRenderer: (params: any) => (
        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
          params.value === 'sandbox' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
        }`}>
          {params.value}
        </span>
      ),
    },
    {
      headerName: 'Actions',
      width: 80,
      cellRenderer: (params: any) => (
        <button
          onClick={() => deleteMutation.mutate(params.data.id)}
          className="text-slate-400 hover:text-red-600 p-1 transition-colors"
          title="Delete Transaction"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ], []);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Transactions Ledger</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Verified, user-isolated transactions powered by AG Grid Community and Elasticsearch search fallback.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold bg-navy-900 hover:bg-navy-800 text-white rounded-lg shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Elasticsearch / Multi-field Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search transactions by merchant, description, or category (Elasticsearch query)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-800"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="cat-housing">Housing & Rent</option>
            <option value="cat-groceries">Groceries & Food</option>
            <option value="cat-dining">Dining & Drinks</option>
            <option value="cat-tech">Tech & Electronics</option>
            <option value="cat-utilities">Utilities & Bills</option>
            <option value="cat-health">Health & Fitness</option>
            <option value="cat-entertainment">Entertainment & Subs</option>
          </select>

          <span className="text-[11px] px-2 py-1 bg-slate-100 rounded text-slate-600 border border-slate-200 whitespace-nowrap">
            Driver: <span className="font-semibold text-navy-900">{searchDriver === 'elasticsearch' ? 'Elasticsearch' : 'Postgres Fallback'}</span>
          </span>
        </div>
      </div>

      {/* AG Grid Community Transaction Table */}
      <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden">
        <div className="ag-theme-alpine w-full h-[520px]">
          <AgGridReact
            rowData={transactions}
            columnDefs={columnDefs}
            pagination={true}
            paginationPageSize={15}
            paginationPageSizeSelector={[15, 30, 50]}
            animateRows={true}
            rowHeight={46}
            headerHeight={44}
          />
        </div>
      </div>

      {/* Manual Add Modal (Portaled directly to document.body with 100% uniform seamless dimming) */}
      {isAddModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] w-screen h-screen bg-[#000a17]/85 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border border-slate-200 space-y-6 relative z-10 animate-in zoom-in-95 duration-150">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-2xl font-black text-[#001C3D]">Add New Transaction</h3>
              <p className="text-xs text-slate-500 mt-1">Record a manual verified transaction into your spending ledger.</p>
            </div>
            
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-extrabold text-[#001C3D] uppercase tracking-wider block mb-1.5">
                  Merchant Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Whole Foods Market"
                  value={newMerchant}
                  onChange={(e) => setNewMerchant(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:border-[#0070BA] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-extrabold text-[#001C3D] uppercase tracking-wider block mb-1.5">
                    Amount ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="45.00"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:border-[#0070BA] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-[#001C3D] uppercase tracking-wider block mb-1.5">
                    Transaction Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-900 bg-white focus:border-[#0070BA] focus:outline-none"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="refund">Refund</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-extrabold text-[#001C3D] uppercase tracking-wider block mb-1.5">
                  Budget Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-900 bg-white focus:border-[#0070BA] focus:outline-none"
                >
                  <option value="cat-groceries">Groceries & Food</option>
                  <option value="cat-dining">Dining & Drinks</option>
                  <option value="cat-tech">Tech & Electronics</option>
                  <option value="cat-utilities">Utilities & Bills</option>
                  <option value="cat-housing">Housing & Rent</option>
                  <option value="cat-health">Health & Fitness</option>
                  <option value="cat-entertainment">Entertainment & Subs</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
              {/* Inline error message */}
              {addMutation.isError && (
                <span className="flex-1 text-xs text-red-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {(addMutation.error as Error)?.message || 'Failed to save. Please retry.'}
                </span>
              )}
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => addMutation.mutate()}
                disabled={!newMerchant || !newAmount || addMutation.isPending}
                className="px-6 py-2.5 text-xs font-bold bg-[#0070BA] hover:bg-[#005ea6] text-white rounded-xl disabled:opacity-50 transition-colors shadow-md"
              >
                {addMutation.isPending ? 'Saving...' : 'Save Transaction'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CSV Import Modal with Preview (Portaled directly to document.body) */}
      {isCsvModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] w-screen h-screen bg-[#000a17]/85 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCsvModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border border-slate-200 space-y-5 relative z-10 animate-in zoom-in-95 duration-150">
            <h3 className="text-xl font-black text-[#001C3D] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0070BA]" />
              <span>Import Transactions via CSV</span>
            </h3>
            
            <p className="text-xs text-slate-500">
              CSV data is verified server-side with formula injection defense and line-by-line format validation.
            </p>

            {!csvPreviewData ? (
              <div className="space-y-4">
                <textarea
                  rows={6}
                  placeholder={`Merchant,Amount,Currency,Type,Date\nTrader Joe's,74.50,USD,expense,2024-03-12\nDirect Deposit,2600.00,USD,income,2024-03-15`}
                  value={csvRawText}
                  onChange={(e) => setCsvRawText(e.target.value)}
                  className="w-full p-4 font-mono text-xs border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#0070BA]"
                />

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsCsvModalOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => csvPreviewMutation.mutate(csvRawText)}
                    disabled={!csvRawText.trim() || csvPreviewMutation.isPending}
                    className="px-6 py-2.5 text-xs font-bold bg-[#0070BA] hover:bg-[#005ea6] text-white rounded-xl shadow-md disabled:opacity-50"
                  >
                    {csvPreviewMutation.isPending ? 'Validating...' : 'Preview Validation'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700">Validation Summary:</span>
                  <div className="flex space-x-3">
                    <span className="text-emerald-700 font-extrabold">{csvPreviewData.validCount} Valid</span>
                    <span className="text-red-600 font-extrabold">{csvPreviewData.errorCount} Errors</span>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">Row</th>
                        <th className="p-2.5">Merchant</th>
                        <th className="p-2.5">Amount</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {csvPreviewData.rows.map((row: any) => (
                        <tr key={row.rowIndex} className={row.isValid ? 'bg-white' : 'bg-red-50'}>
                          <td className="p-2.5 font-mono text-slate-500">{row.rowIndex}</td>
                          <td className="p-2.5 font-semibold text-slate-800">{row.merchant}</td>
                          <td className="p-2.5">${(row.amountMinor / 100).toFixed(2)}</td>
                          <td className="p-2.5 uppercase font-medium">{row.transactionType}</td>
                          <td className="p-2.5">
                            {row.isValid ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                              </span>
                            ) : (
                              <span className="text-red-600 font-semibold">{row.validationErrors.join(', ')}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => setCsvPreviewData(null)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300"
                  >
                    Back to Edit
                  </button>
                  <button
                    onClick={() => {
                      const validRows = csvPreviewData.rows.filter((r: any) => r.isValid);
                      csvCommitMutation.mutate(validRows);
                    }}
                    disabled={csvPreviewData.validCount === 0 || csvCommitMutation.isPending}
                    className="px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md disabled:opacity-50"
                  >
                    {csvCommitMutation.isPending ? 'Importing...' : `Commit ${csvPreviewData.validCount} Transactions`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
