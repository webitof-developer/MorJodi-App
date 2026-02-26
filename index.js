import 'react-native-gesture-handler';
import 'react-native-reanimated';
import './src/env';
import { AppRegistry, PermissionsAndroid, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from './App';
import { name as appName } from './app.json';

const PENDING_NOTIFICATION_NAVIGATION_KEY = 'pending_notification_navigation';

const persistPendingNavigationData = async (data) => {
  try {
    if (!data || Object.keys(data).length === 0) return;
    await AsyncStorage.setItem(
      PENDING_NOTIFICATION_NAVIGATION_KEY,
      JSON.stringify(data),
    );
  } catch (e) {
    // non-blocking
  }
};

// 🔥 Request all app permissions
async function requestAppPermissions() {
  try {
    // 1️⃣ CAMERA, STORAGE, AUDIO (your style)
    const basePermissions = [
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ];

    await PermissionsAndroid.requestMultiple(basePermissions);

    // 2️⃣ Notification Permission (Android 13+ / iOS)
    if ((Platform.OS === 'android' && Platform.Version >= 33) || Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission(); // REAL POPUP

      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      console.log("🔔 Notification Permission:", enabled);

      if (!enabled) {
        console.log("❌ User denied notification permission");
      }
    }

    // 3️⃣ Register device & get FCM token ALWAYS after permission
    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();
    console.log("🔥 FCM TOKEN:", token);

  } catch (error) {
    console.warn("Permission Request Error:", error);
  }
}

// Call it on startup
requestAppPermissions();

// Background handler
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("📩 Background message:", remoteMessage);

  await notifee.createChannel({
    id: "default",
    name: "Default Channel",
    importance: AndroidImportance.HIGH,
  });

  // Avoid duplicate background notifications when payload already has `notification`.
  // OS will show those automatically in background/quit.
  if (!remoteMessage?.notification) {
    const notificationTitle =
      remoteMessage?.data?.title ||
      remoteMessage?.data?.notificationTitle ||
      (remoteMessage?.data?.type === 'message' ? 'New Message' : 'New Notification');
    const notificationBody =
      remoteMessage?.data?.body ||
      remoteMessage?.data?.message ||
      remoteMessage?.data?.notificationBody ||
      '';

    if (notificationTitle || notificationBody) {
      await notifee.displayNotification({
        title: notificationTitle,
        body: notificationBody,
        data: remoteMessage?.data || {},
        android: {
          channelId: 'default',
          pressAction: { id: 'default' },
        },
      });
    }
  }

});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
    const data = detail?.notification?.data || {};
    await persistPendingNavigationData(data);
  }
});

messaging().onNotificationOpenedApp(async (remoteMessage) => {
  await persistPendingNavigationData(remoteMessage?.data || {});
});

messaging()
  .getInitialNotification()
  .then(async (remoteMessage) => {
    await persistPendingNavigationData(remoteMessage?.data || {});
  })
  .catch(() => { });

notifee
  .getInitialNotification()
  .then(async (initialNotification) => {
    await persistPendingNavigationData(initialNotification?.notification?.data || {});
  })
  .catch(() => { });

AppRegistry.registerComponent(appName, () => App);
