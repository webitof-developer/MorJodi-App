import React, { useEffect, useState, useCallback, useContext } from 'react';
import { useInterest } from '../contexts/InterestContext';
import { useLike } from '../contexts/LikeContext';
import { useBlock } from '../contexts/BlockContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
  RefreshControl,
} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import {
  fetchNotifications,
  markOneNotificationAsRead,
  fetchUnreadNotificationCount,
  fetchUnreadUserNotificationCount,
} from '../redux/slices/notificationSlice';
import { fetchUnreadMessageCount } from '../redux/slices/messageSlice';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../localization/i18n';
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import SkeletonActivity from '../components/SkeletonActivity';
import { useProfileActions } from '../contexts/ProfileActionsContext';
import SubscriptionModal from '../components/SubscriptionModal';
import { LanguageContext } from '../contexts/LanguageContext';

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
const ActivityScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { notifications, loading, hasMore, currentPage } = useSelector(
    (state) => state.notifications,
  );
  const { language } = useContext(LanguageContext);
  const t = (key, opts) => i18n.t(key, { locale: language, ...opts });

  // Context
  const { receivedInterests } = useInterest();
  const { likedProfiles } = useLike();
  const { blockedProfiles } = useBlock();

  // Notification filter
  const [activeFilter, setActiveFilter] = useState('all');

  // Visitor count for the stats card
  const [visitorCount, setVisitorCount] = useState(0);

  const [refreshing, setRefreshing] = useState(false);

  // ── useProfileActions (item=null) ──
  const {
    openProfileById,
    handleViewVisitors,
    subscriptionModalVisible,
    subscriptionModalMessage,
    setSubscriptionModalVisible,
    handleSubscriptionUpgrade,
  } = useProfileActions(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────────────────
  const fetchVisitorCount = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/user/viewers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVisitorCount(data?.viewers?.length || 0);
    } catch {
      // silent
    }
  }, [token]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchNotifications({ page: 1, limit: 30 })),
        dispatch(fetchUnreadNotificationCount()),
        dispatch(fetchUnreadUserNotificationCount()),
        dispatch(fetchUnreadMessageCount()),
        fetchVisitorCount(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, fetchVisitorCount]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        onRefresh();
      }
    }, [token, onRefresh]),
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Notifications: Group by Date
  // ─────────────────────────────────────────────────────────────────────────
  const getGroupedNotifications = () => {
    if (!notifications || notifications.length === 0) return [];

    const filteredList = notifications
      .filter((item) => {
        if (activeFilter === 'unread') return !item.isRead;
        if (activeFilter === 'read') return item.isRead;
        return true;
      })
      .sort((a, b) => {
        const dA = new Date(a.updatedAt || a.createdAt);
        const dB = new Date(b.updatedAt || b.createdAt);
        return dB - dA;
      });

    if (filteredList.length === 0) return [];

    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'days').startOf('day');
    const groups = { Today: [], Yesterday: [], Earlier: [] };

    filteredList.forEach((item) => {
      const date = moment(item.updatedAt || item.createdAt);
      if (date.isSameOrAfter(today)) groups.Today.push(item);
      else if (date.isSameOrAfter(yesterday)) groups.Yesterday.push(item);
      else groups.Earlier.push(item);
    });

    const sections = [];
    if (groups.Today.length > 0)
      sections.push({ title: i18n.t('activity.sections.today') || 'Today', data: groups.Today });
    if (groups.Yesterday.length > 0)
      sections.push({
        title: i18n.t('activity.sections.yesterday') || 'Yesterday',
        data: groups.Yesterday,
      });
    if (groups.Earlier.length > 0)
      sections.push({
        title: i18n.t('activity.sections.earlier') || 'Earlier',
        data: groups.Earlier,
      });

    return sections;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────────────────────────────────
  const getOrCreateChatId = async (recipientId) => {
    if (!recipientId) return null;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/create`,
        { recipientId },
        config,
      );
      if (response.data?.success && response.data?.chat?._id) {
        return response.data.chat._id;
      }
      return null;
    } catch {
      return null;
    }
  };


  const handleNotificationPress = async (item) => {
    try {
      if (!item.isRead) {
        await dispatch(markOneNotificationAsRead(item._id));
        await dispatch(fetchUnreadNotificationCount());
        await dispatch(fetchUnreadUserNotificationCount());
      }

      const type = item.type;
      const referenceId = item.referenceId;
      const senderId = item.senderId?._id || item.senderId;

      if (type === 'message') {
        const chatId = referenceId || (await getOrCreateChatId(senderId));
        if (chatId) {
          navigation.navigate('MessageScreen', { chatId, notificationId: item._id });
        }
        return;
      }
      if (type === 'interest') {
        if (senderId) await openProfileById({ _id: senderId });
        return;
      }
      if (type === 'view') {
        if (senderId) await openProfileById({ _id: senderId });
        return;
      }
      if (senderId) {
        await openProfileById({ _id: senderId });
      }
    } catch {
      // silent
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      dispatch(fetchNotifications({ page: currentPage + 1, limit: 30 }));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Notification Icon
  // ─────────────────────────────────────────────────────────────────────────
  const getIcon = (type) => {
    switch (type) {
      case 'interest':
        return { icon: 'heart', color: '#E91E63', lib: 'Ionicons' };
      case 'view':
        return { icon: 'eye', color: COLORS.primary, lib: 'Ionicons' };
      case 'message':
        return { icon: 'chatbubble-ellipses', color: COLORS.success, lib: 'Ionicons' };
      case 'approval':
        return { icon: 'checkmark-circle', color: COLORS.success, lib: 'Ionicons' };
      default:
        return { icon: 'notifications', color: COLORS.warning, lib: 'Ionicons' };
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Renderers
  // ─────────────────────────────────────────────────────────────────────────
  const renderNotificationItem = ({ item }) => {
    const { icon, color } = getIcon(item.type);
    const isUnread = !item.isRead;
    const messageUnreadCount = item.type === 'message' ? Number(item.unreadCount ?? 0) : 0;

    return (
      <TouchableOpacity
        style={[styles.notificationCard, isUnread && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>

        <View style={styles.contentContainer}>
          <Text style={[styles.messageText, isUnread && styles.boldText]} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.timeText}>
            {moment(item.updatedAt || item.createdAt).fromNow()}
          </Text>
        </View>

        {isUnread && item.type === 'message' && messageUnreadCount > 0 ? (
          <View
            style={[
              styles.unreadDot,
              { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
            ]}
          >
            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
              {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
            </Text>
          </View>
        ) : isUnread ? (
          <View style={styles.unreadDot} />
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Visitor tab content
  // ─────────────────────────────────────────────────────────────────────────
  const renderVisitorContent = () => {
    if (visitorsLoading) {
      return (
        <View style={{ flex: 1, backgroundColor: '#f6f6fb' }}>
          <SkeletonList count={8} />
        </View>
      );
    }

    if (visitorsError) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={56} color={COLORS.gray + '80'} />
          <Text style={styles.emptyText}>{visitorsError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchVisitors}>
            <Text style={styles.retryText}>{t('activityScreen.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (visitors.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="eye-off-outline" size={60} color={COLORS.gray + '80'} />
          <Text style={styles.emptyText}>{t('activityScreen.noVisitors')}</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={visitors}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <VisitorCard
            item={item}
            onPress={() => openProfileById(item)}
          />
        )}
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: 30 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      />
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CustomHeader titleKey="customeHeaders.activity" navigation={navigation} />

      <View style={styles.container}>

        {/* ── Stats Row ─────────────────────────────────── */}
        <View style={styles.statsRow}>
          {/* Requests */}
          <TouchableOpacity
            style={styles.statsCard}
            onPress={() => navigation.navigate('InterestedUsersScreen')}
            activeOpacity={0.7}
          >
            <Text style={styles.statsCount}>{receivedInterests?.length || 0}</Text>
            <Text style={styles.statsLabel}>{t('activityScreen.requests')}</Text>
          </TouchableOpacity>

          {/* Visitors — gated via handleViewVisitors, navigates to ProfileVisitorsScreen */}
          <TouchableOpacity
            style={styles.statsCard}
            onPress={async () => {
              const granted = await handleViewVisitors();
              if (granted) navigation.navigate('ProfileVisitorsScreen');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.statsCount}>{visitorCount}</Text>
            <Text style={styles.statsLabel}>{t('activityScreen.visitors')}</Text>
          </TouchableOpacity>

          {/* Liked */}
          <TouchableOpacity
            style={styles.statsCard}
            onPress={() => navigation.navigate('LikedProfiles')}
            activeOpacity={0.7}
          >
            <Text style={styles.statsCount}>{likedProfiles?.length || 0}</Text>
            <Text style={styles.statsLabel}>{t('activityScreen.liked')}</Text>
          </TouchableOpacity>

          {/* Blocked */}
          <TouchableOpacity
            style={styles.statsCard}
            onPress={() => navigation.navigate('BlockedProfiles')}
            activeOpacity={0.7}
          >
            <Text style={styles.statsCount}>{blockedProfiles?.length || 0}</Text>
            <Text style={styles.statsLabel}>{t('activityScreen.blocked')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Notifications ─────────────────────────────── */}
        {loading && !refreshing && notifications.length === 0 ? (
          <SkeletonActivity count={8} />
        ) : (
          <>
            {/* Filters */}
            <View style={styles.filterContainer}>
              {['all', 'unread', 'read'].map((filter) => {
                const label =
                  filter === 'all'
                    ? t('activityScreen.filterAll')
                    : filter === 'unread'
                      ? t('activityScreen.filterUnread')
                      : t('activityScreen.filterRead');
                const isActive = activeFilter === filter;
                return (
                  <TouchableOpacity
                    key={filter}
                    onPress={() => setActiveFilter(filter)}
                    style={[styles.filterChip, isActive && styles.activeFilterChip]}
                  >
                    <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <SectionList
              sections={getGroupedNotifications()}
              keyExtractor={(item) => item._id}
              renderItem={renderNotificationItem}
              renderSectionHeader={renderSectionHeader}
              contentContainerStyle={{ paddingBottom: 20 }}
              stickySectionHeadersEnabled={false}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loading && notifications.length > 0 ? (
                  <View style={{ paddingVertical: 20 }}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                ) : null
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[COLORS.primary]}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="bell-sleep-outline"
                    size={60}
                    color={COLORS.gray + '80'}
                  />
                  <Text style={styles.emptyText}>
                    {i18n.t('activity.notifications.empty')}
                  </Text>
                </View>
              }
            />
          </>
        )}
      </View>

      {/* Subscription modal (from handleViewVisitors gate) */}
      <SubscriptionModal
        visible={subscriptionModalVisible}
        message={subscriptionModalMessage}
        onClose={() => setSubscriptionModalVisible(false)}
        onUpgradePress={handleSubscriptionUpgrade}
      />
    </SafeAreaView>
  );
};

export default ActivityScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f6fb',
  },

  // ── Stats Row ───────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    marginTop: SIZES.base * 2,
    marginBottom: SIZES.base,
    gap: 8,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCardActive: {
    borderWidth: 1.5,
    borderColor: COLORS.primary + '60',
    backgroundColor: COLORS.primary + '08',
  },
  statsCount: {
    ...FONTS.h3,
    color: '#C62828',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  statsLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontWeight: '500',
  },

  // ── Tab Switcher ────────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.padding,
    marginBottom: 4,
    gap: 10,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#eef0f5',
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  tabText: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // ── Notification Filters ────────────────────────────────────────
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.padding,
    paddingBottom: 8,
    marginTop: SIZES.base,
    gap: 10,
  },
  filterChip: {
    backgroundColor: '#eef0f5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    ...FONTS.body5,
    color: '#6b7280',
  },
  activeFilterText: {
    color: COLORS.white,
  },

  // ── Section Header ──────────────────────────────────────────────
  sectionHeader: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    marginTop: SIZES.base,
  },
  sectionHeaderText: {
    ...FONTS.h4,
    color: COLORS.darkGray,
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 4,
  },

  // ── Notification Card ───────────────────────────────────────────
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: SIZES.padding,
    marginHorizontal: SIZES.padding,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unreadCard: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary + '70',
    borderWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  messageText: {
    ...FONTS.body4,
    color: COLORS.black,
    marginBottom: 4,
    lineHeight: 20,
  },
  boldText: {
    ...FONTS.h4,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 11,
    color: COLORS.gray,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },

  // ── Visitor Card ────────────────────────────────────────────────
  visitorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: SIZES.padding,
    marginHorizontal: SIZES.padding,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  visitorAvatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  visitorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.gray + '40',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFA000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  visitorInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  visitorName: {
    ...FONTS.body4,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  visitorSub: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  visitorLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  visitorLoc: {
    fontSize: 11,
    color: COLORS.gray,
    flexShrink: 1,
  },

  // ── Empty / Error ────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 30,
  },
  emptyText: {
    marginTop: 16,
    ...FONTS.body3,
    color: COLORS.gray,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 20,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
});
