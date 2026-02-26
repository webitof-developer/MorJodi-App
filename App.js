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
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { generateNewFcmToken, registerTokenRefresh } from './src/utils/notificationHelper';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  fetchUnreadUserNotificationCount,
} from './src/redux/slices/notificationSlice';
import { fetchUnreadMessageCount } from './src/redux/slices/messageSlice';
import { navigate, navigationRef } from './src/navigation/navigationRef';
import { COLORS } from './src/constants/theme';
import { API_BASE_URL } from './src/constants/config';
import { InterestProvider } from './src/contexts/InterestContext';
import Icon from 'react-native-vector-icons/Ionicons';
import UpdateManager from './src/components/UpdateManager';
import NoticeManager from './src/components/NoticeManager';
import { logout } from './src/redux/actions/authActions';
import { isTokenExpired } from './src/utils/authSession';

const PENDING_NOTIFICATION_NAVIGATION_KEY = 'pending_notification_navigation';
const GLOBAL_ERROR_SCREEN_EXEMPT_ROUTES = new Set(['Register', 'EditProfile']);

const AppContent = () => {
  const { user, token, isAuthenticated } = useSelector(state => state.auth);
  const [isReady, setIsReady] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [serverDown, setServerDown] = useState(false);
  const [serverChecking, setServerChecking] = useState(false);
  const dispatch = useDispatch();
  const pollRef = React.useRef(null);
  const serverPollRef = React.useRef(null);
  const forceLogoutInProgress = React.useRef(false);
  const pendingNotifDrained = React.useRef(false);

  const setOfflineFromState = state => {
    const offline =
      state?.type === 'none' ||
      state?.type === 'unknown' ||
      state?.isConnected === false ||
      state?.isInternetReachable === false;
    setIsOffline(offline);
  };

  const isGlobalErrorScreenExemptRoute = () => {
    if (!navigationRef.isReady()) return false;
    const routeName = navigationRef.getCurrentRoute()?.name;
    return GLOBAL_ERROR_SCREEN_EXEMPT_ROUTES.has(routeName);
  };

  const persistPendingNotificationNavigation = async (data = {}) => {
    try {
      if (!data || Object.keys(data).length === 0) return;
      await AsyncStorage.setItem(PENDING_NOTIFICATION_NAVIGATION_KEY, JSON.stringify(data));
    } catch (e) {
      // non-blocking
    }
  };

  const normalizeId = value => {
    if (value && typeof value === 'object') {
      const maybeId = value._id || value.id;
      return maybeId ? String(maybeId) : null;
    }

    if (value === undefined || value === null) return null;
    const raw = String(value).trim();
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    return raw;
  };

  const goToBottomTab = (tabName, nestedParams) => {
    navigate('App', {
      screen: 'HomeTabs',
      params: {
        screen: tabName,
        ...(nestedParams ? { params: nestedParams } : {}),
      },
    });
  };

  const handleNotificationNavigation = async (data = {}) => {
    if (!data || Object.keys(data).length === 0) return;

    if (!isAuthenticated) {
      await persistPendingNotificationNavigation(data);
      return;
    }

    const notificationType = String(data.type || data.event || '').toLowerCase();
    const notificationId = normalizeId(data.notificationId);
    const targetChatId = normalizeId(data.chatId || data.chat || data.referenceId);
    const targetProfileId = normalizeId(
      data.senderId || data.viewerId || data.userId || data.referenceId || data.interestId,
    );

    const resolveMessageChatId = async () => {
      const senderId = normalizeId(data.senderId || data.userId);

      // Prefer explicit chat id, but validate it before navigating.
      if (targetChatId && token) {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/chat/${targetChatId}`, {
            headers: { Authorization: `Bearer ${token}` },
            suppressGlobalError: true,
          });
          if (res?.data?.success && res?.data?.chat?._id) {
            return normalizeId(res.data.chat._id);
          }
        } catch (e) {
          // fall back to sender-based lookup below
        }
      }

      if (!senderId || !token) return null;

      // Fallback: create/get chat by sender so message tap always opens a valid thread.
      try {
        const res = await axios.post(
          `${API_BASE_URL}/api/chat/create`,
          { recipientId: senderId },
          {
            headers: { Authorization: `Bearer ${token}` },
            suppressGlobalError: true,
          },
        );

        const createdChatId = normalizeId(res?.data?.chat?._id || res?.data?.chatId);
        return createdChatId || null;
      } catch (e) {
        return null;
      }
    };

    if (notificationType === 'message') {
      const resolvedChatId = await resolveMessageChatId();
      if (resolvedChatId) {
        navigate('MessageScreen', { chatId: resolvedChatId, notificationId });
      } else {
        goToBottomTab('Messenger');
      }
      return;
    }

    if (notificationType === 'interest' || notificationType === 'view') {
      if (targetProfileId) {
        navigate('ProfileDetailScreen', {
          profileId: targetProfileId,
          item: { _id: targetProfileId },
        });
      } else {
        goToBottomTab('Activity');
      }
      return;
    }

    if (
      notificationType === 'interest_accepted' ||
      notificationType === 'interest_declined'
    ) {
      goToBottomTab('Activity');
      return;
    }

    if (notificationType === 'subscription') {
      goToBottomTab('Upgrade');
      return;
    }

    if (notificationType === 'nearby_profiles') {
      goToBottomTab('Matches', { screen: 'Nearby' });
      return;
    }

    if (notificationType === 'today_matches') {
      goToBottomTab('Matches', { screen: 'Just Joined' });
      return;
    }

    if (notificationType === 'new_match') {
      goToBottomTab('Matches', { screen: 'Your Matches' });
      return;
    }

    if (notificationType === 'profile_approved' || notificationType === 'approval') {
      goToBottomTab('Home');
      return;
    }

    goToBottomTab('Activity');
  };

  useEffect(() => {
    if (!token) return;

    if (isTokenExpired(token) && !forceLogoutInProgress.current) {
      forceLogoutInProgress.current = true;
      dispatch(logout()).finally(() => {
        forceLogoutInProgress.current = false;
      });
      return;
    }

    const intervalId = setInterval(() => {
      if (isTokenExpired(token) && !forceLogoutInProgress.current) {
        forceLogoutInProgress.current = true;
        dispatch(logout()).finally(() => {
          forceLogoutInProgress.current = false;
        });
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, [dispatch, token]);

  // Reset the drain flag on logout so the next login triggers a fresh check.
  useEffect(() => {
    if (!isAuthenticated) {
      pendingNotifDrained.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const checkServer = async () => {
      if (isGlobalErrorScreenExemptRoute()) {
        setServerDown(false);
        return;
      }
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
        if (error?.config?.suppressGlobalError) {
          return Promise.reject(error);
        }
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
        if (error?.config?.suppressGlobalError) {
          return Promise.reject(error);
        }
        const status = error?.response?.status;
        if (status === 401 && token && !forceLogoutInProgress.current) {
          forceLogoutInProgress.current = true;
          dispatch(logout()).finally(() => {
            forceLogoutInProgress.current = false;
          });
        }

        if ((!error.response || status >= 500) && !isGlobalErrorScreenExemptRoute()) {
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
      let unsubscribeNotifeeForeground;

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

            if (remoteMessage?.data?.senderId === user?._id) return;
            const data = remoteMessage?.data || {};
            const messageType = data?.type;

            dispatch(fetchNotifications());
            dispatch(fetchUnreadNotificationCount());
            dispatch(fetchUnreadUserNotificationCount());
            dispatch(fetchUnreadMessageCount());

            // Foreground rule: only show push popup for chat messages.
            if (messageType !== 'message') return;

            const currentRoute = navigationRef.isReady()
              ? navigationRef.getCurrentRoute()
              : null;
            const isInsideMessageScreen = currentRoute?.name === 'MessageScreen';
            const openedChatId = currentRoute?.params?.chatId;
            const incomingChatId = data?.referenceId || data?.chatId;

            // Suppress notification if user is already inside same chat.
            if (
              isInsideMessageScreen &&
              openedChatId &&
              incomingChatId &&
              String(openedChatId) === String(incomingChatId)
            ) {
              return;
            }

            const notificationTitle =
              remoteMessage?.notification?.title ||
              data?.title ||
              data?.notificationTitle ||
              'New Message';
            const notificationBody =
              remoteMessage?.notification?.body ||
              data?.body ||
              data?.message ||
              data?.notificationBody ||
              '';

            if (!notificationTitle && !notificationBody) return;

            await notifee.displayNotification({
              title: notificationTitle,
              body: notificationBody,
              data,
              android: {
                channelId: 'default',
                pressAction: { id: 'default' },
              },
            });
          });

          unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(async remoteMessage => {
            await handleNotificationNavigation(remoteMessage?.data || {});
          });

          unsubscribeNotifeeForeground = notifee.onForegroundEvent(async ({ type, detail }) => {
            if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
              await handleNotificationNavigation(detail?.notification?.data || {});
            }
          });

          // NOTE: Initial notification handling (killed-app launch) is done in the
          // dedicated `pendingNotifDrained` useEffect below, which waits for both
          // authentication and navigation readiness before navigating.
          // Seed any un-persisted initial notifications into AsyncStorage so the
          // effect picks them up reliably.
          const initialNotification = await messaging().getInitialNotification();
          if (initialNotification?.data && Object.keys(initialNotification.data).length > 0) {
            const existing = await AsyncStorage.getItem(PENDING_NOTIFICATION_NAVIGATION_KEY);
            if (!existing) {
              await AsyncStorage.setItem(
                PENDING_NOTIFICATION_NAVIGATION_KEY,
                JSON.stringify(initialNotification.data),
              );
            }
          }

          const initialNotifeeNotification = await notifee.getInitialNotification();
          if (initialNotifeeNotification?.notification?.data &&
            Object.keys(initialNotifeeNotification.notification.data).length > 0) {
            const existing = await AsyncStorage.getItem(PENDING_NOTIFICATION_NAVIGATION_KEY);
            if (!existing) {
              await AsyncStorage.setItem(
                PENDING_NOTIFICATION_NAVIGATION_KEY,
                JSON.stringify(initialNotifeeNotification.notification.data),
              );
            }
          }

          setIsReady(true);
          return () => {
            if (unsubscribeForeground) unsubscribeForeground();
            if (unsubscribeNotificationOpened) unsubscribeNotificationOpened();
            if (unsubscribeNotifeeForeground) unsubscribeNotifeeForeground();
          };
        } else {
          unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(async remoteMessage => {
            await persistPendingNotificationNavigation(remoteMessage?.data || {});
          });

          unsubscribeNotifeeForeground = notifee.onForegroundEvent(async ({ type, detail }) => {
            if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
              await persistPendingNotificationNavigation(detail?.notification?.data || {});
            }
          });

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
  }, [token, isAuthenticated, dispatch, user?._id]);

  // ─── Drain Pending Notification Navigation ──────────────────────────────────
  // Fires once when the user becomes authenticated. It waits for the
  // NavigationContainer to finish mounting before navigating, which is the
  // critical missing piece for the killed-app / quit-state notification tap.
  useEffect(() => {
    if (!isAuthenticated || pendingNotifDrained.current) return;

    const drainPending = async () => {
      // Poll until the NavigationContainer is ready (max ~3 s).
      const waitForNav = () =>
        new Promise(resolve => {
          if (navigationRef.isReady()) { resolve(); return; }
          let attempts = 0;
          const interval = setInterval(() => {
            attempts++;
            if (navigationRef.isReady() || attempts > 30) {
              clearInterval(interval);
              resolve();
            }
          }, 100);
        });

      await waitForNav();

      const raw = await AsyncStorage.getItem(PENDING_NOTIFICATION_NAVIGATION_KEY);
      if (!raw) return;

      pendingNotifDrained.current = true;
      await AsyncStorage.removeItem(PENDING_NOTIFICATION_NAVIGATION_KEY);

      try {
        const data = JSON.parse(raw);
        await handleNotificationNavigation(data);
      } catch (e) {
        // ignore malformed payload
      }
    };

    drainPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const hideGlobalErrorScreens = isGlobalErrorScreenExemptRoute();

  if (isOffline && !hideGlobalErrorScreens) {
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

  if (serverDown && !hideGlobalErrorScreens) {
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
