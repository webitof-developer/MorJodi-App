import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import ImageView from 'react-native-image-viewing';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { API_BASE_URL } from '../constants/config';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { useSocket } from '../components/SocketManager';
import UserStatus from '../components/UserStatus';
import {
  markOneNotificationAsRead,
  fetchUnreadNotificationCount,
  markLocalNotificationAsRead,
  fetchUnreadUserNotificationCount,
} from '../redux/slices/notificationSlice';
import SubscriptionModal from '../components/SubscriptionModal';
import { SafeAreaView } from 'react-native-safe-area-context';

const MessageScreen = ({ route, navigation }) => {
  const { chatId, notificationId } = route.params || {};
  const { token, user } = useSelector(state => state.auth);
  const { subscription } = useSelector(state => state.subscription);
  const dispatch = useDispatch();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [chatInfo, setChatInfo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const flatListRef = useRef(null);
  const socketRef = useRef(null);
  const { onlineUsers, socket } = useSocket();
  const [subscriptionModalVisible, setSubscriptionModalVisible] =
    useState(false);
  const [subscriptionModalMessage, setSubscriptionModalMessage] = useState('');
  const [fullScreenImage, setFullScreenImage] = useState(null);

  const status = chatInfo?._id
    ? onlineUsers?.[chatInfo._id] || {
      status: 'offline',
      lastActive: chatInfo?.lastActive,
    }
    : { status: 'offline', lastActive: null };

  const generateChannelName = (id1, id2) => [id1, id2].sort().join('_');

  // �o. SOCKET CONNECTION + LISTENERS
  useEffect(() => {
    if (!socket || !chatId) return;
    socketRef.current = socket;
    socket.emit('joinChat', chatId);

    const handleNewMessage = message => {
      if (message.chat === chatId) {
        setMessages(prev => {
          const matchIndex = message.clientId
            ? prev.findIndex(m => m.clientId === message.clientId)
            : -1;
          if (matchIndex >= 0) {
            const updated = [...prev];
            updated[matchIndex] = message;
            return updated;
          }
          const exists = prev.some(m => m._id === message._id);
          if (exists) return prev;
          return [message, ...prev];
        });
        scrollToBottom();

        // dYY� Auto mark as read if chat is open
        if (user?._id) {
          socket.emit('readMessagesInChat', {
            chatId,
            userId: user._id,
          });
        }
      }
    };

    const handleStatusUpdate = payload => {
      const { messageId, chatId: updatedChatId, userId, status } = payload || {};
      if (updatedChatId && updatedChatId !== chatId) return;

      if (messageId) {
        setMessages(prev =>
          prev.map(m => (m._id === messageId ? { ...m, status } : m)),
        );
        return;
      }

      if (status === 'read' && userId && userId !== user._id) {
        setMessages(prev =>
          prev.map(m => (m.sender === user._id ? { ...m, status } : m)),
        );
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageStatusUpdate', handleStatusUpdate);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageStatusUpdate', handleStatusUpdate);
    };
  }, [socket, chatId, user?._id]);

  // ✅ Emit read event when messages load or update
  useEffect(() => {
    if (socketRef.current && chatId && user?._id && messages.length > 0) {
      socketRef.current.emit('readMessagesInChat', {
        chatId,
        userId: user._id,
      });
    }
  }, [chatId, messages.length]);

  // ✅ Fetch chat info
  useEffect(() => {
    const fetchChatInfo = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/chat/${chatId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success && data.chat) {
          const other = data.chat.participants.find(p => p._id !== user._id);
          setChatInfo(other);
        }
      } catch (err) { }
    };
    if (token) fetchChatInfo();
  }, [chatId, token]);

  // ✅ Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/chat/${chatId}/messages`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.data.success) {
          setMessages([...res.data.messages].reverse());
        }
      } catch (err) { }
    };
    if (token) fetchMessages();
  }, [chatId, token]);

  // ✅ Mark messages & notifications read on open
  useEffect(() => {
    const markAsRead = async () => {
      try {
        await axios.put(
          `${API_BASE_URL}/api/chat/${chatId}/read`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        // Mark chat as open
        await axios.put(
          `${API_BASE_URL}/api/chat/${chatId}/open`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (notificationId) {
          dispatch(markOneNotificationAsRead(notificationId));
          dispatch(markLocalNotificationAsRead(notificationId));
          dispatch(fetchUnreadNotificationCount());
          dispatch(fetchUnreadUserNotificationCount());

        }
      } catch (err) { }
    };
    if (chatId && token) markAsRead();

    // Cleanup: Mark chat as closed when component unmounts
    return () => {
      if (chatId && token) {
        axios.put(
          `${API_BASE_URL}/api/chat/${chatId}/close`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ).catch(err => console.log('Error closing chat:', err));
      }
    };
  }, [chatId, token, notificationId, dispatch]);

  // ✅ Initiate Voice/Video Call
  const initiateCall = async type => {
    const recipientId = chatInfo?._id;
    const recipientName = chatInfo?.fullName;
    if (!recipientId) {
      Alert.alert('Error', 'Recipient not found.');
      return;
    }
    const feature = type === 'voice_call' ? 'Calling' : 'Video Call';
    const planFeatures = subscription?.subscription?.plan?.features || [];
    const hasFeature = planFeatures.some(f =>
      typeof f === 'string' ? f === feature : f?.name === feature,
    );
    if (!hasFeature) {
      Alert.alert('Upgrade Required', `Please upgrade to use ${feature}.`);
      return;
    }

    try {
      const channelName = generateChannelName(user._id, recipientId);
      const { data } = await axios.post(
        `${API_BASE_URL}/api/agora/initiate-call`,
        { recipientId, callType: type, channelName },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!data.success || !data.message) {
        Alert.alert('Error', 'Unable to start call.');
        return;
      }

      const callMessage = data.message;
      const screen =
        type === 'voice_call' ? 'VoiceCallScreen' : 'VideoCallScreen';
      navigation.navigate(screen, {
        channelName: callMessage.channelName,
        token: callMessage.agoraToken,
        recipientId,
        recipientName,
        messageId: callMessage._id,
        chatId,
      });
    } catch (err) {
      Alert.alert('Error', 'Unable to start call.');
    }
  };

  // ✅ Image Picker
  const pickImage = async () => {
    if (Platform.OS === 'android') {
      const permission =
        Platform.Version >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

      const hasPermission = await PermissionsAndroid.check(permission);
      if (!hasPermission) {
        const granted = await PermissionsAndroid.request(permission);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission required', 'Please allow photo access to send images.');
          return;
        }
      }
    }

    const options = {
      mediaType: "photo",
      selectionLimit: 1,
      quality: 0.6,
      maxWidth: 1280,
      maxHeight: 1280,
      includeBase64: false,
    };

    launchImageLibrary(options, async res => {
      if (res.didCancel) return;
      if (res.errorCode) {
        Alert.alert('Error', res.errorMessage || 'Unable to open gallery.');
        return;
      }
      const asset = res.assets?.[0];
      if (!asset?.uri) {
        Alert.alert('Error', 'Unable to select image.');
        return;
      }
      await sendMessage(null, asset);
    });
  };



  const handleSubscription = () => {
    setSubscriptionModalVisible(false);
    navigation.navigate('HomeTabs', { screen: 'Upgrade' });
  };

  const sendMessage = async (textMessage, imageAsset = null) => {
    const text = textMessage || inputText.trim();
    if (!text && !imageAsset) return;

    const clientId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimisticMessage = {
      _id: clientId,
      clientId,
      chat: chatId,
      sender: user?._id,
      text: text || null,
      imageUrl: null,
      localImageUri: imageAsset?.uri || null,
      type: imageAsset ? 'image' : 'text',
      status: 'sent',
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages(prev => [optimisticMessage, ...prev]);
    setInputText('');
    scrollToBottom();

    const formData = new FormData();
    if (text) formData.append('text', text);
    formData.append('clientId', clientId);
    if (imageAsset) {
      formData.append('image', {
        uri: imageAsset.uri,
        type: imageAsset.type || 'image/jpeg',
        name: imageAsset.fileName || `photo_${Date.now()}.jpg`,
      });
    }

    if (imageAsset) setUploading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/chat/${chatId}/send`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      const data = res.data;

      // ✅ success
      if (data.success) {
        setMessages(prev =>
          prev.map(m => (m.clientId === clientId ? data.message : m)),
        );
        scrollToBottom();
        return;
      }

      // ✅ backend may send success=false with known code
      if (
        data.code === 'IMAGE_PREMIUM_REQUIRED' ||
        data.code === 'LIMIT_REACHED'
      ) {
        setMessages(prev => prev.filter(m => m.clientId !== clientId));
        setSubscriptionModalMessage(data.message);
        setSubscriptionModalVisible(true);
        return;
      }

      // ✅ fallback on any message implying subscription
      if (
        typeof data.message === 'string' &&
        /(subscribe|subscription|premium|plan|upgrade)/i.test(data.message)
      ) {
        setMessages(prev => prev.filter(m => m.clientId !== clientId));
        setSubscriptionModalMessage(data.message);
        setSubscriptionModalVisible(true);
        return;
      }

      setMessages(prev => prev.filter(m => m.clientId !== clientId));
      Alert.alert('Notice', data.message || 'Unable to send message.');
    } catch (error) {
      const res = error?.response?.data || {};

      // ✅ always check code first
      const code = res.code;
      const msg = res.message || 'Failed to send message.';

      if (code === 'IMAGE_PREMIUM_REQUIRED' || code === 'LIMIT_REACHED') {
        setMessages(prev => prev.filter(m => m.clientId !== clientId));
        setSubscriptionModalMessage(msg);
        setSubscriptionModalVisible(true);
        return;
      }

      // ✅ flexible fallback for any plan-related messages
      if (/(subscribe|subscription|premium|plan|upgrade)/i.test(msg)) {
        setMessages(prev => prev.filter(m => m.clientId !== clientId));
        setSubscriptionModalMessage(msg);
        setSubscriptionModalVisible(true);
        return;
      }

      // fallback for non-subscription issues
      setMessages(prev => prev.filter(m => m.clientId !== clientId));
      Alert.alert('Error', msg);
    } finally {
      setUploading(false);
    }
  };

  // ✅ Scroll helper
  const scrollToBottom = () => {
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
    }, 100);
  };

  // ✅ Render messages
  const renderMessage = useCallback(({ item }) => {
    const isMine = item.sender === user._id;
    if (item.type === 'voice_call' || item.type === 'video_call') {
      const icon =
        item.type === 'voice_call' ? 'call-outline' : 'videocam-outline';
      const direction =
        item.callDirection === 'outgoing' ? 'Outgoing' : 'Incoming';
      return (
        <View style={styles.callNotificationContainer}>
          <Icon name={icon} size={20} color={COLORS.primary} />
          <Text style={styles.callNotificationText}>
            {direction} {item.type.replace('_', ' ')} - {item.callStatus}
          </Text>
        </View>
      );
    }

    const MessageStatus = () => {
      if (!isMine) return null;
      const iconName =
        item.status === 'read'
          ? 'checkmark-done-sharp'
          : item.status === 'delivered'
            ? 'checkmark-done-outline'
            : 'checkmark-outline';
      const color = item.status === 'read' ? '#34B7F1' : COLORS.white;
      return (
        <Icon name={iconName} size={16} color={color} style={styles.tickIcon} />
      );
    };

    return (
      <View
        style={[
          styles.messageBubble,
          isMine ? styles.myMessage : styles.theirMessage,
        ]}
      >
        {(item.imageUrl || item.localImageUri) && (
          <TouchableOpacity onPress={() => setFullScreenImage(item.imageUrl || item.localImageUri)}>
            <Image
              source={{ uri: item.imageUrl || item.localImageUri, cache: 'force-cache' }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        {item.text ? (
          <Text style={[styles.messageText, !isMine && { color: '#000' }]}>
            {item.text}
          </Text>
        ) : null}
        <View style={styles.messageInfoContainer}>
          <Text style={styles.timeText}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>

          <View style={styles.statusWrapper}>
            <MessageStatus />
          </View>
        </View>
      </View>
    );
  }, [user?._id]);

  const keyExtractor = useCallback(item => item._id || item.clientId, []);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
        <Icon name="chevron-back" size={30} color="#111827" />
      </TouchableOpacity>

      {chatInfo && (
        <TouchableOpacity
          style={styles.headerUserInfo}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('ProfileDetailScreen', {
              profileId: chatInfo?._id,
              item: chatInfo,
            })
          }
        >
          <Image
            source={
              chatInfo?.photos?.[0]
                ? {
                  uri: chatInfo?.photos?.[0],
                }
                : require('../assets/plaseholder.png')
            }
            style={styles.headerAvatar}
          />
          <View>
            <Text style={styles.headerName}>
              {chatInfo?.fullName || 'User'}
            </Text>
            <UserStatus
              isOnline={status?.status === 'online'}
              lastActive={status?.lastActive}
              variant="small"
            />
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.callButtonsContainer}>
        <TouchableOpacity
          onPress={() => initiateCall('video_call')}
          style={styles.callButtonHeader}
        >
          <Icon name="videocam-outline" size={26} color="#111827" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => initiateCall('voice_call')}
          style={styles.callButtonHeader}
        >
          <Icon name="call-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {renderHeader()}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          inverted
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          keyboardDismissMode="on-drag"
          maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 40 }}
          keyExtractor={keyExtractor}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToBottom}
        />
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.plusButton}>
            <Icon name="add" size={32} color="#111827" />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Text here"
              placeholderTextColor="#9ca3af"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
          </View>

          <TouchableOpacity
            disabled={uploading}
            onPress={() => sendMessage(inputText)}
            style={[styles.sendButton, uploading && { opacity: 0.6 }]}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Icon name="send" size={20} color="#fff" style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>
        </View>
        <SubscriptionModal
          visible={subscriptionModalVisible}
          message={subscriptionModalMessage}
          onUpgradePress={handleSubscription}
          onClose={() => setSubscriptionModalVisible(false)}
        />
        <ImageView
          images={[{ uri: fullScreenImage }]}
          imageIndex={0}
          visible={!!fullScreenImage}
          onRequestClose={() => setFullScreenImage(null)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MessageScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6fb' },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f3f4f6',
  },
  headerName: { ...FONTS.h3, color: '#111827', fontSize: 16, marginBottom: 2 },
  callButtonsContainer: { flexDirection: 'row', alignItems: 'center' },
  callButtonHeader: {
    padding: 8,
    marginLeft: 4,
  },
  messageList: { paddingHorizontal: 14, paddingVertical: 12 },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    padding: 12,
    marginVertical: 6,
  },
  myMessage: {
    backgroundColor: COLORS.white,
    alignSelf: 'flex-end',
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderColor: '#eceff4',
  },
  theirMessage: {
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
    borderTopLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#eceff4',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 14,
    marginBottom: 6,
  },
  messageText: { ...FONTS.body4, color: '#111827', },
  timeText: {
    ...FONTS.body5,
    color: '#9ca3af',
    marginRight: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white, // Or #121212 if dark mode required, but user asked for light theme UI logic
    borderTopWidth: 1,
    borderTopColor: '#eef0f5', // Light border
  },
  plusButton: {
    marginRight: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6', // Light gray pill background
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    ...FONTS.body4,
    color: '#111827',
    paddingVertical: 4,
    minHeight: 36,
  },
  stickerButton: {
    marginLeft: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  callNotificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginVertical: 6,
  },
  callNotificationText: {
    ...FONTS.body4,
    color: '#6b7280',
    marginLeft: 8,
  },
  messageInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  tickIcon: { marginLeft: 4 },
  statusWrapper: {
    marginLeft: 0,
  },
});
