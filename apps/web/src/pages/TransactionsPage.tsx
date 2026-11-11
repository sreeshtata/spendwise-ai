import React, { useState, useMemo } from 'react';
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

  // Load Transactions with search filters
  const { data: txResponse, isLoading, refetch } = useQuery({
    queryKey: ['transactions', { query: searchQuery, categoryId: selectedCategory || undefined }],
    queryFn: () =>
      sdkClient.transactions.list({
        query: searchQuery || undefined,
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
      return sdkClient.transactions.create({
        merchant: newMerchant,
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

      {/* Manual Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-navy-900">Add New Transaction</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Merchant Name</label>
                <input
                  type="text"
                  placeholder="e.g. Whole Foods Market"
                  value={newMerchant}
                  onChange={(e) => setNewMerchant(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Amount ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="45.00"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="refund">Refund</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
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

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => addMutation.mutate()}
                disabled={!newMerchant || !newAmount || addMutation.isPending}
                className="px-4 py-2 text-xs font-semibold bg-navy-900 text-white rounded-lg hover:bg-navy-800 disabled:opacity-50"
              >
                {addMutation.isPending ? 'Saving...' : 'Save Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal with Preview and Formula Injection Defense */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Import Transactions via CSV</span>
            </h3>
            
            <p className="text-xs text-slate-500">
              CSV data is verified server-side with formula injection defense and line-by-line format validation.
            </p>

            {!csvPreviewData ? (
              <div className="space-y-3">
                <textarea
                  rows={6}
                  placeholder={`Merchant,Amount,Currency,Type,Date\nTrader Joe's,74.50,USD,expense,2024-03-12\nDirect Deposit,2600.00,USD,income,2024-03-15`}
                  value={csvRawText}
                  onChange={(e) => setCsvRawText(e.target.value)}
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-800"
                />

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setIsCsvModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => csvPreviewMutation.mutate(csvRawText)}
                    disabled={!csvRawText.trim() || csvPreviewMutation.isPending}
                    className="px-4 py-2 text-xs font-semibold bg-navy-900 text-white rounded-lg hover:bg-navy-800 disabled:opacity-50"
                  >
                    {csvPreviewMutation.isPending ? 'Validating...' : 'Preview Validation'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">Validation Summary:</span>
                  <div className="flex space-x-3">
                    <span className="text-emerald-700 font-bold">{csvPreviewData.validCount} Valid</span>
                    <span className="text-red-600 font-bold">{csvPreviewData.errorCount} Errors</span>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2">Row</th>
                        <th className="p-2">Merchant</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {csvPreviewData.rows.map((row: any) => (
                        <tr key={row.rowIndex} className={row.isValid ? 'bg-white' : 'bg-red-50'}>
                          <td className="p-2 font-mono text-slate-500">{row.rowIndex}</td>
                          <td className="p-2 font-medium">{row.merchant}</td>
                          <td className="p-2">${(row.amountMinor / 100).toFixed(2)}</td>
                          <td className="p-2 uppercase">{row.transactionType}</td>
                          <td className="p-2">
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

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setCsvPreviewData(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Back to Edit
                  </button>
                  <button
                    onClick={() => {
                      const validRows = csvPreviewData.rows.filter((r: any) => r.isValid);
                      csvCommitMutation.mutate(validRows);
                    }}
                    disabled={csvPreviewData.validCount === 0 || csvCommitMutation.isPending}
                    className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg disabled:opacity-50"
                  >
                    {csvCommitMutation.isPending ? 'Importing...' : `Commit ${csvPreviewData.validCount} Transactions`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
