import React from 'react';
import {
  CheckCircle2,
  Clock,
  UserCheck,
  CheckCheck,
  XCircle,
} from 'lucide-react';

export const StatusBadge = ({ status, size = 'md' }) => {
  const normalizedStatus = (status || '').toUpperCase();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  switch (normalizedStatus) {
    case 'CONFIRMED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses[size]}`}
          title="Reservation Confirmed"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          CONFIRMED
        </span>
      );

    case 'CHECKED_IN':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses[size]}`}
          title="Candidate Checked In"
        >
          <UserCheck className="w-3.5 h-3.5 text-amber-600" />
          CHECKED IN
        </span>
      );

    case 'BOARDED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses[size]}`}
          title="Candidate Boarded Examination Room"
        >
          <Clock className="w-3.5 h-3.5 text-purple-600" />
          BOARDED
        </span>
      );

    case 'COMPLETED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ${sizeClasses[size]}`}
          title="Examination Completed"
        >
          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
          COMPLETED
        </span>
      );

    case 'CANCELLED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses[size]}`}
          title="Reservation Cancelled"
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          CANCELLED
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses[size]}`}
        >
          {status}
        </span>
      );
  }
};
