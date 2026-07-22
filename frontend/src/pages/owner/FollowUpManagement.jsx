// ─────────────────────────────────────────────────────────────────────────────
//  FollowUpManagement — PulseMate Connect  |  Clinic Owner / Receptionist
//
//  Unified follow-up list with:
//   • Filter by status / date range
//   • Audit trail (created by / modified by)
//   • Cancel with reason
//   • Create new follow-up (receptionist workflow)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  listFollowUps, cancelFollowUp, createFollowUp,
  getFollowUpSettings, getCompletedVisits,
} from '../../api/followup.api';
import { searchPatients } from '../../api/reception.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
}) : '—';

const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
}) : '—';

const STATUS_STYLE = {
  PENDING:   { bg: 'bg-blue-100',  text: 'text-blue-700'  },
  UPCOMING:  { bg: 'bg-yellow-100',text: 'text-yellow-800' },
  DUE:       { bg: 'bg-red-100',   text: 'text-red-700'   },
  OVERDUE:   { bg: 'bg-red-100',   text: 'text-red-800'   },
  BOOKED:    { bg: 'bg-green-100', text: 'text-green-700' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-700' },
  CANCELLED: { bg: 'bg-gray-100',  text: 'text-gray-500'  },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.PENDING;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      {status}
    </span>
  );
}

const FILTER_TABS = [
  { key: '',          label: 'All'       },
  { key: 'PENDING',   label: 'Pending'   },
  { key: 'UPCOMING',  label: 'Due Soon'  },
  { key: 'DUE',       label: 'Due Today' },
  { key: 'OVERDUE',   label: 'Overdue'   },
  { key: 'BOOKED',    label: 'Booked'    },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];
