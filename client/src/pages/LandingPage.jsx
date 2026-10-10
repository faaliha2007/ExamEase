import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Sparkles,
  Users,
  Search,
  CalendarCheck,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const LandingPage = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, switchAccount, demoAccounts } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.resources
      .getAll()
      .then((res) => {
        if (res.resources) setResources(res.resources);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleQuickDemo = async (email) => {
    await switchAccount(email);
    if (email.includes('admin')) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Editorial Hero Section */}
      <section className="relative overflow-hidden bg-radial from-blue-50/70 via-[#fbfbfa] to-[#fbfbfa] border-b border-slate-200/80 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>SAT II Examination Registration System</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Your next milestone starts here.
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
              Discover examination slots, book confidently, and keep every reservation organized.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/dashboard"
                id="explore-slots-cta"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-base shadow-sm hover:shadow-md transition-all group"
              >
                <span>Explore Exam Slots</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base border border-slate-300 shadow-2xs transition-colors"
              >
                <Users className="w-4 h-4 text-slate-500" />
                <span>Demo Access</span>
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-medium text-slate-500 max-w-lg mx-auto">
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Real-Time Concurrency Check</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Atomic Seat Guarantee</span>
              </div>
              <div className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-purple-600" />
                <span>Immutable Fare Snapshot</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Examination Slots Live Preview */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 block mb-1">
              Live Capacity
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Official Examination Slots
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Accredited slots for the SAT II Software Engineering Assessment. Seed data R101 – R105.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="text-sm font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All with Filters</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-slate-200/60 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.slice(0, 3).map((slot) => {
              const isAvailable = slot.availability > 0;
              return (
                <div
                  key={slot.resourceId}
                  className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow p-6 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-md bg-slate-100 text-slate-700">
                        {slot.resourceId}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          isAvailable
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isAvailable ? `${slot.availability} Seats Left` : 'Sold Out'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">{slot.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{slot.category}</p>

                    {slot.schedule && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {slot.schedule.examDate} • {slot.schedule.startTime}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Rate per candidate</span>
                      <span className="text-xl font-bold text-slate-900">
                        ₹{slot.rate.toFixed(2)}
                      </span>
                    </div>
                    <Link
                      to={isAvailable ? `/book?slot=${slot.resourceId}` : '#'}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                        isAvailable
                          ? 'bg-blue-700 hover:bg-blue-800 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isAvailable ? 'Select Slot' : 'Unavailable'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* How It Works Stepper Overview */}
      <section className="bg-slate-50/80 border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-1">
              Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Three Steps to Secure Your Exam Slot
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">Choose Slot & Quantity</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Filter by technical category, review current capacity, and choose 1 to 5 seats. Concurrency protections ensure no overselling.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-base">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">Candidate Validation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter candidate name, strict 10-digit phone number, exam date, and roll number. Fare calculation is snapshotted immediately.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">Instant Confirmed Docket</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Obtain a unique booking reference (e.g. EXM-XXXXXX), track status transitions, or cancel with one click if needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Accounts Quick-Launch Panel */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
          <div className="max-w-2xl mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 block mb-1">
              Assessment Sandbox
            </span>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Instant Demo Access for SAT II Evaluators
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Test candidate booking, isolation between users, and administrator stage advancement without manual registration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {demoAccounts.map((acc) => (
              <div
                key={acc.email}
                className="border border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between bg-slate-50/50"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                        acc.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {acc.role}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Demo Account</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{acc.name}</h4>
                  <div className="text-xs font-mono text-slate-500 mt-1">{acc.email}</div>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickDemo(acc.email)}
                  className="mt-4 w-full py-2 px-3 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Launch Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
