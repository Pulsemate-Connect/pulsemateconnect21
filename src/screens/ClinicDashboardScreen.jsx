import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getClinicDashboard } from '../api/auth';
import { colors, shadow, radius } from '../theme';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

export default function ClinicDashboardScreen({ navigation, route }) {
  const { clinicId } = route.params;
  
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const response = await getClinicDashboard(clinicId);
      
      if (response.data.success) {
        setDashboard(response.data.data);
      } else {
        setError('Failed to load dashboard');
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clinicId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.title}>Dashboard</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={s.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={s.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.title}>Dashboard</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={s.errorWrap}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={s.errorTitle}>Failed to load</Text>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={load}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { clinic, stats, recentAppointments } = dashboard;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={s.headerMid}>
          <Text style={s.title}>{clinic.name}</Text>
          <Text style={s.subtitle}>Dashboard Overview</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={handleRefresh}>
          <Ionicons name="refresh-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Today's Stats */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Today's Summary</Text>
          <View style={s.statsGrid}>
            <StatCard
              icon="calendar"
              iconColor="#3B82F6"
              iconBg="#DBEAFE"
              value={stats.today.appointments}
              label="Appointments"
            />
            <StatCard
              icon="checkmark-circle"
              iconColor="#10B981"
              iconBg="#D1FAE5"
              value={stats.today.completed}
              label="Completed"
            />
            <StatCard
              icon="hourglass"
              iconColor="#F59E0B"
              iconBg="#FEF3C7"
              value={stats.today.pending}
              label="Pending"
            />
            <StatCard
              icon="close-circle"
              iconColor="#EF4444"
              iconBg="#FEE2E2"
              value={stats.today.cancelled}
              label="Cancelled"
            />
          </View>
        </View>

        {/* Revenue Stats */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Revenue</Text>
          <View style={s.revenueCard}>
            <View style={s.revenueItem}>
              <Text style={s.revenueLabel}>Today</Text>
              <Text style={s.revenueValue}>₹{stats.revenue.today.toLocaleString('en-IN')}</Text>
              <Text style={s.revenueSubtext}>{stats.today.transactions} transactions</Text>
            </View>
            <View style={s.revenueDivider} />
            <View style={s.revenueItem}>
              <Text style={s.revenueLabel}>This Week</Text>
              <Text style={s.revenueValue}>₹{stats.revenue.week.toLocaleString('en-IN')}</Text>
            </View>
            <View style={s.revenueDivider} />
            <View style={s.revenueItem}>
              <Text style={s.revenueLabel}>This Month</Text>
              <Text style={s.revenueValue}>₹{stats.revenue.month.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Totals */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Overview</Text>
          <View style={s.totalsGrid}>
            <TotalCard
              icon="people"
              iconColor="#8B5CF6"
              iconBg="#EDE9FE"
              value={stats.totals.doctors}
              label="Total Doctors"
              subtitle={`${stats.totals.activeDoctors} active`}
            />
            <TotalCard
              icon="person"
              iconColor="#EC4899"
              iconBg="#FCE7F3"
              value={stats.totals.staff}
              label="Staff Members"
            />
            <TotalCard
              icon="people-circle"
              iconColor="#06B6D4"
              iconBg="#CFFAFE"
              value={stats.totals.patients}
              label="Total Patients"
            />
            <TotalCard
              icon="timer"
              iconColor="#F97316"
              iconBg="#FFEDD5"
              value={stats.totals.activeQueue}
              label="Active Queue"
            />
          </View>
        </View>

        {/* Recent Appointments */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recent Appointments</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AppointmentsTab')}>
              <Text style={s.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentAppointments.length === 0 ? (
            <View style={s.emptyCard}>
              <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
              <Text style={s.emptyText}>No appointments yet</Text>
            </View>
          ) : (
            <View style={s.appointmentsList}>
              {recentAppointments.map((appointment, index) => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  isLast={index === recentAppointments.length - 1}
                  onPress={() => navigation.navigate('AppointmentsTab', {
                    screen: 'AppointmentDetail',
                    params: { id: appointment.id }
                  })}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Components ──────────────────────────────────────────────────────────────

function StatCard({ icon, iconColor, iconBg, value, label }) {
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function TotalCard({ icon, iconColor, iconBg, value, label, subtitle }) {
  return (
    <View style={s.totalCard}>
      <View style={[s.totalIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={s.totalContent}>
        <Text style={s.totalValue}>{value}</Text>
        <Text style={s.totalLabel}>{label}</Text>
        {subtitle && <Text style={s.totalSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

function AppointmentRow({ appointment, isLast, onPress }) {
  const statusColors = {
    CONFIRMED: { bg: '#DBEAFE', color: '#3B82F6', text: 'Confirmed' },
    COMPLETED: { bg: '#D1FAE5', color: '#10B981', text: 'Completed' },
    CANCELLED: { bg: '#FEE2E2', color: '#EF4444', text: 'Cancelled' },
    PENDING: { bg: '#FEF3C7', color: '#F59E0B', text: 'Pending' },
  };

  const status = statusColors[appointment.status] || statusColors.PENDING;

  return (
    <TouchableOpacity
      style={[s.appointmentRow, !isLast && s.appointmentBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={s.appointmentLeft}>
        <View style={s.appointmentIconCircle}>
          <Ionicons name="person" size={18} color={colors.primary} />
        </View>
        <View style={s.appointmentInfo}>
          <Text style={s.appointmentPatient} numberOfLines={1}>
            {appointment.patient?.name || 'Patient'}
          </Text>
          <Text style={s.appointmentTime}>
            {new Date(appointment.appointmentDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })} • {appointment.slotTime}
          </Text>
        </View>
      </View>
      <View style={[s.appointmentStatus, { backgroundColor: status.bg }]}>
        <Text style={[s.appointmentStatusText, { color: status.color }]}>
          {status.text}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4FF' },
  loadingWrap: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  errorText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  headerMid: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 11, color: colors.textMuted, marginTop: 1 },

  // Section
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 16,
    alignItems: 'center',
    ...shadow.sm,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Revenue Card
  revenueCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 20,
    flexDirection: 'row',
    ...shadow.sm,
  },
  revenueItem: {
    flex: 1,
    alignItems: 'center',
  },
  revenueDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  revenueLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 6,
  },
  revenueValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  revenueSubtext: {
    fontSize: 10,
    color: colors.textMuted,
  },

  // Totals Grid
  totalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  totalCard: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadow.sm,
  },
  totalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalContent: {
    flex: 1,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  totalLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  totalSubtitle: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },

  // Appointments
  appointmentsList: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.sm,
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  appointmentBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  appointmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  appointmentIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentPatient: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 3,
  },
  appointmentTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  appointmentStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
  },
  appointmentStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 40,
    alignItems: 'center',
    ...shadow.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 12,
  },
});
