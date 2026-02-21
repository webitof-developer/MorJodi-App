
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/config';

export const fetchProfiles = createAsyncThunk(
  'profiles/fetchProfiles',
  async ({ profileType, filters = {}, page = 1 }, { getState }) => {
    const { auth } = getState();
    const config = {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
      params: { page, limit: 10 }
    };

    // For POST requests, params are not automatically added by axios to query string if passed in config with data
    // But axios handles it if method is GET. For POST (search), we need to append manually or put in query string.
    // Actually, axios `params` option works for POST too, it appends to URL.

    let url = `${API_BASE_URL}/api/matches/preferences`;
    let method = 'get';
    let data = {};

    if (Object.keys(filters).length > 0) {
      url = `${API_BASE_URL}/api/matches/search`;
      method = 'post';
      data = filters;
    } else if (profileType === 'all') {
      url = `${API_BASE_URL}/api/matches`;
    } else if (profileType === 'verified') {
      url = `${API_BASE_URL}/api/matches/verified`;
    }
    else if (profileType === 'nearby') {
      url = `${API_BASE_URL}/api/matches/nearby`;
    } else if (profileType === 'justJoined') {
      url = `${API_BASE_URL}/api/matches/today`;
    } else if (profileType === 'search') {
      url = `${API_BASE_URL}/api/matches/search`;
    }

    let response;
    // We pass `params` (page/limit) in config.
    if (method === 'post') {
      response = await axios.post(url, data, config);
    } else {
      response = await axios.get(url, config);
    }

    return { profileType, data: response.data, page };
  }
);

const profilesSlice = createSlice({
  name: 'profiles',
  initialState: {
    all: [],
    yourMatches: [],
    nearby: [],
    justJoined: [],
    search: [],
    verified: [],
    idWiseProfile: null,
    status: 'idle',
    fetchingMore: false, // New status for infinite scroll
    error: null,
    pagination: {}, // store totalPages per type
  },
  reducers: {
    removeProfile: (state, action) => {
      // Remove profile from all relevant arrays
      for (const key in state) {
        if (Array.isArray(state[key])) {
          state[key] = state[key].filter(
            (profile) => profile._id !== action.payload
          );
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfiles.pending, (state, action) => {
        if (action.meta.arg.page > 1) {
          state.fetchingMore = true;
        } else {
          state.status = 'loading';
        }
      })
      .addCase(fetchProfiles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.fetchingMore = false;
        const payload = action.payload?.data;
        const page = action.payload.page;
        const type = action.payload.profileType;

        let list = [];
        let totalPages = 1;

        // Parse Response
        if (Array.isArray(payload)) {
          list = payload;
        } else if (payload && (Array.isArray(payload.matches) || Array.isArray(payload.profiles))) {
          list = payload.matches || payload.profiles;
          totalPages = payload.totalPages || 1;
        }

        // Store pagination info
        state.pagination[type] = {
          currentPage: page,
          totalPages: totalPages
        };

        // Append or Replace
        if (page > 1) {
          // Filter duplicates just in case
          const existingIds = new Set(state[type].map(p => p._id));
          const newItems = list.filter(p => !existingIds.has(p._id));
          state[type] = [...state[type], ...newItems];
        } else {
          state[type] = list;
        }

        state.error = null;
      })
      .addCase(fetchProfiles.rejected, (state, action) => {
        state.status = 'failed';
        state.fetchingMore = false;
        state.error = action.error.message;
        // clear the list that failed to prevent stale/invalid data ONLY if page 1
        if (action.meta?.arg?.profileType && action.meta.arg.page === 1) {
          state[action.meta.arg.profileType] = [];
        }
      })
      .addCase(fetchIdWiseProfile.pending, (state) => {
        state.status = 'loading';
        state.idWiseProfile = null;
      })
      .addCase(fetchIdWiseProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.idWiseProfile = action.payload;
      })
      .addCase(fetchIdWiseProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
        state.idWiseProfile = null;
      });
  },
});

export const fetchIdWiseProfile = createAsyncThunk(
  'profiles/fetchIdWiseProfile',
  async (userId, { getState }) => {
    const { auth } = getState();
    const config = {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    };
    const formatted = (userId || '').trim().toUpperCase();
    const variants = [
      { profileId: formatted },
      { profileCode: formatted },
      { userId: formatted },
    ];

    let lastError;
    for (const body of variants) {
      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/api/matches/id-search`,
          body,
          config
        );
        // Some APIs wrap the profile; others return it directly
        return data?.profile || data;
      } catch (err) {
        lastError = err;
        // If not-found, try next payload; otherwise break
        const status = err?.response?.status;
        if (status && status >= 500) break;
      }
    }

    if (lastError?.response?.status === 404) {
      return null;
    }
    throw lastError || new Error('Search failed');
  }
);

export const { removeProfile } = profilesSlice.actions;

export default profilesSlice.reducer;
