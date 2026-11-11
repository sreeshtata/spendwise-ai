import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sdkClient } from '../../services/api';
import { X, CreditCard, ShieldCheck, CheckCircle2, ArrowRight, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

interface PayPalCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultItemTitle?: string;
  defaultPriceMinor?: number;
  defaultCurrency?: 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD';
  purposeId?: string;
  categoryId?: string;
}

export const PayPalCheckoutModal: React.FC<PayPalCheckoutModalProps> = ({
  isOpen,
  onClose,
  defaultItemTitle = 'Anker Soundcore Space Q45 Headphones',
  defaultPriceMinor = 12039, // $120.39
  defaultCurrency = 'USD',
  purposeId = 'purp-productivity',
  categoryId = 'cat-tech',
}) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'create' | 'approve' | 'success'>('create');
  const [orderData, setOrderData] = useState<any>(null);
  const [captureResult, setCaptureResult] = useState<any>(null);
  const [itemTitle, setItemTitle] = useState(defaultItemTitle);
  const [priceMinor, setPriceMinor] = useState(defaultPriceMinor);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setItemTitle(defaultItemTitle);
      setPriceMinor(defaultPriceMinor);
      setStep('create');
      setOrderData(null);
      setCaptureResult(null);
      setErrorMessage(null);
    }
  }, [isOpen, defaultItemTitle, defaultPriceMinor]);

  // 1. Create PayPal Order Mutation
  const createOrderMutation = useMutation({
    mutationFn: () =>
      sdkClient.paypal.createOrder({
        itemDescription: itemTitle,
        amountMinor: priceMinor,
        currency: defaultCurrency,
        purposeId,
        categoryId,
        idempotencyKey: `checkout-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      }),
    onSuccess: (data) => {
      setOrderData(data);
      setStep('approve');
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to create PayPal sandbox order.');
    },
  });

  // 2. Capture PayPal Order Mutation
  const captureOrderMutation = useMutation({
    mutationFn: () =>
      sdkClient.paypal.captureOrder({
        paypalOrderId: orderData.paypalOrderId,
      }),
    onSuccess: (data) => {
      setCaptureResult(data);
      setStep('success');
      // Invalidate queries so dashboard, transactions, and budgets immediately reflect the new purchase!
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['active-budget'] });
      queryClient.invalidateQueries({ queryKey: ['spending-progress'] });
      queryClient.invalidateQueries({ queryKey: ['peer-spending'] });
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to capture PayPal sandbox order.');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden transform transition-all">
        
        {/* Header */}
        <div className="bg-navy-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">PayPal Sandbox Demonstration</h3>
              <p className="text-xs text-slate-300">Independent test merchant payment environment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Notice banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
            <span className="font-semibold">Notice:</span> This workflow uses PayPal Sandbox to record a verified test purchase. It will update your active budget and transaction ledger without actual bank debits.
          </div>

          {step === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Product / Purchase Description
                </label>
                <input
                  type="text"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Delivered Amount
                  </label>
                  <div className="text-lg font-bold text-slate-900 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                    ${(priceMinor / 100).toFixed(2)} {defaultCurrency}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Environment
                  </label>
                  <div className="text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>PayPal Sandbox</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => createOrderMutation.mutate()}
                  disabled={createOrderMutation.isPending}
                  className="w-full py-2.5 px-4 bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-semibold text-sm shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Sandbox Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Initialize PayPal Order</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'approve' && orderData && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="font-mono text-xs font-semibold text-slate-800">{orderData.paypalOrderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Item:</span>
                  <span className="font-medium text-slate-800">{orderData.itemDescription}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                  <span className="text-slate-700">Total:</span>
                  <span className="text-navy-900">${(orderData.amountMinor / 100).toFixed(2)} {orderData.currency}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                In a live PayPal integration, the buyer approves in the PayPal popup. In this test environment, click "Simulate Buyer Approval & Capture" to execute backend capture.
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => captureOrderMutation.mutate()}
                  disabled={captureOrderMutation.isPending}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-sm shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {captureOrderMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Capturing & Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simulate Buyer Approval & Capture</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && captureResult && (
            <div className="space-y-4 text-center py-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Payment Captured Successfully</h4>
                <p className="text-xs text-slate-500 mt-1">Transaction recorded exactly once in database ledger.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left text-xs space-y-1.5 font-mono">
                <div><span className="text-slate-400 font-sans">Capture ID: </span><span className="text-slate-800 font-bold">{captureResult.captureId}</span></div>
                <div><span className="text-slate-400 font-sans">Transaction ID: </span><span className="text-slate-800">{captureResult.transactionId}</span></div>
                <div><span className="text-slate-400 font-sans">Amount: </span><span className="text-emerald-700 font-bold">${(captureResult.amountMinor / 100).toFixed(2)} {captureResult.currency}</span></div>
                <div><span className="text-slate-400 font-sans">Status: </span><span className="text-emerald-700 font-semibold">{captureResult.status}</span></div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    onClose();
                    setStep('create');
                  }}
                  className="w-full py-2.5 px-4 bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-semibold text-sm"
                >
                  Done — View Updated Spending
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
