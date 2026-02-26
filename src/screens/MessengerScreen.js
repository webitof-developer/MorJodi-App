import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
  TextInput,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import {
  markMessagesAsRead,
  fetchUnreadMessageCount,
} from '../redux/slices/messageSlice';
import { fetchProfiles } from '../redux/slices/profilesSlice';
import {
  markOneNotificationAsRead,
  markLocalNotificationAsRead,
  fetchUnreadNotificationCount,
  fetchUnreadUserNotificationCount,
} from '../redux/slices/notificationSlice';
import { API_BASE_URL } from '../constants/config';
import CustomHeader from '../components/CustomHeader';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSocket } from '../components/SocketManager';
import i18n from '../localization/i18n';
import { LanguageContext } from '../contexts/LanguageContext';
import SkeletonMessenger from '../components/SkeletonMessenger';

const MessengerScreen = ({ navigation }) => {
  const { token, user } = useSelector(state => state.auth);
  const { yourMatches, status: matchesStatus } = useSelector(
    state => state.profiles,
  );
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch();
  const { onlineUsers, socket } = useSocket();
  const { language } = useContext(LanguageContext);
  const t = (key, opts) => i18n.t(key, { locale: language, ...opts });
  const statusItems = useMemo(
    () =>
      chats
        .filter(chat => {
          const userId = chat.otherParticipant?._id;
          const status = onlineUsers?.[userId];
          if (!status) return false;
          if (status.status === 'online') return true;
          const lastActive = status.lastActive ? new Date(status.lastActive) : null;
          if (!lastActive) return false;
          return Date.now() - lastActive.getTime() <= 15 * 60 * 1000;
        })
        .slice(0, 8),
    [chats, onlineUsers],
  );

  const matchIdSet = useMemo(
    () => new Set((yourMatches || []).map(profile => profile?._id)),
    [yourMatches],
  );

  const filteredChats = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const base = (() => {
      if (activeFilter === 'unread') {
        return chats.filter(chat => (chat.unreadCount || 0) > 0);
      }
      if (activeFilter === 'matches') {
        return chats.filter(chat =>
          matchIdSet.has(chat.otherParticipant?._id),
        );
      }
      return chats;
    })();

    if (!query) return base;
    return base.filter(chat => {
      const name = (chat.otherParticipant?.fullName || '').toLowerCase();
      const lastText = (chat.lastMessage?.text || '').toLowerCase();
      return name.includes(query) || lastText.includes(query);
    });
  }, [activeFilter, chats, matchIdSet, searchQuery]);

  useEffect(() => {
    if (activeFilter !== 'matches') return;
    if (!token) return;
    if (matchesStatus === 'loading') return;
    if (!yourMatches || yourMatches.length === 0) {
      dispatch(fetchProfiles({ profileType: 'yourMatches' }));
    }
  }, [activeFilter, token, matchesStatus, yourMatches, dispatch]);


  // ✅ Define fetchChats FIRST (so it can be reused)
  const fetchChats = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/chat/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setChats(data.chats);
      dispatch(fetchUnreadMessageCount());
      dispatch(fetchUnreadUserNotificationCount());
    } catch (error) {
      // console.log('⚠️ Error fetching chats:', error.message);
    } finally {
      setLoading(false);
    }
  }, [token, dispatch]);

  // ✅ Focus effect: load chats initially
  useFocusEffect(
    useCallback(() => {
      if (token) fetchChats();
    }, [token, fetchChats]),
  );

  // ✅ Pull-to-refresh (calls same fetchChats)
  const onRefresh = useCallback(async () => {
    if (!token) return;
    try {
      setRefreshing(true);
      await fetchChats();
    } catch (err) {
      //console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  }, [token, fetchChats]);

  // ✅ Initialize socket connection
  useEffect(() => {
    if (!socket || !token || !user?._id) return;

    const normalizeSenderId = sender => {
      if (!sender) return null;
      if (typeof sender === 'object') return String(sender._id || sender.id || '');
      return String(sender);
    };

    const handleNewMessage = message => {
      setChats(prevChats => {
        const updated = [...prevChats];
        const index = updated.findIndex(c => c._id === message.chat);

        if (index !== -1) {
          const chat = { ...updated[index] };
          const prevLastMessageId = chat.lastMessage?._id
            ? String(chat.lastMessage._id)
            : null;
          const incomingMessageId = message?._id ? String(message._id) : null;
          const isDuplicateMessage =
            !!incomingMessageId && incomingMessageId === prevLastMessageId;

          chat.lastMessage = message;
          const senderId = normalizeSenderId(message.sender);
          const isOwnMessage = !!senderId && senderId === String(user._id);
          if (!isOwnMessage && !isDuplicateMessage) {
            chat.unreadCount = (chat.unreadCount || 0) + 1;
          }
          chat.updatedAt = new Date();
          updated.splice(index, 1);
          updated.unshift(chat);
        } else {
          dispatch(fetchUnreadMessageCount());
          dispatch(fetchUnreadUserNotificationCount());
        }

        return updated;
      });
    };

    const handleStatusUpdate = payload => {
      const { chatId, status } = payload || {};
      if (!chatId) return;
      setChats(prev =>
        prev.map(chat =>
          chat._id === chatId
            ? {
              ...chat,
              lastMessage: chat.lastMessage
                ? { ...chat.lastMessage, status }
                : chat.lastMessage,
            }
            : chat,
        ),
      );
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageStatusUpdate', handleStatusUpdate);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageStatusUpdate', handleStatusUpdate);
    };
  }, [socket, token, user?._id, dispatch]);

  // ✅ Open chat
  const handleChatPress = useCallback(async (chatId, messageNotificationId) => {
    try {
      await dispatch(markMessagesAsRead(chatId));

      if (messageNotificationId) {
        await dispatch(markOneNotificationAsRead(messageNotificationId));
        dispatch(markLocalNotificationAsRead(messageNotificationId));
        dispatch(fetchUnreadNotificationCount());
        dispatch(fetchUnreadUserNotificationCount());
      }

      setChats(prev =>
        prev.map(chat =>
          chat._id === chatId ? { ...chat, unreadCount: 0 } : chat,
        ),
      );

      navigation.navigate('MessageScreen', {
        chatId,
        notificationId: messageNotificationId,
      });
    } catch (error) {
      // console.log('❌ Error opening chat:', error.message);
    }
  }, [dispatch, navigation]);

  const getLastMessageText = useCallback(item => {
    if (!item.lastMessage) return t('messengerScreen.noMessages');
    const isMine = item.lastMessage.sender === user?._id;
    if (['voice_call', 'video_call'].includes(item.lastMessage.type)) {
      const callStatus = item.lastMessage.callStatus;
      return `${isMine ? t('messengerScreen.you') : ''}${item.lastMessage.type.replace(
        '_',
        ' ',
      )} - ${callStatus}`;
    }
    return `${isMine ? t('messengerScreen.you') : ''}${item.lastMessage.text || t('messengerScreen.image')}`;
  }, [user?._id, language]);

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={[styles.chatCard, item.unreadCount > 0 && styles.unreadChatCard]}
      onPress={() => handleChatPress(item._id, item.messageNotificationId)}
      activeOpacity={0.85}
    >
      <View style={styles.avatarWrapper}>
        <Image
          source={
            item.otherParticipant?.photos?.[0]
              ? { uri: item.otherParticipant.photos[0], cache: 'force-cache' }
              : require('../assets/plaseholder.png')
          }
          style={styles.avatar}
        />

        {onlineUsers?.[item.otherParticipant?._id]?.status === 'online' && (
          <View style={styles.onlineDot} />
        )}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatTopRow}>
          <Text style={styles.chatName} numberOfLines={1}>
            {item.otherParticipant.fullName}
          </Text>
          <Text style={styles.chatTime}>
            {item.lastMessage
              ? new Date(item.lastMessage.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
              : ''}
          </Text>
        </View>
        <View style={styles.chatBottomRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {getLastMessageText(item)}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  ), [handleChatPress, onlineUsers, getLastMessageText]);

  const keyExtractor = useCallback(item => item._id, []);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <CustomHeader titleKey="customeHeaders.messenger" navigation={navigation} />
        <View style={styles.topPanel}>
          <View style={styles.searchBar}>
            <FontAwesome name="search" size={16} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder={t('messengerScreen.searchChats')}
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
          <View style={styles.filterRow}>
            <TouchableOpacity
              onPress={() => setActiveFilter('all')}
              style={[
                styles.filterChip,
                activeFilter === 'all' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'all' && styles.filterChipTextActive,
                ]}
              >
                {t('messengerScreen.all')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveFilter('unread')}
              style={[
                styles.filterChip,
                activeFilter === 'unread' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'unread' && styles.filterChipTextActive,
                ]}
              >
                {t('messengerScreen.unread')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveFilter('matches')}
              style={[
                styles.filterChip,
                activeFilter === 'matches' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'matches' && styles.filterChipTextActive,
                ]}
              >
                {t('messengerScreen.matches')}
              </Text>
            </TouchableOpacity>
          </View>
          {statusItems.length > 0 && (
            <View style={styles.statusRow}>
              <Text style={styles.statusTitle}>{t('messengerScreen.activeNow')}</Text>
              <FlatList
                data={statusItems}
                horizontal
                keyExtractor={item => `status-${item._id}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statusList}
                renderItem={({ item }) => (
                  <View style={styles.statusItem}>
                    <View style={styles.statusRing}>
                      <Image
                        source={
                          item.otherParticipant?.photos?.[0]
                            ? { uri: item.otherParticipant.photos[0], cache: 'force-cache' }
                            : require('../assets/plaseholder.png')
                        }
                        style={styles.statusAvatar}
                      />
                    </View>
                    <Text style={styles.statusName} numberOfLines={1}>
                      {item.otherParticipant?.fullName || t('messengerScreen.user')}
                    </Text>
                  </View>
                )}
              />
            </View>
          )}
        </View>
        {loading ? (
          <View style={{ flex: 1 }}>
            <SkeletonMessenger count={7} />
          </View>
        ) : filteredChats.length > 0 ? (
          <FlatList
            data={filteredChats}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            updateCellsBatchingPeriod={50}
            windowSize={7}
            removeClippedSubviews={Platform.OS === 'android'}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]} // Android
                tintColor={COLORS.primary} // iOS
              />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesome name="comments-o" size={60} color={COLORS.gray} />
            <Text style={styles.emptyText}>
              {activeFilter === 'unread'
                ? t('messengerScreen.noUnreadChats')
                : activeFilter === 'matches'
                  ? t('messengerScreen.noMatchesYet')
                  : t('messenger.empty')}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fb' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topPanel: {
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#eef0f5',
  },
  searchInput: {
    ...FONTS.body4,
    color: '#111827',
    marginLeft: 8,
    flex: 1,
    paddingVertical: 6,
  },
  filterRow: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: '#eef0f5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  filterChipText: {
    ...FONTS.body5,
    color: '#6b7280',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  statusRow: {
    marginTop: 10,
  },
  statusTitle: {
    ...FONTS.body4,
    color: '#111827',
    marginBottom: 6,
  },
  statusList: {
    paddingBottom: 8,
  },
  statusItem: {
    alignItems: 'center',
    marginRight: 12,
    width: 64,
  },
  statusRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: '#fff0f4',
  },
  statusAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  statusName: {
    ...FONTS.body5,
    color: '#6b7280',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 16,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: '#ffffffff',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unreadChatCard: {

    borderLeftColor: COLORS.primary,
    backgroundColor: '#fff5f7',
  },
  avatarWrapper: {
    marginRight: 12,
    padding: 2,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  chatContent: { flex: 1 },
  chatTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  chatName: { ...FONTS.h3, color: '#0f172a' },
  lastMessage: {
    ...FONTS.body4,
    color: '#6b7280',
    flex: 1,
    marginRight: 10,
  },
  chatTime: { ...FONTS.body5, color: '#8b93a7' },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  onlineDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 12,
    height: 12,
    backgroundColor: COLORS.green,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  unreadText: { color: COLORS.white, ...FONTS.body5 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fb',
  },
  emptyText: { ...FONTS.h3, color: COLORS.gray },
});

export default MessengerScreen;
