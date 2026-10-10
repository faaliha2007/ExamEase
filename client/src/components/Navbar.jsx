import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Calendar,
  Layers,
  Shield,
  LogOut,
  LogIn,
  User,
  ChevronDown,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout, switchAccount, demoAccounts } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDemoMenuOpen, setIsDemoMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleDemoSwitch = async (email) => {
    setIsDemoMenuOpen(false);
    setIsMobileMenuOpen(false);
    await switchAccount(email);
    if (email.includes('admin')) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const navLinks = [
    { label: 'Explore Slots', path: '/dashboard', icon: Layers },
    ...(isAuthenticated
      ? [{ label: 'My Bookings', path: '/my-bookings', icon: Calendar }]
      : []),
    ...(isAdmin
      ? [{ label: 'Admin Portal', path: '/admin', icon: Shield, badge: 'ADMIN' }]
      : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Wordmark & Graduation Cap Icon */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus:outline-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-800 transition-colors">
              <GraduationCap className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
                ExamEase
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-500">
                Examination Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-sm bg-purple-100 text-purple-700 border border-purple-200">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Demo Switcher & User Profile */}
          <div className="hidden md:flex items-center gap-3">
            {/* Demo Switcher Quick Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDemoMenuOpen(!isDemoMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors"
                title="Switch demo account"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Demo Switcher</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isDemoMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
                  <div className="px-3 py-1.5 border-b border-slate-100 mb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Instant Demo Accounts
                  </div>
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => handleDemoSwitch(acc.email)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        user?.email === acc.email
                          ? 'bg-blue-50 text-blue-800 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900">{acc.name}</div>
                        <div className="text-[11px] text-slate-500">{acc.email}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                          acc.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {acc.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800 leading-tight">
                    {user?.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Demo Login</span>
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(link.path)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Quick Role Switch
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleDemoSwitch(acc.email)}
                  className="text-left px-3 py-2 text-xs bg-slate-50 hover:bg-blue-50 rounded-lg flex justify-between items-center"
                >
                  <span>{acc.name}</span>
                  <span className="font-mono text-[10px] text-slate-500">{acc.role}</span>
                </button>
              ))}
            </div>
          </div>

          {isAuthenticated && (
            <div className="pt-2">
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-center py-2 text-xs text-rose-600 font-semibold bg-rose-50 rounded-lg"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
