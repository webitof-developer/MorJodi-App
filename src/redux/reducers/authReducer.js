
import { LOGIN_SUCCESS, LOGOUT, SET_LOADING, SET_USER_DATA, UPDATE_USER_DATA } from '../actions/authActions';

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: true,
  isApproved: true, // Default to true until loaded to prevent flash
  isPremium: false,
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        token: action.payload.token,
        user: action.payload.user || state.user,
        isApproved: action.payload.user?.isApproved ?? state.isApproved,
        isPremium: action.payload.user?.isPremium ?? state.isPremium,
        isLoading: false,
      };
    case LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      };
    case SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case SET_USER_DATA:
    case UPDATE_USER_DATA:
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

export default authReducer;
