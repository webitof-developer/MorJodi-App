import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/config';
export const fetchSubscription = createAsyncThunk(
  'subscription/fetchSubscription',
  async (_, { getState }) => {
    const { auth } = getState();
    const config = {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    };
const { data } = await axios.get(`${API_BASE_URL}/api/payment/mine`, config);
    return data;
  }
);

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState: {
    subscription: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    setSubscription: (state, action) => {
      state.subscription = action.payload;
    },
    clearSubscription: (state) => {
      state.subscription = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscription.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.subscription = action.payload;
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { setSubscription, clearSubscription } = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
