import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../../constants/config";

// -------------------------
// FETCH PREMIUM PROFILES
// -------------------------
export const fetchPremiumProfiles = createAsyncThunk(
  "home/fetchPremiumProfiles",
  async (_, { getState }) => {
    const { auth } = getState();
    const config = {
      headers: { Authorization: `Bearer ${auth.token}` }
    };
    const { data } = await axios.get(
      `${API_BASE_URL}/api/matches/premium-profiles`,
      config
    );
    return data.users || [];
  }
);

// -------------------------
// FETCH NEARBY PROFILES
// -------------------------
export const fetchNearbyProfiles = createAsyncThunk(
  "home/fetchNearbyProfiles",
  async (_, { getState }) => {
    const { auth } = getState();
    const config = {
      headers: { Authorization: `Bearer ${auth.token}` }
    };
    const { data } = await axios.get(
      `${API_BASE_URL}/api/matches/nearby`,
      config
    );

    // Check for array directly or matches/users key
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.matches)) return data.matches;
    if (Array.isArray(data.users)) return data.users;
    return [];
  }
);

const homeSlice = createSlice({
  name: "home",
  initialState: {
    premium: [],
    nearby: [],
    loading: false,
    error: null,
  },

  reducers: {
    // REMOVE A PROFILE FROM BOTH LISTS INSTANTLY
    removeFromHome: (state, action) => {
      const id = action.payload;

      state.premium = state.premium.filter(p => p._id !== id);
      state.nearby = state.nearby.filter(p => p._id !== id);
    }
  },

  extraReducers: (builder) => {
    builder
      // ---- PREMIUM ----
      .addCase(fetchPremiumProfiles.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPremiumProfiles.fulfilled, (state, action) => {
        state.loading = false;
        state.premium = action.payload;
      })
      .addCase(fetchPremiumProfiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // ---- NEARBY ----
      .addCase(fetchNearbyProfiles.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNearbyProfiles.fulfilled, (state, action) => {
        state.loading = false;
        state.nearby = action.payload;
      })
      .addCase(fetchNearbyProfiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { removeFromHome } = homeSlice.actions;

export default homeSlice.reducer;
