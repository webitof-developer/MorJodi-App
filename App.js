import React, { useEffect, useState } from 'react';
import { LogBox, Platform, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import { LikeProvider } from './src/contexts/LikeContext';
import { BlockProvider } from './src/contexts/BlockContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import SocketManager from './src/components/SocketManager';
import '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { generateNewFcmToken, registerTokenRefresh } from './src/utils/notificationHelper';
import { fetchNotifications, fetchUnreadNotificationCount } from './src/redux/slices/notificationSlice';
import { navigate } from './src/navigation/navigationRef';
import { COLORS } from './src/constants/theme';
import { API_BASE_URL } from './src/constants/config';
import { InterestProvider } from './src/contexts/InterestContext';
import Icon from 'react-native-vector-icons/Ionicons';
import UpdateManager from './src/components/UpdateManager';
import NoticeManager from './src/components/NoticeManager';

const AppContent = () => {
  const { user, token } = useSelector(state => state.auth);
  const [isReady, setIsReady] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [serverDown, setServerDown] = useState(false);
  const [serverChecking, setServerChecking] = useState(false);
  const dispatch = useDispatch();
  const pollRef = React.useRef(null);
  const serverPollRef = React.useRef(null);

  const setOfflineFromState = state => {
    const offline =
      state?.type === 'none' ||
      state?.type === 'unknown' ||
      state?.isConnected === false ||
      state?.isInternetReachable === false;
    setIsOffline(offline);
  };

  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/health`, { timeout: 4000 });
        if (!res || res.status >= 500) {
          setServerDown(true);
        } else {
          setServerDown(false);
        }
      } catch (e) {
        const status = e?.response?.status;
        if (status && status < 500) {
          setServerDown(false);
        } else {
          setServerDown(true);
        }
      }
    };

    // Axios interceptors for global server error detection
    const reqInterceptor = axios.interceptors.request.use(
      config => config,
      error => {
        setServerDown(true);
        setIsReady(true);
        return Promise.reject(error);
      },
    );

    const resInterceptor = axios.interceptors.response.use(
      response => {
        if (response?.status && response.status < 500) {
          setServerDown(false);
        }
        return response;
      },
      error => {
        const status = error?.response?.status;
        if (!error.response || status >= 500) {
          setServerDown(true);
          setIsReady(true);
        }
        return Promise.reject(error);
      },
    );

    // Lightweight ping to detect backend availability
    let cancelled = false;
    const pingServer = async () => {
      if (cancelled) return;
      await checkServer();
      if (!cancelled) setIsReady(true);
    };
    pingServer();

    // Initial connectivity check
    NetInfo.fetch().then(setOfflineFromState);

    const unsubscribeNetInfo = NetInfo.addEventListener(setOfflineFromState);

    // Fallback poll every 5s to cover edge cases (cold start / background resume)
    pollRef.current = setInterval(() => {
      NetInfo.fetch().then(setOfflineFromState);
    }, 5000);

    serverPollRef.current = setInterval(() => {
      checkServer();
    }, 15000);

    LogBox.ignoreLogs([
      '[Reanimated] Tried to synchronously call a non-worklet function',
      '[Reanimated] Reduced motion setting is enabled on this device.',
    ]);

    const initializeApp = async () => {
      let unsubscribeForeground;
      let unsubscribeNotificationOpened;

      try {
        if (token) {
          console.log('Initializing push + socket setup...');

          if (Platform.OS === 'android') {
            await notifee.createChannel({
              id: 'default',
              name: 'Default Channel',
              importance: AndroidImportance.HIGH,
              sound: 'default',
            });
          }

          const lastUser = await AsyncStorage.getItem('lastFcmUser');
          if (lastUser !== user?._id) {
            await generateNewFcmToken(token);
            await AsyncStorage.setItem('lastFcmUser', user?._id || '');
          }

          // ✅ Fetch General Settings
          try {
            const settingsRes = await axios.get(`${API_BASE_URL}/api/settings/public`);
            if (settingsRes.data) {
              const dynamicSettings = settingsRes.data;
              if (typeof global !== 'undefined' && global.__APP_ENV__) {
                // Update global environment with dynamic values
                global.__APP_ENV__ = { ...global.__APP_ENV__, ...dynamicSettings };
                console.log("✅ Dynamic Settings Loaded:", Object.keys(dynamicSettings));

                // Initialize analytics
                const analyticsService = require('./src/services/analyticsService').default;
                await analyticsService.initialize({
                  gaTrackingId: dynamicSettings.GA_MEASUREMENT_ID || dynamicSettings.GA_TRACKING_ID,
                  fbAppId: dynamicSettings.META_APP_ID || dynamicSettings.FACEBOOK_APP_ID,
                });
              }
            }
          } catch (err) {
            console.error("⚠️ Failed to load dynamic settings:", err.message);
          }

          registerTokenRefresh(token);

          unsubscribeForeground = messaging().onMessage(async remoteMessage => {
            console.log('Foreground message:', remoteMessage);

            const payload = remoteMessage.notification || remoteMessage.data || {};
            if (remoteMessage.data?.senderId === user?._id) return;

            const notificationTitle = payload.title;
            const notificationBody = payload.body;

            if (notificationTitle || notificationBody) {
              await notifee.displayNotification({
                title: notificationTitle,
                body: notificationBody,
                android: { channelId: 'default' },
              });
            }

            dispatch(fetchNotifications());
            dispatch(fetchUnreadNotificationCount());
          });

          // 🚀 Handle Notification Redirection Logic
          const handleNotificationNavigation = (remoteMessage) => {
            if (!remoteMessage?.data) return;

            const { type, referenceId, chatId, interestId, senderId } = remoteMessage.data;
            const targetId = referenceId || chatId || interestId;

            console.log('🔔 Notification Clicked:', remoteMessage.data);

            if (type === 'message') {
              if (targetId) {
                navigate('MessageScreen', { chatId: targetId });
              } else {
                navigate('App', { screen: 'HomeTabs', params: { screen: 'Activity' } }); // Fallback
              }
            }
            else if (type === 'interest' || type === 'view') {
              // For interest/view, usually go to profile. 
              // If we have specific InterestDetail, we'd go there.
              // Currently matching ActivityScreen logic -> ProfileDetail
              const profileId = senderId;
              if (profileId) {
                navigate('ProfileDetailScreen', { profileId, item: { _id: profileId } }); // item added for safety
              } else {
                navigate('App', { screen: 'HomeTabs', params: { screen: 'Activity' } });
              }
            }
            else {
              navigate('App', { screen: 'HomeTabs', params: { screen: 'Activity' } });
            }
          };

          unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(remoteMessage => {
            handleNotificationNavigation(remoteMessage);
          });

          const initialNotification = await messaging().getInitialNotification();
          if (initialNotification) {
            handleNotificationNavigation(initialNotification);
          }

          setIsReady(true);
          return () => {
            if (unsubscribeForeground) unsubscribeForeground();
            if (unsubscribeNotificationOpened) unsubscribeNotificationOpened();
          };
        } else {
          setIsReady(true);
        }
      } catch (error) {
        console.error('Error initializing app:', error.message);
        setIsReady(true);
      }
    };

    const cleanupPromise = initializeApp();

    return () => {
      cleanupPromise?.then?.(cleanup => {
        if (typeof cleanup === 'function') cleanup();
      });
      unsubscribeNetInfo?.();
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (serverPollRef.current) {
        clearInterval(serverPollRef.current);
        serverPollRef.current = null;
      }
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
      cancelled = true;
    };
  }, [token, dispatch, user?._id]);

  if (isOffline) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: COLORS.white,
          padding: 24,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 380,
            backgroundColor: '#ffffff',
            borderRadius: 18,
            paddingVertical: 32,
            paddingHorizontal: 24,
            alignItems: 'center',
            borderWidth: 0,
            borderColor: '#ffffffff',
          }}
        >
          <View
            style={{
              width: 160,
              height: 120,
              marginBottom: 14,
              borderRadius: 12,
              backgroundColor: '#fbe5ea',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="wifi-off" size={72} color={COLORS.primary} />
          </View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#222222',
              textAlign: 'center',
            }}
          >
            No Internet Connection
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 13,
              color: '#4a5568',
              textAlign: 'center',
              lineHeight: 18,
            }}
          >
            We couldn't reach the internet. Please check your connection and try again.
          </Text>

          <TouchableOpacity
            onPress={() =>
              NetInfo.fetch().then(state =>
                setIsOffline(
                  state.isConnected === false || state.isInternetReachable === false,
                ),
              )
            }
            style={{
              marginTop: 18,
              paddingHorizontal: 18,
              paddingVertical: 12,
              backgroundColor: COLORS.primary,
              borderRadius: 12,
              width: '100%',
            }}
          >
            <Text
              style={{
                color: COLORS.white,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (serverDown) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: COLORS.white,
          padding: 24,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 380,
            backgroundColor: '#ffffff',
            borderRadius: 18,
            paddingVertical: 32,
            paddingHorizontal: 24,
            alignItems: 'center',
            elevation: 0,

          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: '#c73756',
              marginBottom: 10,
            }}
          >
            Oops!
          </Text>
          <View
            style={{
              width: 160,
              height: 120,
              marginBottom: 14,
              borderRadius: 12,
              backgroundColor: '#fbe5ea',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <MaterialCommunityIcons name="server-off" size={60} color="#c73756" />
          </View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#222222',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: '#4a5568',
              textAlign: 'center',
              lineHeight: 18,
              marginBottom: 4,
            }}
          >
            We encountered an error while trying to connect with our server.
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: '#4a5568ff',
              textAlign: 'center',
              lineHeight: 18,
              marginBottom: 18,
            }}
          >
            Please try again in a bit. 😇
          </Text>
          <TouchableOpacity
            disabled={serverChecking}
            onPress={async () => {
              setServerChecking(true);
              try {
                const res = await axios.get(`${API_BASE_URL}/api/health`, { timeout: 4000 });
                if (res?.status && res.status < 500) {
                  setServerDown(false);
                  setIsReady(true);
                } else {
                  setServerDown(true);
                }
              } catch (e) {
                const status = e?.response?.status;
                if (status && status < 500) {
                  setServerDown(false);
                  setIsReady(true);
                } else {
                  setServerDown(true);
                }
              } finally {
                setServerChecking(false);
              }
            }}
            style={{
              marginTop: 6,
              paddingHorizontal: 18,
              paddingVertical: 11,
              backgroundColor: serverChecking ? COLORS.primary : COLORS.primary,
              borderRadius: 10,
              width: '100%',
            }}
          >
            <Text
              style={{
                color: COLORS.white,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              {serverChecking ? 'Checking...' : 'Retry'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (token && !isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: COLORS.white,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary || '#ff6b00'} />
      </View>
    );
  }

  return (
    <SocketManager user={user}>
      <UpdateManager />
      <NoticeManager />
      <AppNavigator />
    </SocketManager>
  );
};

const App = () => (
  <Provider store={store}>
    <SafeAreaProvider>
      <LanguageProvider>
        <LikeProvider>
          <BlockProvider>
            <InterestProvider>
              <AppContent />
            </InterestProvider>
          </BlockProvider>
        </LikeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  </Provider>
);

export default App;
