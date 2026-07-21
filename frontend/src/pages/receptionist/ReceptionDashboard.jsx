import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { getMe } from '../../api/auth.api';
import { getReceptionDashboardStats } from '../../api/reception.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useSocket from '../../hooks/useSocket';

const StatCard = ({ label, value, color, icon }) => (
  <div className="card text-center py-4">
    <div className="text-2xl mb-1">{icon}</div>
    <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
    <p className="text-xs text-text-muted mt-1">{label}</p>
  </div>
);

const QuickAction = ({ to, icon, label, description, bgColor }) => (
  <Link
    to={to}
    className="card-hover flex flex-col items-center gap-3 py-6 text-center"
  >
    <div className={`w-14 h-14 ${bgColor} rounded-xl flex items-center justify-center text-3xl`}>
      {icon}
    </div>
    <div>
      <p className="font-semibold text-text-primary">{label}</p>
      <p className="text-sm text-text-muted">{description}</p>
    </div>
  </Link>
);

const ReceptionDashboard = () => {
  const { user } = useAuthStore();
  const [clinicId, setClinicId] = useState(null);
  const [clinicName, setClinicName] = useState('');
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { onEvent } = useSocket();

  useEffect(() => {
    const init = async () => {
      try {
        const res = await getMe();
        const staffClinics = res.data.data.user?.clinicStaff || [];
        if (staffClinics.length > 0) {
          setClinicId(staffClinics[0].clinic?.id);
          setClinicName(staffClinics[0].clinic?.name || '');
        }
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const fetchStats = useCallback(async () => {
    if (!clinicId) return;
    try {
      const res = await getReceptionDashboardStats(clinicId);
      setStats(res.data.data);
    } catch {
      // non-critical — dashboard works without stats
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId) fetchStats();
  }, [fetchStats, clinicId]);

  // Refresh stats on live queue events
  useEffect(() => {
    const cleanup = onEvent('clinic:updated', () => fetchStats());
    return cleanup;
  }, [onEvent, fetchStats]);

  return (
    <DashboardLayout>
      <div className="page-container">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Reception Dashboard</h1>
          <p className="text-text-muted mt-1">
            Welcome, {user?.name} {clinicName && <span>• {clinicName}</span>}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Live stats */}
        {isLoading ? (
          <div className="flex justify-center py-6"><LoadingSpinner /></div>
        ) : stats ? (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">Today's Overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
              <StatCard label="Total Today"    value={stats.totalToday}     color="text-blue-600"   icon="📋" />
              <StatCard label="Checked In"     value={stats.checkedIn}      color="text-purple-600" icon="✅" />
              <StatCard label="Waiting"        value={stats.waiting}        color="text-yellow-600" icon="⏳" />
              <StatCard label="Completed"      value={stats.completed}      color="text-green-600"  icon="🎉" />
              <StatCard label="No Show"        value={stats.noShow}         color="text-red-500"    icon="❌" />
              <StatCard label="Pending Pay"    value={stats.pendingPayments} color="text-orange-500" icon="💵" />
            </div>

            {/* Currently serving */}
            {stats.currentlyServing && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">🩺</span>
                <div>
                  <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Now Serving</p>
                  <p className="font-bold text-purple-800">
                    #{stats.currentlyServing.queueNumber} — {stats.currentlyServing.patientName}
                  </p>
                </div>
                <button
                  onClick={fetchStats}
                  className="ml-auto text-xs text-purple-500 hover:text-purple-700"
                  title="Refresh"
                >
                  🔄
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* Quick Actions */}
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <QuickAction
            to="/receptionist/appointments"
            icon="📅"
            label="Today's Appointments"
            description="View & check in patients"
            bgColor="bg-indigo-50"
          />
          <QuickAction
            to="/receptionist/queue"
            icon="🔢"
            label="Today's Queue"
            description="Manage patient queue"
            bgColor="bg-blue-50"
          />
          <QuickAction
            to="/receptionist/walk-in"
            icon="🚶"
            label="Walk-in Patient"
            description="Add to queue directly"
            bgColor="bg-green-50"
          />
          <QuickAction
            to="/receptionist/follow-up"
            icon="🔄"
            label="Follow-up Return"
            description="Priority queue entry"
            bgColor="bg-orange-50"
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReceptionDashboard;
