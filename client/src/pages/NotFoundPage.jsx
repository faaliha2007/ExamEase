import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="text-center max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
        <h2 className="text-lg font-bold text-slate-800">Page Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested URL does not correspond to an active examination portal route.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            Explore Slots
          </Link>
        </div>
      </div>
    </div>
  );
};
