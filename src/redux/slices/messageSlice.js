
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/config';

export const fetchUnreadMessageCount = createAsyncThunk(
  'messages/fetchUnreadCount',
  async (_, { getState }) => {
    const { token } = getState().auth;
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };
    const response = await axios.get(`${API_BASE_URL}/api/chat/unread/count`, config);
    return response.data.count;
  }
);

export const markMessagesAsRead = createAsyncThunk(
  'messages/markAsRead',
  async (chatId, { getState }) => {
    const { token } = getState().auth;
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };
    await axios.put(`${API_BASE_URL}/api/chat/${chatId}/read`, {}, config);
    return chatId;
  }
);

const messageSlice = createSlice({
  name: 'messages',
  initialState: {
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    setUnreadMessageCount: (state, action) => {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnreadMessageCount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUnreadMessageCount.fulfilled, (state, action) => {
        state.loading = false;
        state.unreadCount = action.payload;
      })
      .addCase(fetchUnreadMessageCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(markMessagesAsRead.fulfilled, (state) => {
        state.unreadCount = 0;
      });
  },
});

export const { setUnreadMessageCount } = messageSlice.actions;
export default messageSlice.reducer;
