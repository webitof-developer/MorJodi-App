import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/config';
import { clearFilters } from '../slices/searchSlice';
import { fetchSubscription } from '../slices/subscriptionSlice';
import { generateNewFcmToken, clearFcmToken } from '../../utils/notificationHelper';
import { isTokenExpired } from '../../utils/authSession';

export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGOUT = 'LOGOUT';
export const SET_LOADING = 'SET_LOADING';
export const SET_USER_DATA = 'SET_USER_DATA';
export const UPDATE_USER_DATA = 'UPDATE_USER_DATA';

// Called after successful login (OTP or manual)
// - Saves token and user to Redux
// - Generates fresh FCM token for that user
// - Saves FCM token in backend
export const loginSuccess =
  ({ token, user = null }) =>
  async dispatch => {
    try {
      dispatch({
        type: LOGIN_SUCCESS,
        payload: { token, user },
      });

      if (token) {
        await generateNewFcmToken(token);
        dispatch(fetchSubscription());
      }
    } catch (error) {
      // intentionally silent
    }
  };

// Logout user (explicit only)
// - Removes auth token
// - Clears local filters
// - Deletes FCM token from device
export const logout = () => async dispatch => {
  try {
    const token = await AsyncStorage.getItem('token');

    if (token) {
      try {
        await axios.post(
          `${API_BASE_URL}/api/notifications/fcm-token`,
          { token: null },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch (error) {
        // ignore backend cleanup failure
      }
    }

    await clearFcmToken();
    await AsyncStorage.removeItem('token');
    dispatch({ type: LOGOUT });
    dispatch(clearFilters());
  } catch (error) {
    // intentionally silent
  }
};

export const setLoading = isLoading => ({
  type: SET_LOADING,
  payload: isLoading,
});

export const setUserData = userData => ({
  type: SET_USER_DATA,
  payload: userData,
});

export const updateUserData = userData => ({
  type: UPDATE_USER_DATA,
  payload: userData,
});

// Fetch current user data using saved token; keeps token even if request fails
export const fetchUserData = () => async dispatch => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) return null;

    const response = await axios.get(`${API_BASE_URL}/api/user/singleuser`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data?.success) {
      dispatch(setUserData(response.data.user));
      return response.data.user;
    }

    return null;
  } catch (error) {
    // keep token; let user stay signed in
    return null;
  }
};

// Check saved token (auto-login)
// - Runs on app startup
// - Keeps session alive unless user explicitly logs out
export const checkToken = () => async dispatch => {
  dispatch(setLoading(true));
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      if (token) {
        await AsyncStorage.removeItem('token');
      }
      dispatch({ type: LOGOUT });
      dispatch(clearFilters());
      dispatch(setLoading(false));
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/user/singleuser`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response?.data?.success && response?.data?.user) {
        await dispatch(loginSuccess({ token, user: response.data.user }));
      } else {
        await dispatch(loginSuccess({ token }));
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem('token');
        dispatch({ type: LOGOUT });
        dispatch(clearFilters());
      } else {
        // Keep token for non-auth failures (e.g., temporary network issue)
        await dispatch(loginSuccess({ token }));
      }
    }
  } finally {
    dispatch(setLoading(false));
  }
};
