import React, { useEffect, useState } from 'react';
import { GraduationCap, ShieldCheck, Database, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const Footer = () => {
  const [dbStatus, setDbStatus] = useState('CHECKING');

  useEffect(() => {
    api.health
      .check()
      .then((res) => {
        setDbStatus(res.database === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED');
      })
      .catch(() => {
        setDbStatus('DISCONNECTED');
      });
  }, []);

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white text-slate-600 text-xs py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-700 flex items-center justify-center text-white">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 text-sm">ExamEase</span>
            </div>
            <p className="text-slate-500 max-w-sm">
              College Software Engineering SAT II Assessment Implementation. Full-stack examination
              slot reservation with real-time capacity management, atomic transactions, and audit trail.
            </p>
          </div>

          <div>
            <span className="font-semibold text-slate-800 text-xs uppercase tracking-wider block mb-2">
              System Specification
            </span>
            <ul className="space-y-1 text-slate-500 text-xs">
              <li>Stack: MERN (React 19, Express, MongoDB)</li>
              <li>Currency: INR (₹ Indian Rupee)</li>
              <li>Rules: BR1 – BR10 Verified</li>
              <li>Tests: T1 – T12 Automated Vitest</li>
            </ul>
          </div>

          <div>
            <span className="font-semibold text-slate-800 text-xs uppercase tracking-wider block mb-2">
              Assessment Health
            </span>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  dbStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              <span className="text-xs font-mono text-slate-700">
                MongoDB: {dbStatus}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Role-Based Access Enforced</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-[11px]">
          <div>
            © 2026 ExamEase SAT II Assessment. Synthetic demonstration dataset.
          </div>
          <div>
            College Examination Registration Platform • Academic Confidential
          </div>
        </div>
      </div>
    </footer>
  );
};
