import 'react-native-gesture-handler';
import 'react-native-reanimated';
import './src/env';
import { AppRegistry, PermissionsAndroid, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

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

    // 2️⃣ Notification Permission (Android 13+)
    if (Platform.OS === 'android' && Platform.Version >= 33) {
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

 const { title, body } = remoteMessage.notification || remoteMessage.data;
const notificationTitle = remoteMessage.notification?.title || remoteMessage.data?.title;
const notificationBody = remoteMessage.notification?.body || remoteMessage.data?.body;

if (notificationTitle || notificationBody) {
  await notifee.displayNotification({
    title: notificationTitle,
    body: notificationBody,
    android: { channelId: 'default' }
  });
}

});

AppRegistry.registerComponent(appName, () => App);
