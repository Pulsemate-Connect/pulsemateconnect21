/**
 * ============================================================================
 * NOTIFICATIONS SCREEN - Production Ready
 * ============================================================================
 * Beautiful notification center with:
 * - Unread badge
 * - Pull to refresh
 * - Pagination
 * - Search & filter
 * - Mark all as read
 * - Delete notifications
 * - Deep linking on tap
 * - Relative timestamps
 * - Icons and animations
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import api from '../api/axios';

// ── Icon Mapping ─────────────────────────────────────────────────────────────
const getNotificationIcon = (type) => {
  const iconMap = {
    APPOINTMENT_BOOKED: '✅',
    APPOINTMENT_REMINDER_24H: '📅',
    APPOINTMENT_REMINDER_2H: '⏰',
    APPOINTMENT_REMINDER_30M: '🚗',
    QUEUE_UPDATE: '👥',
    QUEUE_ALMOST_YOUR_TURN: '🔔',
    QUEUE_YOUR_TURN: '🩺',
    APPOINTMENT_CANCELLED: '❌',
    APPOINTMENT_RESCHEDULED: '📆',
    PAYMENT_SUCCESS: '💳',
    PRESCRIPTION_READY: '📄',
    FOLLOW_UP_REMINDER: '❤️',
    DOCTOR_NEW_APPOINTMENT: '📅',
    DOCTOR_PATIENT_CHECKED_IN: '👋',
    RECEPTIONIST_PATIENT_ARRIVED: '🚶',
    OWNER_DAILY_SUMMARY: '📊',
    OWNER_HIGH_QUEUE: '⚠️',
    ADMIN_EMERGENCY: '🚨',
  };
  return iconMap[type] || '🔔';
};

// ── Deep Link Navigation ─────────────────────────────────────────────────────
const navigateToReference = (navigation, notification) => {
  const { referenceType, referenceId } = notification;
  
  if (!referenceType || !referenceId) return;

  switch (referenceType) {
    case 'APPOINTMENT':
      navigation.navigate('AppointmentsTab', {
        screen: 'AppointmentDetail',
        params: { id: referenceId },
      });
      break;
    case 'PRESCRIPTION':
      navigation.navigate('AppointmentsTab', {
        screen: 'PrescriptionDetail',
        params: { appointmentId: referenceId },
      });
      break;
    case 'PAYMENT':
      navigation.navigate('AppointmentsTab', {
        screen: 'PaymentDetail',
        params: { appointmentId: referenceId },
      });
      break;
    default:
      // Default to home or notification detail
      break;
  }
};

// ── Relative Time Formatter ──────────────────────────────────────────────────
const getRelativeTime = (date) => {
  const now = new Date();
  const notifDate = new Date(date);
  const diffMs = now - notifDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return notifDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

// ── Notification Card Component ──────────────────────────────────────────────
const NotificationCard = ({ notification, onPress, onDelete, onMarkAsRead }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.cardContent, !notification.isRead && styles.unreadCard]}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getNotificationIcon(notification.type)}</Text>
          {!notification.isRead && <View style={styles.unreadDot} />}
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={[styles.title, !notification.isRead && styles.unreadText]}>
            {notification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
          <Text style={styles.time}>{getRelativeTime(notification.createdAt)}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {!notification.isRead && (
            <TouchableOpacity
              onPress={() => onMarkAsRead(notification.id)}
              style={styles.actionButton}
            >
              <Ionicons name="checkmark-done" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => onDelete(notification.id)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Main Screen Component ────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [searchQuery, setSearchQuery] = useState('');

  // ── Fetch Notifications ──────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const params = {
        page: pageNum,
        limit: 20,
        unreadOnly: filter === 'unread',
      };

      if (searchQuery) {
        params.query = searchQuery;
      }

      const response = await api.get('/notifications', { params });

      if (response.data.success) {
        const newNotifications = response.data.notifications;
        
        if (refresh || pageNum === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications((prev) => [...prev, ...newNotifications]);
        }

        setUnreadCount(response.data.unreadCount);
        setHasMore(response.data.pagination.page < response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, searchQuery]);

  // ── Load More ────────────────────────────────────────────────────────────
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  };

  // ── Refresh ──────────────────────────────────────────────────────────────
  const onRefresh = () => {
    setPage(1);
    fetchNotifications(1, true);
  };

  // ── Mark as Read ─────────────────────────────────────────────────────────
  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  // ── Mark All as Read ─────────────────────────────────────────────────────
  const markAllAsRead = async () => {
    try {
      const response = await api.patch('/notifications/mark-all-read');
      if (response.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        Alert.alert('Success', 'All notifications marked as read');
      }
    } catch (error) {
      console.error('Mark all as read error:', error);
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  // ── Delete Notification ──────────────────────────────────────────────────
  const deleteNotification = async (notificationId) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/notifications/${notificationId}`);
              const deletedNotif = notifications.find((n) => n.id === notificationId);
              setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
              if (deletedNotif && !deletedNotif.isRead) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
              }
            } catch (error) {
              console.error('Delete notification error:', error);
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  // ── Handle Notification Tap ──────────────────────────────────────────────
  const handleNotificationPress = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    navigateToReference(navigation, notification);
  };

  // ── Initial Load ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchNotifications(1);
  }, [filter]);

  // ── Search Handler ───────────────────────────────────────────────────────
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(1);
      fetchNotifications(1);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // ── Render Empty State ───────────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyText}>
        You're all caught up! We'll notify you when something new happens.
      </Text>
    </View>
  );

  // ── Render Header ────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search notifications..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textLight}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'unread' && styles.filterButtonActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </Text>
        </TouchableOpacity>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Ionicons name="checkmark-done-outline" size={18} color={colors.primary} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ── Render Footer ────────────────────────────────────────────────────────
  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      {renderHeader()}

      {/* Notifications List */}
      {loading && page === 1 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onPress={() => handleNotificationPress(item)}
              onDelete={deleteNotification}
              onMarkAsRead={markAsRead}
            />
          )}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={notifications.length === 0 && styles.emptyListContainer}
        />
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.inputBackground,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  filterTextActive: {
    color: colors.white,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 4,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  unreadCard: {
    backgroundColor: '#F0F9FF',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  icon: {
    fontSize: 24,
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: colors.textLight,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    padding: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});
