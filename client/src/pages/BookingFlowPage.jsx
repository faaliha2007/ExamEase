import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Calendar,
  Phone,
  User,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Receipt,
  FileCheck2,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';

export const BookingFlowPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1);
  const [resources, setResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState(
    searchParams.get('slot') || 'R101'
  );
  const [quantity, setQuantity] = useState(1);

  // Form details (BR5)
  const [candidateName, setCandidateName] = useState(user?.name || '');
  const [candidatePhone, setCandidatePhone] = useState('9876543210');
  const [candidateIdRef, setCandidateIdRef] = useState('SAT-2026-');
  const [bookingDate, setBookingDate] = useState('2026-10-25');

  // Inline validation errors
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/book' } } });
      return;
    }

    if (user?.name && !candidateName) {
      setCandidateName(user.name);
    }

    api.resources
      .getAll()
      .then((res) => {
        if (res.resources) {
          setResources(res.resources);
          const initialSlot = searchParams.get('slot');
          if (initialSlot && res.resources.some((r) => r.resourceId === initialSlot)) {
            setSelectedResourceId(initialSlot);
          }
        }
      })
      .catch((err) => console.error(err));
  }, [isAuthenticated, user]);

  const selectedResource = resources.find(
    (r) => r.resourceId === selectedResourceId
  );

  // BR4 Calculation
  const unitRate = selectedResource ? selectedResource.rate : 0;
  const baseAmount = unitRate * quantity;
  const bookingCharge = baseAmount < 1000 ? 50 : 0;
  const grandTotal = baseAmount + bookingCharge;

  // Validation function
  const validateDetails = () => {
    const errors = {};
    if (!candidateName || candidateName.trim().length === 0) {
      errors.candidateName = 'Candidate name cannot be blank (BR5)';
    }

    const trimmedPhone = (candidatePhone || '').trim();
    if (!trimmedPhone) {
      errors.candidatePhone = 'Phone number is required (BR5)';
    } else if (!/^\d{10}$/.test(trimmedPhone)) {
      errors.candidatePhone = 'Phone must contain exactly 10 digits (BR5)';
    }

    if (!candidateIdRef || candidateIdRef.trim().length === 0) {
      errors.candidateIdRef = 'Candidate identity reference (Student ID) is required (BR5)';
    }

    if (!bookingDate) {
      errors.bookingDate = 'Booking date is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextToReview = () => {
    if (validateDetails()) {
      setStep(3);
    }
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    setApiError('');

    try {
      const payload = {
        resourceId: selectedResourceId,
        quantity: Number(quantity),
        candidateName: candidateName.trim(),
        candidatePhone: candidatePhone.trim(),
        candidateIdRef: candidateIdRef.trim(),
        bookingDate,
      };

      const res = await api.reservations.create(payload);
      if (res.success && res.data) {
        setConfirmationData(res.data);
        setStep(4);
      }
    } catch (err) {
      setApiError(
        err.message ||
          'Failed to confirm reservation. Please check capacity and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsHeader = [
    { num: 1, label: 'Select Slot' },
    { num: 2, label: 'Enter Details' },
    { num: 3, label: 'Review Fare' },
    { num: 4, label: 'Confirmed' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Stepper Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {stepsHeader.map((s, idx) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-700 text-white ring-4 ring-blue-100'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-1.5 ${
                      isCurrent
                        ? 'text-blue-700'
                        : isCompleted
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < stepsHeader.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 -mt-5 ${
                      step > s.num ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Select Slot & Quantity */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">
              Step 1 of 4
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              Select Examination Slot & Capacity
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Choose an available examination resource. Only active slots with sufficient capacity can proceed (BR2).
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Choose Examination Slot
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resources.map((res) => {
                const isSelected = selectedResourceId === res.resourceId;
                const isAvailable = res.availability > 0;
                return (
                  <div
                    key={res.resourceId}
                    onClick={() => isAvailable && setSelectedResourceId(res.resourceId)}
                    className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between ${
                      !isAvailable
                        ? 'bg-slate-50/50 border-slate-200 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 cursor-pointer'
                        : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-800">
                          {res.resourceId}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isAvailable
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isAvailable ? `${res.availability} Available` : 'Exhausted'}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm">{res.name}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {res.category}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Rate</span>
                      <span className="text-base font-bold text-slate-900">
                        ₹{res.rate.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector (BR1: 1 to 5 only) */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Candidate Seat Quantity (BR1: 1 to 5 seats)
              </label>
              <span className="text-xs font-semibold text-slate-500">
                Selected: {quantity} seat{quantity > 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((q) => {
                const canSelect = selectedResource ? selectedResource.availability >= q : false;
                const isChosen = quantity === q;
                return (
                  <button
                    key={q}
                    type="button"
                    disabled={!canSelect}
                    onClick={() => setQuantity(q)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                      !canSelect
                        ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                        : isChosen
                        ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {q}
                  </button>
                );
              })}
            </div>

            {selectedResource && selectedResource.availability < quantity && (
              <p className="text-xs text-rose-600 flex items-center gap-1.5 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Requested quantity exceeds available capacity.</span>
              </p>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={!selectedResource || selectedResource.availability < quantity}
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <span>Continue to Candidate Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Enter Details */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">
              Step 2 of 4
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              Candidate Identification & Schedule
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              All details are strictly validated per BR5 before reservation confirmation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Candidate Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g. Alice Johnson"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-hidden focus:ring-2 ${
                    fieldErrors.candidateName
                      ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
              </div>
              {fieldErrors.candidateName && (
                <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors.candidateName}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Phone Number (Strict 10 Digits) *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  maxLength={10}
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 9876543210"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono text-slate-900 focus:outline-hidden focus:ring-2 ${
                    fieldErrors.candidatePhone
                      ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
              </div>
              {fieldErrors.candidatePhone && (
                <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors.candidatePhone}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Candidate ID / Student Roll Number *
              </label>
              <input
                type="text"
                value={candidateIdRef}
                onChange={(e) => setCandidateIdRef(e.target.value)}
                placeholder="e.g. STU-1001 or REG-2026-X"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono text-slate-900 focus:outline-hidden focus:ring-2 ${
                  fieldErrors.candidateIdRef
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
              />
              {fieldErrors.candidateIdRef && (
                <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors.candidateIdRef}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Examination Date *
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-hidden focus:ring-2 ${
                  fieldErrors.bookingDate
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
              />
              {fieldErrors.bookingDate && (
                <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors.bookingDate}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm font-semibold transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNextToReview}
              className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <span>Review Fare Breakdown</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review Fare & Confirm */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">
              Step 3 of 4
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              Review Fare Breakdown & Confirm
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Carefully verify your details and calculated fare before atomic confirmation.
            </p>
          </div>

          {/* Candidate & Slot Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block mb-1">
                Candidate Information
              </span>
              <div className="font-bold text-slate-900 text-sm">{candidateName}</div>
              <div className="text-slate-600 font-mono">Phone: +91 {candidatePhone}</div>
              <div className="text-slate-600 font-mono">ID Ref: {candidateIdRef}</div>
            </div>

            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block mb-1">
                Examination Allocation
              </span>
              <div className="font-bold text-slate-900 text-sm">{selectedResource?.name}</div>
              <div className="text-slate-600">ID: {selectedResource?.resourceId}</div>
              <div className="text-slate-600">Date: {bookingDate}</div>
              <div className="text-slate-600">Seats: {quantity}</div>
            </div>
          </div>

          {/* Fare Calculation Table (BR4) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100/70 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between">
              <span>Item Description</span>
              <span>Amount (INR)</span>
            </div>

            <div className="divide-y divide-slate-100 p-4 text-xs space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-slate-900">
                    Slot Rate (₹{unitRate.toFixed(2)} × {quantity})
                  </div>
                  <div className="text-slate-400 text-[11px]">Base candidate seat fee</div>
                </div>
                <div className="font-mono font-bold text-slate-900">
                  ₹{baseAmount.toFixed(2)}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div>
                  <div className="font-medium text-slate-900 flex items-center gap-1">
                    <span>Administrative Booking Charge</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-slate-100 text-slate-600">
                      BR4 Rule
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    {baseAmount < 1000
                      ? '₹50 applied because Base Amount < ₹1,000'
                      : '₹0 (Waived for Base Amount ≥ ₹1,000)'}
                  </div>
                </div>
                <div className="font-mono font-bold text-slate-900">
                  ₹{bookingCharge.toFixed(2)}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-sm">
                <div className="font-bold text-slate-900">Grand Total Payable</div>
                <div className="font-mono text-xl font-extrabold text-blue-700">
                  ₹{grandTotal.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {apiError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-800 text-[11px] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600" />
            <span>
              <strong>Atomic Guarantee (BR7):</strong> Clicking Confirm will atomically check current capacity, deduct availability, and record an immutable audit history entry.
            </span>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setStep(2)}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm font-semibold transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmBooking}
              className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-xs hover:shadow-md flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Confirming Atomically...' : 'Confirm & Book Reservation'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Confirmed & Receipt Docket */}
      {step === 4 && confirmationData && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8 animate-in fade-in duration-300">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Transaction Succeeded
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Reservation Confirmed!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Your examination booking has been confirmed with guaranteed seat allocation.
            </p>
          </div>

          {/* Reference Card */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Official Booking Reference
            </span>
            <div className="text-3xl font-mono font-extrabold text-blue-700 tracking-wider">
              {confirmationData.reservation.bookingReference}
            </div>
            <div>
              <StatusBadge status={confirmationData.reservation.status} size="lg" />
            </div>
          </div>

          {/* Receipt Breakdown */}
          <div className="border border-slate-200 rounded-xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-slate-500" />
                <span>Fare Snapshot Receipt</span>
              </div>
              <span className="text-slate-400 font-mono">
                {new Date(confirmationData.reservation.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Candidate</span>
                <span className="font-bold text-slate-800">
                  {confirmationData.reservation.candidateName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Phone</span>
                <span className="font-mono font-bold text-slate-800">
                  +91 {confirmationData.reservation.candidatePhone}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Exam Resource</span>
                <span className="font-bold text-slate-800">
                  {confirmationData.item.resourceRefSnapshot.name} ({confirmationData.item.resourceId})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Quantity</span>
                <span className="font-bold text-slate-800">
                  {confirmationData.item.quantity} Seat(s)
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  Unit Rate Snapshot (₹{confirmationData.item.unitRateSnapshot} × {confirmationData.item.quantity}):
                </span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{confirmationData.item.baseAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Administrative Booking Charge:</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{confirmationData.item.bookingCharge.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total Paid:</span>
                <span className="font-mono text-base text-blue-700 font-extrabold">
                  ₹{confirmationData.item.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/my-bookings"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm transition-colors text-center"
            >
              View in My Bookings
            </Link>
            <button
              onClick={() => {
                setStep(1);
                setConfirmationData(null);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors text-center"
            >
              Book Another Examination Slot
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
