import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Search,
  Filter,
  Eye,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Toast } from '../components/Toast';

export const MyBookingsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Cancellation state
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchMyBookings();
  }, [isAuthenticated]);

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const res = await api.reservations.getMy();
      if (res.reservations) {
        setBookings(res.reservations);
      }
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to fetch bookings' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCancelModal = (booking) => {
    setSelectedBookingForCancel(booking);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBookingForCancel) return;
    setIsCancelling(true);

    try {
      const res = await api.reservations.cancel(selectedBookingForCancel._id);
      if (res.success) {
        setToastMessage({
          type: 'success',
          text: `Booking ${selectedBookingForCancel.bookingReference} cancelled successfully. Reserved capacity has been restored (BR9).`,
        });
        setIsCancelModalOpen(false);
        setSelectedBookingForCancel(null);
        await fetchMyBookings();
      }
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Failed to cancel booking. Only CONFIRMED bookings may be cancelled (BR9).',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.resourceId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <Toast
          message={toastMessage.text}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">
            Candidate Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            My Examination Reservations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review your booked examination dockets, saved fare snapshots, and status history.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <Layers className="w-4 h-4" />
          <span>Book New Slot</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by Booking Reference (e.g. EXM-) or Slot..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CHECKED_IN">CHECKED_IN</option>
            <option value="BOARDED">BOARDED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl border border-slate-200" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No examination bookings found</h3>
          <p className="text-xs text-slate-500">
            {bookings.length === 0
              ? 'You have not made any exam reservations yet. Explore available slots to register.'
              : 'No reservations match your filter criteria.'}
          </p>
          {bookings.length === 0 && (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs"
            >
              Explore Slots
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredBookings.map((b) => {
            const isConfirmed = b.status === 'CONFIRMED';
            return (
              <div
                key={b._id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-extrabold text-base text-blue-700">
                      {b.bookingReference}
                    </span>
                    <StatusBadge status={b.status} />
                    <span className="text-xs text-slate-400 font-mono">
                      Slot: {b.resourceId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Candidate</span>
                      <span className="font-bold text-slate-800">{b.candidateName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Exam Date</span>
                      <span className="font-medium text-slate-800">{b.bookingDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Roll No / ID</span>
                      <span className="font-mono text-slate-800">{b.candidateIdRef}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Fare Snapshot</span>
                      <span className="font-bold text-slate-900">
                        ₹{b.item ? b.item.grandTotal.toFixed(2) : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <Link
                    to={`/bookings/${b.bookingReference}`}
                    className="px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Dossier</span>
                  </Link>

                  {isConfirmed && (
                    <button
                      type="button"
                      onClick={() => handleOpenCancelModal(b)}
                      className="px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Cancel confirmed booking (BR9)"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal (BR9) */}
      <ConfirmationModal
        isOpen={isCancelModalOpen}
        title="Cancel Examination Reservation"
        message={
          selectedBookingForCancel
            ? `Are you sure you want to cancel reservation ${selectedBookingForCancel.bookingReference}? This will set status to CANCELLED and restore ${
                selectedBookingForCancel.item?.quantity || 1
              } seat(s) back to the available resource capacity. Once cancelled, this action cannot be undone (BR9).`
            : ''
        }
        confirmText="Confirm Cancellation"
        confirmVariant="danger"
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => {
          setIsCancelModalOpen(false);
          setSelectedBookingForCancel(null);
        }}
      />
    </div>
  );
};
