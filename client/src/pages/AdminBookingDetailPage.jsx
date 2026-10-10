import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Clock,
  UserCheck,
  CheckCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Receipt,
  FileCheck2,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Toast } from '../components/Toast';

export const AdminBookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isAuthenticated } = useAuth();

  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status transition state
  const [targetStatus, setTargetStatus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.getReservationById(id);
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
    if (!isAdmin) {
      navigate('/unauthorized');
      return;
    }
    fetchDetails();
  }, [id, isAuthenticated, isAdmin]);

  const handleOpenStatusModal = (status) => {
    setTargetStatus(status);
    setIsModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!targetStatus || !bookingData?.reservation) return;
    setIsUpdating(true);

    try {
      const res = await api.admin.updateStatus(
        bookingData.reservation._id,
        targetStatus
      );
      if (res.success) {
        setToastMessage({
          type: 'success',
          text: `Reservation status successfully advanced to '${targetStatus}' (BR8).`,
        });
        setIsModalOpen(false);
        setTargetStatus(null);
        await fetchDetails();
      }
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Status transition failed. Stage skipping is prohibited (BR8).',
      });
    } finally {
      setIsUpdating(false);
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

  if (error || !bookingData) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Reservation Not Found</h2>
        <p className="text-xs text-slate-500">{error?.message || 'Unable to load details.'}</p>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-700 text-white text-xs font-semibold rounded-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Operations Dashboard</span>
        </Link>
      </div>
    );
  }

  const { reservation, item, history } = bookingData;
  const currentStatus = reservation.status;
  const isTerminal = currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED';

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
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operations Portal</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Acting Controller:</span>
          <span className="text-xs font-semibold text-purple-700">{user?.name}</span>
        </div>
      </div>

      {/* Main Dossier Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Administrative Dossier
            </span>
            <h1 className="text-3xl font-mono font-extrabold text-slate-900 mt-1">
              {reservation.bookingReference}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Candidate Account: {reservation.userId?.name} ({reservation.userId?.email})
            </p>
          </div>

          <StatusBadge status={reservation.status} size="lg" />
        </div>

        {/* BR8 Status Progression Controller Interface */}
        <div className="bg-purple-50/50 border border-purple-200/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                Operational Status Machine (BR8)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-purple-700">
              Current State: <strong>{currentStatus}</strong>
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Allowed state progression: <strong>CONFIRMED → CHECKED_IN or BOARDED → COMPLETED</strong>.
            Skipping stages is rejected by backend business rules. Terminal states cannot be altered.
          </p>

          {isTerminal ? (
            <div className="p-3.5 bg-slate-100 rounded-xl text-xs text-slate-600 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                This reservation has reached the terminal status <strong>{currentStatus}</strong>. No further operational transitions are permitted (BR8).
              </span>
            </div>
          ) : (
            <div className="pt-2">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                Eligible Next Stage Actions:
              </span>

              <div className="flex flex-wrap gap-3">
                {currentStatus === 'CONFIRMED' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenStatusModal('CHECKED_IN')}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Advance to CHECKED_IN</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenStatusModal('BOARDED')}
                      className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Advance to BOARDED</span>
                    </button>
                  </>
                )}

                {(currentStatus === 'CHECKED_IN' || currentStatus === 'BOARDED') && (
                  <button
                    type="button"
                    onClick={() => handleOpenStatusModal('COMPLETED')}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-2xs"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Advance to COMPLETED (Final Stage)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Candidate & Booking Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Candidate Details
            </span>
            <div className="font-bold text-slate-900 text-sm">{reservation.candidateName}</div>
            <div className="text-slate-600 font-mono">Phone: +91 {reservation.candidatePhone}</div>
            <div className="text-slate-600 font-mono">Roll / ID: {reservation.candidateIdRef}</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Exam Resource & Fare
            </span>
            <div className="font-bold text-slate-900 text-sm">
              {item?.resourceRefSnapshot?.name} ({reservation.resourceId})
            </div>
            <div className="text-slate-600">Reserved Seats: {item?.quantity}</div>
            <div className="font-mono font-bold text-blue-700 text-sm">
              Grand Total: ₹{item?.grandTotal?.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Audit History Log */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Audit History Trail (Actor & Timestamp Verified)</span>
          </h3>

          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
            {history?.map((h, idx) => (
              <div key={idx} className="p-3.5 flex flex-col sm:flex-row justify-between gap-1 hover:bg-slate-50">
                <div>
                  <div className="font-semibold text-slate-800">
                    {h.oldStatus ? `${h.oldStatus} → ${h.newStatus}` : `Created as ${h.newStatus}`}
                  </div>
                  <div className="text-slate-500 text-[11px]">{h.note}</div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono shrink-0">
                  {new Date(h.eventAt).toLocaleString()} • {h.actorName} ({h.actorRole})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Advance Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        title={`Advance Status to ${targetStatus}`}
        message={`Are you sure you want to transition booking ${reservation.bookingReference} from ${currentStatus} to ${targetStatus}? This action will be immutably recorded in the audit history.`}
        confirmText={`Advance to ${targetStatus}`}
        confirmVariant="primary"
        isLoading={isUpdating}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => {
          setIsModalOpen(false);
          setTargetStatus(null);
        }}
      />
    </div>
  );
};
