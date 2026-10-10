import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  TrendingUp,
  Users,
  ChevronRight,
  RotateCw,
  PlusCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { Toast } from '../components/Toast';
import { CreateSlotModal } from '../components/CreateSlotModal';

export const AdminDashboardPage = () => {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [resourceFilter, setResourceFilter] = useState('ALL');
  const [slotList, setSlotList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toastMessage, setToastMessage] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchSlots = async () => {
    try {
      const res = await api.resources.getAll();
      if (res.resources) {
        setSlotList(res.resources);
      }
    } catch {
      // Fallback if needed
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

    fetchAdminData();
    fetchSlots();
  }, [page, statusFilter, resourceFilter, isAuthenticated, isAdmin]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [resList, resStats] = await Promise.all([
        api.admin.getAllReservations({
          search: searchTerm,
          status: statusFilter,
          resourceId: resourceFilter,
          page,
          limit: 10,
        }),
        api.admin.getStats(),
      ]);

      if (resList.reservations) {
        setReservations(resList.reservations);
        setTotalPages(resList.totalPages || 1);
      }
      if (resStats.stats) {
        setStats(resStats.stats);
      }
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to fetch admin data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAdminData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
              Examination Controller
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-800 font-bold">
              ADMIN
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Administrator Operations Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time examination docket monitoring, candidate verification, and strict operational status processing (BR8).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="create-slot-button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create New Slot</span>
          </button>

          <button
            onClick={fetchAdminData}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Analytics Counter Metrics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-400 font-medium">Total Bookings</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {stats.totalBookings}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">All recorded registrations</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-400 font-medium">Active In-Progress</span>
            <div className="text-2xl font-extrabold text-blue-700 mt-1">
              {stats.activeOperationalCount}
            </div>
            <div className="text-[11px] text-blue-600 mt-1">Confirmed / Checked-in / Boarded</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-400 font-medium">Cumulative Fare</span>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">
              ₹{stats.totalRevenue.toFixed(2)}
            </div>
            <div className="text-[11px] text-emerald-600 mt-1">Grand total snapshotted</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-400 font-medium">Available Seats</span>
            <div className="text-2xl font-extrabold text-purple-700 mt-1">
              {stats.totalAvailableCapacity}
            </div>
            <div className="text-[11px] text-purple-600 mt-1">Remaining across slots</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search reference, candidate name, or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CHECKED_IN">CHECKED_IN</option>
              <option value="BOARDED">BOARDED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>

            <select
              value={resourceFilter}
              onChange={(e) => {
                setResourceFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white"
            >
              <option value="ALL">All Slots</option>
              {slotList.length > 0
                ? slotList.map((slot) => (
                    <option key={slot.resourceId} value={slot.resourceId}>
                      {slot.resourceId} ({slot.name})
                    </option>
                  ))
                : ['R101', 'R102', 'R103', 'R104', 'R105'].map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs transition-colors shrink-0"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Booking Ref</th>
                <th className="px-5 py-3.5">Candidate Details</th>
                <th className="px-5 py-3.5">Slot / Seats</th>
                <th className="px-5 py-3.5">Snapshotted Fare</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Operational Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Loading reservation records...
                  </td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No examination dockets matching your criteria.
                  </td>
                </tr>
              ) : (
                reservations.map((res) => (
                  <tr key={res._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-blue-700">
                      {res.bookingReference}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{res.candidateName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        +91 {res.candidatePhone} • {res.candidateIdRef}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800">{res.resourceId}</span>
                      <span className="text-slate-400 block text-[11px]">
                        {res.item?.quantity || 1} Seat(s) • {res.bookingDate}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900">
                        ₹{res.item ? res.item.grandTotal.toFixed(2) : '—'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Rate: ₹{res.item?.unitRateSnapshot || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={res.status} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/admin/bookings/${res.bookingReference}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-xs font-semibold transition-colors"
                      >
                        <span>Process</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Examination Slot Modal */}
      <CreateSlotModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newSlot) => {
          setToastMessage({
            type: 'success',
            text: `Examination Slot ${newSlot.resourceId} (${newSlot.name}) created and published successfully!`,
          });
          fetchAdminData();
          fetchSlots();
        }}
      />
    </div>
  );
};
