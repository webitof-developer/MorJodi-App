import notifee, { AndroidStyle } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAT_NOTIFICATION_PREFIX = 'chat_msg_';
const CHAT_NOTIFICATION_LINES_PREFIX = 'chat_msg_lines_';
const PERSON_NOTIFICATION_PREFIX = 'person_evt_';
const MAX_UNREAD_LINES = 6;

const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === 'object') {
    const maybeId = value._id || value.id;
    return maybeId ? String(maybeId) : null;
  }
  const raw = String(value).trim();
  if (!raw || raw === 'undefined' || raw === 'null') return null;
  return raw;
};

const getChatNotificationId = ({ chatId, senderId }) => {
  const normalizedChatId = normalizeId(chatId);
  const normalizedSenderId = normalizeId(senderId);
  const key = normalizedChatId || normalizedSenderId;
  return key ? `${CHAT_NOTIFICATION_PREFIX}${key}` : null;
};

const getPersonNotificationId = ({ type, senderId, referenceId }) => {
  const t = String(type || '').trim().toLowerCase();
  const s = normalizeId(senderId);
  const r = normalizeId(referenceId);
  if (!t) return null;
  const key = r || s;
  return key ? `${PERSON_NOTIFICATION_PREFIX}${t}_${key}` : `${PERSON_NOTIFICATION_PREFIX}${t}`;
};

const getLinesStorageKey = (notificationId) =>
  `${CHAT_NOTIFICATION_LINES_PREFIX}${notificationId}`;

const getDisplayText = ({ text, isImage }) => {
  if (isImage) return 'Photo';
  const cleaned = typeof text === 'string' ? text.trim() : '';
  return cleaned || 'New message';
};

const parseUnreadCount = (value, fallback = 0) => {
  const parsed = parseInt(String(value ?? fallback), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const readStoredLines = async (notificationId) => {
  const storageKey = getLinesStorageKey(notificationId);
  const raw = await AsyncStorage.getItem(storageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch (e) {
    return [];
  }
};

const saveStoredLines = async (notificationId, lines) => {
  const storageKey = getLinesStorageKey(notificationId);
  await AsyncStorage.setItem(storageKey, JSON.stringify(lines));
};

export const upsertChatMessageNotification = async ({ remoteMessage }) => {
  const data = remoteMessage?.data || {};
  const type = String(data?.type || '').toLowerCase();
  if (type !== 'message') return;

  const notificationId = getChatNotificationId({
    chatId: data?.chatId || data?.referenceId || data?.chat,
    senderId: data?.senderId,
  });
  if (!notificationId) return;

  const senderName =
    data?.senderName ||
    data?.title ||
    'New Message';
  const senderImage = data?.senderImage || remoteMessage?.notification?.imageUrl || '';
  const incomingText = getDisplayText({
    text:
      data?.lastUnreadMessage ||
      data?.body ||
      data?.message ||
      data?.notificationBody ||
      remoteMessage?.notification?.body ||
      '',
    isImage: data?.messageType === 'image',
  });

  const previousLines = await readStoredLines(notificationId);
  const unreadCount = parseUnreadCount(data?.unreadCount, previousLines.length + 1);

  const mergedLines = [...previousLines, incomingText].slice(-MAX_UNREAD_LINES);
  const lines =
    unreadCount <= 1
      ? [incomingText]
      : mergedLines.slice(-Math.min(unreadCount, MAX_UNREAD_LINES));

  await saveStoredLines(notificationId, lines);

  const mePerson = { name: 'You' };
  const senderPerson = {
    name: senderName,
    icon: senderImage || undefined,
  };
  const messages = lines.map((line, index) => ({
    text: line,
    timestamp: Date.now() - (lines.length - index) * 1000,
    person: senderPerson,
  }));

  await notifee.displayNotification({
    id: notificationId,
    title: senderName,
    body: incomingText,
    data: {
      ...data,
      localNotificationId: notificationId,
    },
    android: {
      channelId: 'default',
      pressAction: { id: 'default' },
      style: {
        type: AndroidStyle.MESSAGING,
        person: mePerson,
        messages,
        conversationTitle: senderName,
        groupConversation: false,
      },
    },
  });
};

export const clearChatMessageNotification = async ({ chatId, senderId }) => {
  const notificationId = getChatNotificationId({ chatId, senderId });
  if (!notificationId) return;

  try {
    await notifee.cancelNotification(notificationId);
  } catch (e) {
    // no-op
  }

  try {
    await notifee.cancelDisplayedNotification(notificationId);
  } catch (e) {
    // no-op
  }

  await AsyncStorage.removeItem(getLinesStorageKey(notificationId));
};

export const displayPersonEventNotification = async ({ remoteMessage }) => {
  const data = remoteMessage?.data || {};
  const type = String(data?.type || '').toLowerCase();
  const supportedTypes = new Set(['interest', 'view', 'interest_accepted', 'interest_declined']);
  if (!supportedTypes.has(type)) return;

  const notificationId = getPersonNotificationId({
    type,
    senderId: data?.senderId || data?.viewerId || data?.userId,
    referenceId: data?.referenceId || data?.interestId || data?.profileId,
  });

  const senderName = data?.senderName || data?.title || 'Notification';
  const senderImage = data?.senderImage || remoteMessage?.notification?.imageUrl || '';
  const body =
    data?.body ||
    data?.message ||
    data?.notificationBody ||
    remoteMessage?.notification?.body ||
    '';

  const senderPerson = {
    name: senderName,
    icon: senderImage || undefined,
  };

  await notifee.displayNotification({
    id: notificationId || undefined,
    title: senderName,
    body,
    data,
    android: {
      channelId: 'default',
      pressAction: { id: 'default' },
      style: {
        type: AndroidStyle.MESSAGING,
        person: { name: 'You' },
        messages: [
          {
            text: body || 'New notification',
            timestamp: Date.now(),
            person: senderPerson,
          },
        ],
        conversationTitle: senderName,
        groupConversation: false,
      },
    },
  });
};
