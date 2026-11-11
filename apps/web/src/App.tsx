import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/layout/Navbar';
import { IntegrationStatusBar } from './components/layout/IntegrationStatusBar';
import { OverviewPage } from './pages/OverviewPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { ProductSearchPage } from './pages/ProductSearchPage';
import { SpendingIntelligencePage } from './pages/SpendingIntelligencePage';
import { SettingsPage } from './pages/SettingsPage';
import { PayPalCheckoutModal } from './components/checkout/PayPalCheckoutModal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Configurable base path (e.g. /assistant or /)
const basePath = import.meta.env.VITE_BASE_PATH || '/';

export const App: React.FC = () => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutProps, setCheckoutProps] = useState({
    title: 'Anker Space Q45 Headphones (Sandbox Demonstration)',
    priceMinor: 12039,
    purposeId: 'purp-productivity',
    categoryId: 'cat-tech',
  });

  const handleOpenCheckoutWithItem = (title: string, priceMinor: number, purposeId: string, categoryId: string) => {
    setCheckoutProps({ title, priceMinor, purposeId, categoryId });
    setIsCheckoutOpen(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={basePath}>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
          
          {/* Top Navbar */}
          <Navbar onOpenTestCheckout={() => setIsCheckoutOpen(true)} />
          
          {/* Real-time Integration Status Strip */}
          <IntegrationStatusBar />

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <Routes>
              <Route path="/" element={<OverviewPage onOpenTestCheckout={() => setIsCheckoutOpen(true)} />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/budgets" element={<BudgetsPage />} />
              <Route
                path="/search"
                element={<ProductSearchPage onOpenTestCheckoutWithItem={handleOpenCheckoutWithItem} />}
              />
              <Route path="/spending" element={<SpendingIntelligencePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-navy-900">SpendWise AI</span>
                <span>• Independent PayPal-connected Hackathon Prototype</span>
              </div>
              <div className="flex items-center space-x-4">
                <span>Features: Smart Budget Plans • Smarter Product Search • Spending Intelligence</span>
                <span>• Minor Unit Precision</span>
              </div>
            </div>
          </footer>

          {/* PayPal Sandbox Demonstration Modal */}
          <PayPalCheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            defaultItemTitle={checkoutProps.title}
            defaultPriceMinor={checkoutProps.priceMinor}
            purposeId={checkoutProps.purposeId}
            categoryId={checkoutProps.categoryId}
          />

        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
export default App;
