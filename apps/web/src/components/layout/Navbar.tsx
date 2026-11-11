import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  PieChart,
  ListFilter,
  Settings,
  CreditCard,
  User,
  ExternalLink,
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
    window.location.reload(); // Reload to refresh all queries for selected user
  };

  const navLinks = [
    { name: 'Overview', path: '/', icon: PieChart },
    { name: 'Transactions', path: '/transactions', icon: ListFilter },
    { name: 'Smart Budget Plans', path: '/budgets', icon: Sparkles },
    { name: 'Smarter Product Search', path: '/search', icon: ShoppingBag },
    { name: 'Spending Intelligence', path: '/spending', icon: TrendingUp },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <header className="bg-navy-900 text-white shadow-md sticky top-0 z-40 border-b border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-5 h-5 text-navy-950 font-bold" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                  SpendWise <span className="text-xs bg-navy-800 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/30">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 block -mt-1">PayPal Hackathon Edition</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-navy-800 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Switcher & Test Checkout Button */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Quick Sandbox Payment Trigger */}
            <button
              onClick={onOpenTestCheckout}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
              title="Test PayPal Sandbox Order & Capture"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Sandbox Checkout</span>
            </button>

            {/* User Switcher (For Demonstrating Strict Cross-User Isolation) */}
            <div className="flex items-center space-x-2 bg-navy-800/80 px-2.5 py-1 rounded-md border border-slate-700/60 text-xs">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <select
                aria-label="Active Account"
                value={currentUser}
                onChange={(e) => handleUserChange(e.target.value as any)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs font-medium"
              >
                <option value="demo-user-1" className="bg-navy-900 text-white">Alex Morgan (Demo User 1)</option>
                <option value="demo-user-2" className="bg-navy-900 text-white">Jordan Lee (Demo User 2 - Private)</option>
              </select>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-300 hover:text-white focus:outline-none p-1"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-navy-950 border-b border-navy-800 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-navy-800 text-emerald-400' : 'text-slate-300 hover:bg-navy-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-navy-800 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTestCheckout?.();
              }}
              className="flex items-center justify-center space-x-2 w-full px-3 py-2 rounded-md text-sm font-semibold bg-emerald-600 text-white"
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
