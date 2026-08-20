import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/notification.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const FILTERS = ['All', 'Appointments', 'Queue Updates', 'Reminders', 'Offers'];

const ICON_MAP = {
  calendar: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  notifications: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  people: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  pricetag: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  megaphone: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
};

const getIcon = (iconName) => ICON_MAP[iconName] || ICON_MAP.notifications;

const fmtTime = (t) => {
  const d = new Date(t);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const isToday = (t) => {
  const d = new Date(t);
  const s = new Date(); s.setHours(0, 0, 0, 0);
  return d >= s;
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [readIds, setReadIds] = useState(new Set());
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getMyNotifications();
      const notifs = res.data.data.notifications || [];
      setNotifications(notifs);
      setReadIds(new Set(notifs.filter(n => n.read).map(n => n.id)));
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id) => {
    setReadIds(prev => new Set([...prev, id]));
    try { await markNotificationRead(id); } catch {}
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    const allIds = new Set(notifications.map(n => n.id));
    setReadIds(allIds);
    try {
      await markAllNotificationsRead();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotifClick = (notif) => {
    handleMarkRead(notif.id);
    if (notif.apptId) navigate(`/patient/appointments/${notif.apptId}`);
  };

  const filtered = filter === 'All' ? notifications : notifications.filter(n => n.category === filter);
  const todayItems = filtered.filter(n => isToday(n.time));
  const earlierItems = filtered.filter(n => !isToday(n.time));
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  return (
    <DashboardLayout>
      <div className="page-container max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-text-muted mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={markingAll}
                className="text-sm text-primary-600 font-semibold hover:text-primary-700 disabled:opacity-50"
              >
                {markingAll ? 'Marking…' : 'Mark all read'}
              </button>
            )}
            {/* Settings icon — navigates to notification settings, does NOT mark anything read */}
            <Link
              to="/notifications/settings"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-text-muted hover:bg-gray-100 transition-colors"
              aria-label="Notification settings"
              title="Notification settings"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-border text-text-muted hover:border-primary-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-sm font-medium text-text-primary">No notifications</p>
            <p className="text-xs text-text-muted mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {todayItems.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Today</p>
                <div className="bg-white rounded-2xl border border-border overflow-hidden">
                  {todayItems.map((notif, i) => (
                    <NotifRow
                      key={notif.id}
                      notif={notif}
                      isRead={readIds.has(notif.id)}
                      isLast={i === todayItems.length - 1}
                      onClick={() => handleNotifClick(notif)}
                    />
                  ))}
                </div>
              </div>
            )}
            {earlierItems.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Earlier</p>
                <div className="bg-white rounded-2xl border border-border overflow-hidden">
                  {earlierItems.map((notif, i) => (
                    <NotifRow
                      key={notif.id}
                      notif={notif}
                      isRead={readIds.has(notif.id)}
                      isLast={i === earlierItems.length - 1}
                      onClick={() => handleNotifClick(notif)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const NotifRow = ({ notif, isRead, isLast, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 ${
      !isLast ? 'border-b border-gray-50' : ''
    } ${!isRead ? 'bg-blue-50/40' : ''}`}
  >
    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: notif.bg }}>
      <span style={{ color: notif.color }}>{getIcon(notif.icon)}</span>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm ${!isRead ? 'font-semibold text-text-primary' : 'font-medium text-text-primary'}`}>
          {notif.title}
        </p>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-text-muted">{fmtTime(notif.time)}</span>
          {!isRead && <span className="w-2 h-2 rounded-full bg-primary-600 flex-shrink-0" />}
        </div>
      </div>
      <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{notif.body}</p>
      {notif.sub && <p className="text-xs text-text-muted mt-0.5">{notif.sub}</p>}
    </div>
  </button>
);

export default NotificationsPage;
