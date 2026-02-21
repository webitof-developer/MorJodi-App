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
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import {
  fetchNotifications,
  markOneNotificationAsRead,
  fetchUnreadNotificationCount,
} from '../redux/slices/notificationSlice';
import { fetchUnreadMessageCount } from '../redux/slices/messageSlice';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../localization/i18n';
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import SkeletonActivity from '../components/SkeletonActivity';


const ActivityScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { token } = useSelector(state => state.auth);
  const { notifications, loading, hasMore, currentPage } = useSelector(state => state.notifications);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread' | 'read'

  // Context Hooks
  const { receivedInterests } = useInterest();
  const { likedProfiles } = useLike();
  const { blockedProfiles } = useBlock();

  // Local State
  const [visitorCount, setVisitorCount] = useState(0);

  // ------------------------------------------------------------------
  // 1. DATA FETCHING
  // ------------------------------------------------------------------

  const fetchVisitorCount = async () => {
    try {
      if (token) {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${API_BASE_URL}/api/user/viewers`, config);
        if (response.data && response.data.viewers) {
          setVisitorCount(response.data.viewers.length);
        }
      }
    } catch (error) {
      // console.log("Error fetching visitors", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (token) {
        // dispatch(fetchNotifications({ page: 1, limit: 30 }));
        // dispatch(fetchUnreadNotificationCount());
        // dispatch(fetchUnreadMessageCount());
        // fetchVisitorCount();
        onRefresh();
      }
    }, [token, dispatch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    // await dispatch(fetchNotifications({ page: 1, limit: 30 }));
    // await dispatch(fetchUnreadNotificationCount());
    // await fetchVisitorCount();

    dispatch(fetchNotifications({ page: 1, limit: 30 }));
    dispatch(fetchUnreadNotificationCount());
    dispatch(fetchUnreadMessageCount());
    fetchVisitorCount();
    setRefreshing(false);
  };


  // ------------------------------------------------------------------
  // 2. HELPER: Group by Date with Filtering
  // ------------------------------------------------------------------
  const getGroupedNotifications = () => {
    if (!notifications || notifications.length === 0) return [];

    // Filter First
    const filteredList = notifications.filter(item => {
      if (activeFilter === 'unread') return !item.isRead;
      if (activeFilter === 'read') return item.isRead;
      return true; // 'all'
    }).sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt);
      const dateB = new Date(b.updatedAt || b.createdAt);
      return dateB - dateA; // Descending
    });

    if (filteredList.length === 0) return [];

    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'days').startOf('day');

    const groups = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    filteredList.forEach(item => {
      // Use updatedAt if available, else createdAt. 
      // This ensures updated notifications (like messages) float to Today.
      const date = moment(item.updatedAt || item.createdAt);
      if (date.isSameOrAfter(today)) {
        groups.Today.push(item);
      } else if (date.isSameOrAfter(yesterday)) {
        groups.Yesterday.push(item);
      } else {
        groups.Earlier.push(item);
      }
    });

    const sections = [];
    if (groups.Today.length > 0)
      sections.push({ title: i18n.t('activity.sections.today') || 'Today', data: groups.Today });
    if (groups.Yesterday.length > 0)
      sections.push({ title: i18n.t('activity.sections.yesterday') || 'Yesterday', data: groups.Yesterday });
    if (groups.Earlier.length > 0)
      sections.push({ title: i18n.t('activity.sections.earlier') || 'Earlier', data: groups.Earlier });

    return sections;
  };

  // ------------------------------------------------------------------
  // 3. NAVIGATION LOGIC
  // ------------------------------------------------------------------
  const getOrCreateChatId = async recipientId => {
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
    } catch (error) {
      return null;
    }
  };

  const handleNotificationPress = async (item) => {
    try {
      // Mark as read immediately
      if (!item.isRead) {
        dispatch(markOneNotificationAsRead(item._id));
        dispatch(fetchUnreadNotificationCount());
      }

      const type = item.type;
      const referenceId = item.referenceId; // New Field
      const senderId = item.senderId?._id || item.senderId;

      // --- REDIRECTION LOGIC ---

      // A. Message -> Chat Screen
      if (type === 'message') {
        // Ideally use referenceId as chatId if available, else find chat
        const chatId = referenceId || (await getOrCreateChatId(senderId));
        if (chatId) {
          navigation.navigate('MessageScreen', { chatId });
        }
        return;
      }

      // B. Interest -> Interest Details or Profile
      if (type === 'interest') {
        // If we had an InterestDetailScreen, we'd go there:
        // navigation.navigate('InterestDetailScreen', { interestId: referenceId });
        // Fallback to profile for now, or if referenceId is lacking
        if (senderId) navigation.navigate('ProfileDetailScreen', { profileId: senderId, item: { _id: senderId } });
        return;
      }

      // C. Profile View -> Profile Detail
      if (type === 'view') {
        if (senderId) navigation.navigate('ProfileDetailScreen', { profileId: senderId, item: { _id: senderId } });
        return;
      }

      // D. Fallback / Default
      if (senderId) {
        navigation.navigate('ProfileDetailScreen', { profileId: senderId, item: { _id: senderId } });
      }

    } catch (error) {
      //   console.error("Navigation error", error);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      dispatch(fetchNotifications({ page: currentPage + 1, limit: 30 }));
    }
  };

  // ------------------------------------------------------------------
  // 4. UI COMPONENTS
  // ------------------------------------------------------------------
  const getIcon = (type) => {
    switch (type) {
      case 'interest':
        return { icon: 'heart', color: '#E91E63', lib: 'Ionicons' }; // Heart (Pink)
      case 'view':
        return { icon: 'eye', color: COLORS.primary, lib: 'Ionicons' }; // Eye
      case 'message':
        return { icon: 'chatbubble-ellipses', color: COLORS.success, lib: 'Ionicons' }; // Chat
      case 'approval':
        return { icon: 'checkmark-circle', color: COLORS.success, lib: 'Ionicons' };
      default:
        return { icon: 'notifications', color: COLORS.warning, lib: 'Ionicons' }; // Default bell
    }
  };

  const renderItem = ({ item }) => {
    const { icon, color, lib } = getIcon(item.type);
    const isUnread = !item.isRead;

    return (
      <TouchableOpacity
        style={[styles.notificationCard, isUnread && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.8}
      >
        {/* Left Icon */}
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={[styles.messageText, isUnread && styles.boldText]} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.timeText}>{moment(item.updatedAt || item.createdAt).fromNow()}</Text>
        </View>

        {/* Unread Indicator (Dot or Count) */}
        {isUnread && (
          item.type === 'message' && item.count > 1 ? (
            <View style={[styles.unreadDot, { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                {item.count > 99 ? '99+' : item.count}
              </Text>
            </View>
          ) : (
            <View style={styles.unreadDot} />
          )
        )}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CustomHeader titleKey="customeHeaders.activity" navigation={navigation} />

      <View style={styles.container}>
        {loading && !refreshing && notifications.length === 0 ? (
          <SkeletonActivity count={8} />
        ) : (
          <>
            {/* --- Stats / Quick Access Row --- */}
            <View style={styles.statsRow}>
              {/* Requests */}
              <TouchableOpacity
                style={styles.statsCard}
                onPress={() => navigation.navigate('InterestedUsersScreen')}
                activeOpacity={0.7}
              >
                <Text style={styles.statsCount}>{receivedInterests?.length || 0}</Text>
                <Text style={styles.statsLabel}>Requests</Text>
              </TouchableOpacity>

              {/* Visitors */}
              <TouchableOpacity
                style={styles.statsCard}
                onPress={() => navigation.navigate('ProfileVisitorsScreen')}
                activeOpacity={0.7}
              >
                <Text style={styles.statsCount}>{visitorCount}</Text>
                <Text style={styles.statsLabel}>Visitors</Text>
              </TouchableOpacity>

              {/* Liked */}
              <TouchableOpacity
                style={styles.statsCard}
                onPress={() => navigation.navigate('LikedProfiles')}
                activeOpacity={0.7}
              >
                <Text style={styles.statsCount}>{likedProfiles?.length || 0}</Text>
                <Text style={styles.statsLabel}>Liked</Text>
              </TouchableOpacity>

              {/* Blocked */}
              <TouchableOpacity
                style={styles.statsCard}
                onPress={() => navigation.navigate('BlockedProfiles')}
                activeOpacity={0.7}
              >
                <Text style={styles.statsCount}>{blockedProfiles?.length || 0}</Text>
                <Text style={styles.statsLabel}>Blocked</Text>
              </TouchableOpacity>
            </View>

            {/* --- Filters Row --- */}
            <View style={styles.filterContainer}>
              {['all', 'unread', 'read'].map((filter) => {
                let label = 'All';
                if (filter === 'unread') label = 'Unread';
                if (filter === 'read') label = 'Read';

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
              renderItem={renderItem}
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
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="bell-sleep-outline" size={60} color={COLORS.gray + '80'} />
                  <Text style={styles.emptyText}>{i18n.t('activity.notifications.empty')}</Text>
                </View>
              }
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f6fb', // Slightly gray bg for list contrast
  },
  // Stats Row
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
    backgroundColor: '#ffffffff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 2,
    // elevation: 1,
  },
  statsCount: {
    ...FONTS.h3,
    color: '#C62828', // Red-ish color for numbers
    marginBottom: 4,
    fontWeight: 'bold',
  },
  statsLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  // Filters
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.padding,
    paddingBottom: 8, // Spacing before list
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
    backgroundColor: COLORS.primary,
  },
  // Section Header
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
  // Card
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: SIZES.padding,
    marginHorizontal: SIZES.padding,
    marginBottom: 8,
    borderRadius: 12,
    // Soft Shadow
    shadowColor: '#ffffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unreadCard: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary + '70', // Light primary border for unread
    borderWidth: 1,
  },
  // Icon
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  // Content
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
    ...FONTS.h4, // Bolder font for unread
    fontWeight: '600',
  },
  timeText: {
    fontSize: 11,
    color: COLORS.gray,
  },
  // Unread Dot
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },
  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    ...FONTS.body3,
    color: COLORS.gray,
  },
});

export default ActivityScreen;
