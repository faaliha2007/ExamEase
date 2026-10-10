import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  Calendar,
  Clock,
  Building,
  Users,
  Coins,
  Sparkles,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { api } from '../services/api';

export const CreateSlotModal = ({ isOpen, onClose, onSuccess }) => {
  const [resourceId, setResourceId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Full-Stack Software Architecture SAT II');
  const [customCategory, setCustomCategory] = useState('');
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('01:00 PM');
  const [venue, setVenue] = useState('Online Assessment Lab F (Proctored)');
  const [availability, setAvailability] = useState(15);
  const [rate, setRate] = useState(799);

  const [loadingId, setLoadingId] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const standardCategories = [
    'Computer Science & Engineering SAT II',
    'Advanced Data Structures & Algorithms SAT II',
    'General Engineering Aptitude SAT II',
    'Full-Stack Software Architecture SAT II',
    'Database Systems & Cloud Engineering SAT II',
    'Custom Category...',
  ];

  const fetchNextId = async () => {
    setLoadingId(true);
    try {
      const res = await api.admin.getNextSlotId();
      if (res.nextSlotId) {
        setResourceId(res.nextSlotId);
      }
    } catch {
      setResourceId('R106');
    } finally {
      setLoadingId(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setApiError('');
      fetchNextId();

      // Default date to next week
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setExamDate(nextWeek.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!resourceId.trim()) {
      errs.resourceId = 'Slot ID is required';
    }
    if (!name.trim()) {
      errs.name = 'Examination name is required';
    }
    if (category === 'Custom Category...' && !customCategory.trim()) {
      errs.category = 'Please specify the custom category';
    }
    if (!examDate.trim()) {
      errs.examDate = 'Examination date is required';
    }
    if (!startTime.trim()) {
      errs.startTime = 'Start time is required';
    }
    if (!endTime.trim()) {
      errs.endTime = 'End time is required';
    }
    if (!venue.trim()) {
      errs.venue = 'Examination venue is required';
    }

    const availNum = Number(availability);
    if (!availability || isNaN(availNum) || !Number.isInteger(availNum) || availNum <= 0) {
      errs.availability = 'Capacity must be a positive integer greater than zero';
    }

    const rateNum = Number(rate);
    if (rate === '' || rate === null || isNaN(rateNum) || rateNum < 0) {
      errs.rate = 'Fee must be a valid non-negative number';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setApiError('');

    try {
      const resolvedCategory =
        category === 'Custom Category...' ? customCategory.trim() : category.trim();

      const payload = {
        resourceId: resourceId.trim().toUpperCase(),
        name: name.trim(),
        category: resolvedCategory,
        examDate: examDate.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        venue: venue.trim(),
        availability: Number(availability),
        rate: Number(rate),
      };

      const res = await api.admin.createSlot(payload);
      if (res.success) {
        onSuccess(res.slot || payload);
        onClose();
      }
    } catch (err) {
      setApiError(err.message || 'Failed to create slot. Please verify inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-700 flex items-center justify-center text-white shadow-2xs">
              <PlusCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Create New Examination Slot</h2>
              <p className="text-xs text-slate-500">
                Publish an accredited examination slot with automated schedule and capacity allocation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {apiError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Slot ID & Examination Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Slot ID *
                </label>
                <button
                  type="button"
                  onClick={fetchNextId}
                  disabled={loadingId}
                  className="text-[11px] text-purple-700 hover:text-purple-800 font-semibold flex items-center gap-0.5"
                  title="Auto-generate next unique ID"
                >
                  <RotateCw className={`w-3 h-3 ${loadingId ? 'animate-spin' : ''}`} />
                  <span>Auto ID</span>
                </button>
              </div>
              <input
                type="text"
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value.toUpperCase())}
                placeholder="e.g. R106"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 ${
                  errors.resourceId
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-purple-500'
                }`}
              />
              {errors.resourceId && (
                <p className="text-[11px] text-rose-600 mt-0.5">{errors.resourceId}</p>
              )}
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Examination Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Exam Slot F (Cloud Native Systems)"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-hidden focus:ring-2 ${
                  errors.name
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-purple-500'
                }`}
              />
              {errors.name && (
                <p className="text-[11px] text-rose-600 mt-0.5">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Technical Category / Stream *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            >
              {standardCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {category === 'Custom Category...' && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom engineering category..."
                className="w-full mt-2 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            )}
            {errors.category && (
              <p className="text-[11px] text-rose-600 mt-0.5">{errors.category}</p>
            )}
          </div>

          {/* Date & Time Window */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Exam Date *</span>
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm text-slate-900 focus:outline-hidden focus:ring-2 ${
                  errors.examDate
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-purple-500'
                }`}
              />
              {errors.examDate && (
                <p className="text-[11px] text-rose-600 mt-0.5">{errors.examDate}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Start Time *</span>
              </label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="e.g. 09:30 AM"
                className={`w-full px-3.5 py-2 rounded-xl border text-sm text-slate-900 focus:outline-hidden focus:ring-2 ${
                  errors.startTime
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-purple-500'
                }`}
              />
              {errors.startTime && (
                <p className="text-[11px] text-rose-600 mt-0.5">{errors.startTime}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>End Time *</span>
              </label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="e.g. 12:30 PM"
                className={`w-full px-3.5 py-2 rounded-xl border text-sm text-slate-900 focus:outline-hidden focus:ring-2 ${
                  errors.endTime
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-purple-500'
                }`}
              />
              {errors.endTime && (
                <p className="text-[11px] text-rose-600 mt-0.5">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Venue */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>Examination Venue / Lab *</span>
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Virtual Assessment Lab F / Online Proctored Portal"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-hidden focus:ring-2 ${
                errors.venue
                  ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                  : 'border-slate-300 focus:ring-purple-500'
              }`}
            />
            {errors.venue && (
              <p className="text-[11px] text-rose-600 mt-0.5">{errors.venue}</p>
            )}
          </div>

          {/* Seat Capacity & Registration Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Total Seat Capacity (Positive Integer) *</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                placeholder="e.g. 15"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono text-slate-900 focus:outline-hidden focus:ring-2 ${
                  errors.availability
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-purple-500'
                }`}
              />
              {errors.availability && (
                <p className="text-[11px] text-rose-600 mt-0.5">{errors.availability}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-slate-400" />
                <span>Registration Fee in INR (₹) *</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="e.g. 799"
                  className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 ${
                    errors.rate
                      ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-purple-500'
                  }`}
                />
              </div>
              {errors.rate && (
                <p className="text-[11px] text-rose-600 mt-0.5">{errors.rate}</p>
              )}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-4 bg-slate-50/80 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-50 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            {submitting ? (
              <span>Saving Slot to Database...</span>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Publish Examination Slot</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
