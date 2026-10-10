import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Phone,
  User,
  ShieldCheck,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Printer,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Toast } from '../components/Toast';

export const BookingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancellation
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.reservations.getById(id);
      if (res.data) {
        setBookingData(res.data);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchDetails();
  }, [id, isAuthenticated]);

  const handleCancelBooking = async () => {
    if (!bookingData?.reservation) return;
    setIsCancelling(true);
    try {
      const res = await api.reservations.cancel(bookingData.reservation._id);
      if (res.success) {
        setToastMessage({
          type: 'success',
          text: `Booking cancelled successfully. Seat capacity restored (BR9).`,
        });
        setIsCancelModalOpen(false);
        await fetchDetails();
      }
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Failed to cancel booking.',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded-lg w-1/3" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          {error.status === 403 ? 'Access Denied (BR10)' : 'Booking Not Found'}
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {error.status === 403
            ? "You do not have permission to view this reservation dossier. Candidates may only inspect their own bookings."
            : error.message || "The requested booking reference could not be located in the database."}
        </p>
        <Link
          to="/my-bookings"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Bookings</span>
        </Link>
      </div>
    );
  }

  const { reservation, item, history, resource } = bookingData;
  const isOwner = user?._id === reservation?.userId?._id || user?.id === reservation?.userId?._id || user?._id === reservation?.userId;
  const canCancel = isOwner && reservation?.status === 'CONFIRMED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {toastMessage && (
        <Toast
          message={toastMessage.text}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Navigation Top */}
      <div className="flex items-center justify-between">
        <Link
          to={isAdmin ? '/admin' : '/my-bookings'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {isAdmin ? 'Admin Portal' : 'My Bookings'}</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>Print Docket</span>
        </button>
      </div>

      {/* Main Dossier Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Booking Reference
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600">
                Official
              </span>
            </div>
            <h1 className="text-3xl font-mono font-extrabold text-blue-700 tracking-tight mt-1">
              {reservation.bookingReference}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Created on {new Date(reservation.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={reservation.status} size="lg" />
            {canCancel && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Reservation</span>
              </button>
            )}
          </div>
        </div>

        {/* Candidate & Slot Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              <span>Candidate Identification</span>
            </h3>
            <div className="space-y-1.5 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Candidate Name</span>
                <span className="font-bold text-slate-900">{reservation.candidateName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Contact Phone</span>
                <span className="font-mono text-slate-900">+91 {reservation.candidatePhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Roll Number / ID</span>
                <span className="font-mono font-bold text-slate-900">{reservation.candidateIdRef}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Examination Session</span>
            </h3>
            <div className="space-y-1.5 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Exam Resource</span>
                <span className="font-bold text-slate-900">
                  {item?.resourceRefSnapshot?.name || resource?.name} ({reservation.resourceId})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Scheduled Date</span>
                <span className="font-medium text-slate-900">{reservation.bookingDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Seat Allocation</span>
                <span className="font-bold text-slate-900">{item?.quantity} Candidate Seat(s)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Immutable Fare Snapshot Breakdown (BR3, BR4) */}
        {item && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-slate-500" />
                <span>Saved Fare Snapshot (BR3 — Immutable)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Currency: INR (₹)
              </span>
            </div>

            <div className="p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Unit Rate Snapshot:</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{item.unitRateSnapshot.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Quantity Reserved:</span>
                <span className="font-bold text-slate-800">{item.quantity}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Base Amount (Rate × Quantity):</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{item.baseAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Administrative Booking Charge (BR4):</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{item.bookingCharge.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-3 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="font-mono text-lg font-extrabold text-blue-700">
                  ₹{item.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Status History Audit Trail (Section 5) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">
              Booking Status History Audit Trail
            </h3>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
            {history && history.length > 0 ? (
              history.map((h, idx) => (
                <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {h.oldStatus ? `${h.oldStatus} → ${h.newStatus}` : `Created as ${h.newStatus}`}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 font-mono">
                        by {h.actorName} ({h.actorRole})
                      </span>
                    </div>
                    {h.note && <p className="text-[11px] text-slate-500">{h.note}</p>}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono shrink-0">
                    {new Date(h.eventAt).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-400">No history records found</div>
            )}
          </div>
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      <ConfirmationModal
        isOpen={isCancelModalOpen}
        title="Confirm Booking Cancellation"
        message={`Are you sure you want to cancel booking ${reservation.bookingReference}? This will immediately restore ${item?.quantity || 1} seat(s) to capacity (BR9).`}
        confirmText="Cancel Reservation"
        confirmVariant="danger"
        isLoading={isCancelling}
        onConfirm={handleCancelBooking}
        onCancel={() => setIsCancelModalOpen(false)}
      />
    </div>
  );
};
