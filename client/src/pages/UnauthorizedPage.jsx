import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UnauthorizedPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="text-center max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">403 Forbidden</h1>
        <h2 className="text-base font-bold text-slate-800">
          Access Restricted (BR10 Enforced)
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Your current session role is <strong>{user?.role || 'GUEST'}</strong>. This section requires Administrator controller credentials or ownership rights.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Switch to Admin Account</span>
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            Candidate Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
