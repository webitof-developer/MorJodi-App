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

// ✅ Async thunks (same as before)
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ page = 1, limit = 30 } = {}, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE_URL}/api/notifications?page=${page}&limit=${limit}`, config);
      // console.log('notification data',response.data)
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
  async (_, { getState }) => {
    const { token } = getState().auth;
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    const response = await axios.get(`${API_BASE_URL}/api/notifications/unread-user-count`, config);
    return response.data;
  }
);

// ✅ Slice
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.hasMore = true;
      state.currentPage = 1;
    },
    markLocalNotificationAsRead: (state, action) => {
      const notificationId = action.payload;
      const index = state.notifications.findIndex(n => n._id === notificationId);
      if (index !== -1) {
        state.notifications[index].isRead = true;
        state.notifications[index].isOpen = true;
      }
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    addNotification: (state, action) => {
      const incoming = action.payload;
      const index = state.notifications.findIndex(n => n._id === incoming._id);

      if (index !== -1) {
        // Remove existing
        state.notifications.splice(index, 1);
        // If it was read before, and now it's unread (logic in controller sets isRead=false), increment unread
        // But simplistic view: just unshift. The controller says isRead: false.
        // If the old one was read, count++
        // If the old one was unread, count stays same (we already counted it)
        // However, this logic is tricky if we don't know the OLD state perfectly here.
        // Let's assume the controller sends 'isRead: false'.
        // If the item in state was read, we increment.
        // BUT simpler:
        // We removed it. Now we add it. 
        // We will just re-calculate unread count or trust the increment.
        // Actually, let's keep it simple:
        // If we remove an UNREAD item, we decrement. Then we add an UNREAD item, we increment. Net change 0.
        // If we remove a READ item, we don't decrement. We add an UNREAD item, we increment. Net change +1.
      } else {
        state.unreadCount += 1;
      }

      // Add to top
      state.notifications.unshift(incoming);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const { notifications, page, limit } = action.payload;

        if (page === 1) {
          state.notifications = notifications;
        } else {
          // Filter out duplicates just in case
          const newNotifications = notifications.filter(
            (n) => !state.notifications.some((existing) => existing._id === n._id)
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
      // Mark All as Read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
        state.unreadCount = 0;
      })
      // Mark One as Read
      .addCase(markOneNotificationAsRead.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.notifications.findIndex(n => n._id === updated._id);
        if (index !== -1) {
          state.notifications[index] = updated;
          if (!updated.isRead) state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // Unread Count
      .addCase(fetchUnreadNotificationCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      // Mark One as Open
      .addCase(markOneNotificationAsOpen.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.notifications.findIndex(n => n._id === updated._id);
        if (index !== -1) state.notifications[index] = updated;
      })
      .addCase(fetchUnreadUserNotificationCount.fulfilled, (state, action) => {
        const { totalUsersWithMessages } = action.payload; // Assuming response contains this
        state.totalUsersWithMessages = totalUsersWithMessages; // Update the total users with unread messages
      });
  },
});

export const { clearNotifications, markLocalNotificationAsRead, incrementUnreadCount, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
