import { createSlice } from '@reduxjs/toolkit';

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    filters: {},
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
  },
});

export const { setFilters, clearFilters } = searchSlice.actions;

export default searchSlice.reducer;
