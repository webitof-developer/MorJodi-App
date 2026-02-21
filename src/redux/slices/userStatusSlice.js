
import { createSlice } from '@reduxjs/toolkit';

const userStatusSlice = createSlice({
  name: 'userStatus',
  initialState: {
    onlineUsers: {},
  },
  reducers: {
    setUserStatus: (state, action) => {
      const { userId, status, lastActive } = action.payload;
      state.onlineUsers[userId] = { status, lastActive };
    },
    setInitialUserStatuses: (state, action) => {
      action.payload.forEach(user => {
        state.onlineUsers[user.userId] = { status: user.status, lastActive: user.lastActive };
      });
    },
  },
});

export const { setUserStatus, setInitialUserStatuses } = userStatusSlice.actions;
export default userStatusSlice.reducer;
