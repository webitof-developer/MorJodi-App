import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';

/**
 * ✅ Generate new FCM Token
 * - Called only after successful login
 * - Always refreshes to avoid mixing users on same device
 */
export async function generateNewFcmToken(jwtToken) {
  try {
    // 🧹 Step 1: Clear any old token - Wrap in try/catch to prevent crash on some devices
    try {
      await messaging().deleteToken();
      await AsyncStorage.removeItem('fcmToken');
    } catch (e) {
      console.log("Delete token failed (non-fatal):", e);
    }

    // 🔐 Step 2: Request user permission for notifications
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      // console.log('❌ Notification permission denied by user.');
      return;
    }

    // 🔥 Step 3: Generate new FCM token
    const newToken = await messaging().getToken();

    if (newToken) {
      // console.log('📱 New FCM Token generated:', newToken);

      // Save to local storage
      await AsyncStorage.setItem('fcmToken', newToken);

      // 🔁 Step 4: Send token to backend for this logged-in user
      await axios.post(
        `${API_BASE_URL}/api/notifications/fcm-token`,
        { token: newToken },
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );
    }
  } catch (error) {
    // console.log('🚫 Error generating FCM token after login:', error.message);
  }
}

/**
 * 🔄 Token Refresh Listener
 * - Firebase may refresh tokens periodically
 * - Automatically updates backend
 */
export function registerTokenRefresh(jwtToken) {
  messaging().onTokenRefresh(async (newToken) => {
    try {
      // console.log('🔄 Refreshed FCM Token:', newToken);
      await AsyncStorage.setItem('fcmToken', newToken);

      await axios.post(
        `${API_BASE_URL}/api/notifications/fcm-token`,
        { token: newToken },
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );
    } catch (error) {
      // console.log('🚫 Error saving refreshed token:', error.message);
    }
  });
}

/**
 * 🚪 Clear FCM Token
 * - Used during logout
 * - Removes token from Firebase + AsyncStorage
 */
export async function clearFcmToken() {
  try {
    await messaging().deleteToken();
    await AsyncStorage.removeItem('fcmToken');
    // console.log('🧹 FCM token cleared on logout.');
  } catch (error) {
    // console.log('🚫 Error clearing FCM token:', error.message);
  }
}
