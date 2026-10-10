import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Shield,
  User,
  ArrowRight,
  KeyRound,
  AlertCircle,
  Sparkles,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DemoLoginPage = () => {
  const { login, demoAccounts } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRole, setSelectedRole] = useState('USER');
  const [selectedEmail, setSelectedEmail] = useState('user1@examease.demo');
  const [password, setPassword] = useState('DemoUser123!');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle role switch
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setErrorMessage('');
    if (role === 'ADMIN') {
      setSelectedEmail('admin@examease.demo');
      setPassword('DemoAdmin123!');
    } else {
      setSelectedEmail('user1@examease.demo');
      setPassword('DemoUser123!');
    }
  };

  // Handle account switch
  const handleAccountSelect = (email) => {
    setSelectedEmail(email);
    setErrorMessage('');
    if (email === 'admin@examease.demo') {
      setSelectedRole('ADMIN');
      setPassword('DemoAdmin123!');
    } else {
      setSelectedRole('USER');
      setPassword('DemoUser123!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await login(selectedEmail, password);
      if (res.success) {
        if (res.user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from);
        }
      } else {
        setErrorMessage(res.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-50/60">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center text-white mx-auto shadow-xs">
            <GraduationCap className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sign In to ExamEase
          </h1>
          <p className="text-xs text-slate-500">
            Select a verified demo account or enter your assessment credentials
          </p>
        </div>

        {/* Role Segmented Switcher */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Step 1: Choose Application Role
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleRoleChange('USER')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                selectedRole === 'USER'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Candidate (USER)</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('ADMIN')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                selectedRole === 'ADMIN'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Controller (ADMIN)</span>
            </button>
          </div>
        </div>

        {/* Account Selector Cards */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Step 2: Select Synthetic Identity
          </label>
          <div className="grid grid-cols-1 gap-2">
            {demoAccounts
              .filter((acc) => (selectedRole === 'ADMIN' ? acc.role === 'ADMIN' : acc.role === 'USER'))
              .map((acc) => {
                const isSelected = selectedEmail === acc.email;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleAccountSelect(acc.email)}
                    className={`w-full text-left p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">{acc.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">{acc.email}</div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address (Server Enforced)
            </label>
            <input
              type="email"
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Demo Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-2xs flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : `Sign In as ${selectedRole}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
          <strong>Security Note:</strong> Simulated authentication issues a signed JWT session. Backend middleware verifies identity and enforces ownership restrictions on every request.
        </div>
      </div>
    </div>
  );
};
