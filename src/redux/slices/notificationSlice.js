import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/config';

const initialState = {
  notifications: [],
  unreadMessages: [],
  unreadCount: 0,
  totalUsersWithMessages: 0,
  loading: false,
  error: null,
  hasMore: true,
  currentPage: 1,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ page = 1, limit = 30 } = {}, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE_URL}/api/notifications?page=${page}&limit=${limit}`, config);
      return { notifications: response.data.notifications, page, limit };
    } catch (error) {
      return rejectWithValue(error?.response?.data || error.message);
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API_BASE_URL}/api/notifications/mark-as-read`, {}, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data || error.message);
    }
  }
);

export const markOneNotificationAsRead = createAsyncThunk(
  'notifications/markOneAsRead',
  async (notificationId, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API_BASE_URL}/api/notifications/${notificationId}/mark-as-read`, {}, config);
      return response.data.notification;
    } catch (error) {
      return rejectWithValue(error?.response?.data || error.message);
    }
  }
);

export const fetchUnreadNotificationCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE_URL}/api/notifications/unread-count`, config);
      return response.data.count;
    } catch (error) {
      return rejectWithValue(error?.response?.data || error.message);
    }
  }
);

export const markOneNotificationAsOpen = createAsyncThunk(
  'notifications/markOneAsOpen',
  async (notificationId, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API_BASE_URL}/api/notifications/${notificationId}/mark-as-open`, {}, config);
      return response.data.notification;
    } catch (error) {
      return rejectWithValue(error?.response?.data || error.message);
    }
  }
);

export const fetchUnreadUserNotificationCount = createAsyncThunk(
  'notifications/fetchUnreadUserNotificationCount',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      const response = await axios.get(`${API_BASE_URL}/api/notifications/unread-user-count`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data || error.message);
    }
  }
);

export const markMessageNotificationsByChatAsRead = createAsyncThunk(
  'notifications/markMessageByChatAsRead',
  async (chatId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      const response = await axios.post(`${API_BASE_URL}/api/notifications/mark-message-read/${chatId}`, {}, config);
      return { chatId, data: response.data };
    } catch (error) {
      return rejectWithValue(error?.response?.data || error.message);
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications: state => {
      state.notifications = [];
      state.unreadCount = 0;
      state.totalUsersWithMessages = 0;
      state.hasMore = true;
      state.currentPage = 1;
    },
    markLocalNotificationAsRead: (state, action) => {
      const notificationId = action.payload;
      const index = state.notifications.findIndex(n => n._id === notificationId);
      if (index !== -1) {
        const wasUnread = !state.notifications[index].isRead;
        state.notifications[index].isRead = true;
        state.notifications[index].isOpen = true;
        if (wasUnread) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      }
    },
    incrementUnreadCount: state => {
      state.unreadCount += 1;
    },
    addNotification: (state, action) => {
      const incoming = action.payload;
      const index = state.notifications.findIndex(n => n._id === incoming._id);
      const wasReadBefore = index !== -1 ? !!state.notifications[index].isRead : true;

      if (index !== -1) {
        state.notifications.splice(index, 1);
      }

      const shouldIncreaseUnread = incoming?.isRead === false && wasReadBefore;
      if (shouldIncreaseUnread) {
        state.unreadCount += 1;
      }

      state.notifications.unshift(incoming);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchNotifications.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const { notifications, page, limit } = action.payload;

        if (page === 1) {
          state.notifications = notifications;
        } else {
          const newNotifications = notifications.filter(
            n => !state.notifications.some(existing => existing._id === n._id)
          );
          state.notifications = [...state.notifications, ...newNotifications];
        }

        state.currentPage = page;
        state.hasMore = notifications.length === limit;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, state => {
        state.notifications = state.notifications.map(n => ({ ...n, isRead: true, isOpen: true }));
        state.unreadCount = 0;
      })
      .addCase(markOneNotificationAsRead.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.notifications.findIndex(n => n._id === updated._id);
        if (index !== -1) {
          const wasUnread = !state.notifications[index].isRead;
          state.notifications[index] = updated;
          if (wasUnread && updated.isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      })
      .addCase(fetchUnreadNotificationCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markOneNotificationAsOpen.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.notifications.findIndex(n => n._id === updated._id);
        if (index !== -1) state.notifications[index] = updated;
      })
      .addCase(markMessageNotificationsByChatAsRead.fulfilled, (state, action) => {
        const { chatId } = action.payload;
        state.notifications = state.notifications.map(n => {
          const sameChatMessage =
            n.type === 'message' &&
            String(n.referenceId) === String(chatId);
          if (!sameChatMessage) return n;
          return { ...n, isRead: true, isOpen: true };
        });
      })
      .addCase(fetchUnreadUserNotificationCount.fulfilled, (state, action) => {
        const { totalUsersWithMessages } = action.payload;
        state.totalUsersWithMessages = totalUsersWithMessages;
      })
      .addCase(fetchUnreadUserNotificationCount.rejected, state => {
        state.totalUsersWithMessages = 0;
      });
  },
});

export const { clearNotifications, markLocalNotificationAsRead, incrementUnreadCount, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
