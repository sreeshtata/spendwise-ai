import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  TrendingUp,
  ListFilter,
  Settings,
  CreditCard,
  User,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { getActiveUserToken, setAppUser } from '../../services/api';

interface NavbarProps {
  onOpenTestCheckout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenTestCheckout }) => {
  const location = useLocation();
  const [currentUser, setCurrentUserState] = useState(getActiveUserToken());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleUserChange = (user: 'demo-user-1' | 'demo-user-2') => {
    setCurrentUserState(user);
    setAppUser(user);
    window.location.reload();
  };

  // Nav links WITHOUT "Overview" (clicking the top-left logo redirects to dashboard)
  const navLinks = [
    { name: 'Smart Budget Plans', path: '/budgets', icon: Sparkles },
    { name: 'Smarter Product Search', path: '/search', icon: ShoppingBag },
    { name: 'Spending Intelligence', path: '/spending', icon: TrendingUp },
    { name: 'Transactions', path: '/transactions', icon: ListFilter },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <header className="w-full bg-[#001C3D] text-white shadow-md sticky top-0 z-40 border-b border-[#002C66]">
      <div className="w-full px-4 sm:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Big PayPal Logo & SpendWise AI Brand (Click redirects to Dashboard) */}
          <Link
            to="/"
            className="flex items-center space-x-3.5 group cursor-pointer"
            title="SpendWise AI Dashboard"
          >
            {/* Big PayPal Logo Icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-md group-hover:scale-105 transition-transform p-1.5 border border-slate-200">
              <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Authentic PayPal Double P monogram */}
                <path
                  d="M10.5 4H20C23.5 4 25.5 5.8 25 9.5C24.4 14 21.5 16.5 17.5 16.5H13.8L12.2 26.5H7.5L10.5 4Z"
                  fill="#003087"
                />
                <path
                  d="M13.8 11.5H19.5C22.5 11.5 24.2 13 23.8 16C23.2 20 20.8 22.2 17.2 22.2H14.5L13.5 28.5H9.5L11.5 16L13.8 11.5Z"
                  fill="#0079C1"
                  fillOpacity="0.9"
                />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-2xl tracking-tight text-white">
                  SpendWise
                </span>
                <span className="text-xs font-black bg-[#0070BA] text-white px-2 py-0.5 rounded-md shadow-xs tracking-wider">
                  AI
                </span>
              </div>
              <span className="text-xs text-blue-200/80 font-medium tracking-wide block -mt-0.5">
                PayPal Financial Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-base font-semibold transition-all ${
                    isActive
                      ? 'bg-[#003087] text-white shadow-inner border border-[#0070BA]/50'
                      : 'text-blue-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Switcher & Test Checkout Button */}
          <div className="hidden sm:flex items-center space-x-3.5">
            {/* Quick Sandbox Payment Trigger */}
            <button
              onClick={onOpenTestCheckout}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#0070BA] hover:bg-[#005ea6] text-white shadow-md transition-all border border-[#008CDE]/40"
              title="Test PayPal Sandbox Order & Capture"
            >
              <CreditCard className="w-4 h-4" />
              <span>Sandbox Checkout</span>
            </button>

            {/* User Switcher */}
            <div className="flex items-center space-x-2 bg-[#00142D] px-3.5 py-2 rounded-xl border border-blue-900/60 text-xs shadow-inner">
              <User className="w-4 h-4 text-[#0079C1]" />
              <select
                aria-label="Active Account"
                value={currentUser}
                onChange={(e) => handleUserChange(e.target.value as any)}
                className="bg-transparent text-slate-100 focus:outline-none cursor-pointer text-xs font-bold"
              >
                <option value="demo-user-1" className="bg-[#001C3D] text-white">Alex Morgan (Demo User 1)</option>
                <option value="demo-user-2" className="bg-[#001C3D] text-white">Jordan Lee (Demo User 2 - Private)</option>
              </select>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-blue-200 hover:text-white focus:outline-none p-2 rounded-lg hover:bg-white/10"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#00142D] border-b border-blue-900/80 px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-semibold ${
                  isActive ? 'bg-[#003087] text-white' : 'text-blue-100 hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
          <div className="pt-3 border-t border-blue-900/60 flex flex-col gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTestCheckout?.();
              }}
              className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 rounded-xl text-sm font-bold bg-[#0070BA] text-white"
            >
              <CreditCard className="w-4 h-4" />
              <span>PayPal Sandbox Checkout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
