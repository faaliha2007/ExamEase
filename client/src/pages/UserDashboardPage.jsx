import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Clock,
  Sparkles,
  ArrowRight,
  Layers,
  Calendar,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const UserDashboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [userBookingsCount, setUserBookingsCount] = useState(0);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await api.resources.getAll({
        search: searchTerm,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        minAvailability: onlyAvailable ? 1 : undefined,
      });
      if (res.resources) setResources(res.resources);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [selectedCategory, onlyAvailable]);

  useEffect(() => {
    if (isAuthenticated) {
      api.reservations
        .getMy()
        .then((res) => {
          if (res.reservations) setUserBookingsCount(res.reservations.length);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResources();
  };

  // Extract unique categories (standard categories plus any newly created slot categories)
  const standardCategories = [
    'Computer Science & Engineering SAT II',
    'Advanced Data Structures & Algorithms SAT II',
    'General Engineering Aptitude SAT II',
    'Full-Stack Software Architecture SAT II',
    'Database Systems & Cloud Engineering SAT II',
  ];
  const categories = [
    'ALL',
    ...new Set([...standardCategories, ...resources.map((r) => r.category).filter(Boolean)]),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Overview Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Examination Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Available Examination Slots
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {isAuthenticated
              ? `Logged in as ${user?.name}. Explore verified exam slots and register with guaranteed seat reservation.`
              : 'Browse accredited slots. Log in to reserve your examination seat with atomic capacity safety.'}
          </p>
        </div>

        {isAuthenticated && (
          <Link
            to="/my-bookings"
            className="shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all text-xs"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold">
              {userBookingsCount}
            </div>
            <div>
              <div className="font-bold text-slate-900">My Reservations</div>
              <div className="text-slate-500 text-[11px]">View Active & History</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by Slot ID (e.g. R101) or Title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 max-w-xs truncate"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>In Stock Only</span>
            </label>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </div>
        </form>
      </div>

      {/* Slots Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl border border-slate-200" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No examination slots found</h3>
          <p className="text-xs text-slate-500">
            Try resetting your search query or removing the category filter.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('ALL');
              setOnlyAvailable(false);
              fetchResources();
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline pt-2"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((slot) => {
            const isAvailable = slot.availability > 0;
            return (
              <div
                key={slot.resourceId}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between p-6 ${
                  isAvailable
                    ? 'border-slate-200 hover:border-blue-400 hover:shadow-md'
                    : 'border-slate-200/70 bg-slate-50/40 opacity-80'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                      {slot.resourceId}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isAvailable
                          ? slot.availability <= 3
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-teal-50 text-teal-800 border border-teal-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isAvailable
                        ? `${slot.availability} Seat${slot.availability > 1 ? 's' : ''} Left`
                        : 'Fully Booked'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">{slot.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{slot.category}</p>
                  </div>

                  {slot.schedule && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Date: {slot.schedule.examDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Time: {slot.schedule.startTime} – {slot.schedule.endTime}
                        </span>
                      </div>
                    </div>
                  )}

                  {!isAvailable && (
                    <div className="flex items-center gap-2 p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg text-rose-700 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Capacity exhausted. Check back for cancellations.</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Candidate Rate</span>
                    <span className="text-xl font-extrabold text-slate-900">
                      ₹{slot.rate.toFixed(2)}
                    </span>
                  </div>

                  <Link
                    to={isAvailable ? `/book?slot=${slot.resourceId}` : '#'}
                    className={`px-4 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors ${
                      isAvailable
                        ? 'bg-blue-700 hover:bg-blue-800 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span>{isAvailable ? 'Book Slot' : 'Unavailable'}</span>
                    {isAvailable && <ArrowRight className="w-3.5 h-3.5" />}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
