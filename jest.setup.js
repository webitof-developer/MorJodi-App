// Mock AsyncStorage for Jest
import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Minimal env to avoid config warnings during tests
process.env.API_BASE_URL = process.env.API_BASE_URL || 'http://localhost';
process.env.WEB_CLIENT_ID = process.env.WEB_CLIENT_ID || 'test-web-client-id';
process.env.AGORA_APP_ID = process.env.AGORA_APP_ID || 'test-agora-id';

// Mock Firebase native modules used in messaging
jest.mock('@react-native-firebase/app', () => ({
  ReactNativeFirebase: { NativeModules: {} },
  initializeApp: jest.fn(),
  app: jest.fn(),
  default: {
    initializeApp: jest.fn(),
    app: jest.fn(),
  },
}));

jest.mock('@react-native-firebase/messaging', () => {
  const mockMessaging = () => ({
    onMessage: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    getInitialNotification: jest.fn(),
    getToken: jest.fn().mockResolvedValue('mock-token'),
    registerDeviceForRemoteMessages: jest.fn(),
    setBackgroundMessageHandler: jest.fn(),
    requestPermission: jest.fn().mockResolvedValue(true),
  });
  mockMessaging.AuthorizationStatus = { AUTHORIZED: 1, PROVISIONAL: 2 };
  return mockMessaging;
});

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
jest.mock('@react-native-community/slider', () => 'Slider');
jest.mock('@react-native-picker/picker', () => {
  const Picker = ({ children }) => children;
  Picker.Item = () => null;
  return { Picker };
});
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));
jest.mock('react-native-element-dropdown', () => {
  const MockComponent = ({ children }) => children;
  return { MultiSelect: MockComponent, Dropdown: MockComponent };
});
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({}),
    signOut: jest.fn(),
    revokeAccess: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
  },
}));
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/AntDesign', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Entypo', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome6', () => 'Icon');
jest.mock('react-native-vector-icons/Octicons', () => 'Icon');
jest.mock('react-native-vector-icons/Feather', () => 'Icon');
jest.mock('react-native-razorpay', () => ({ open: jest.fn() }));
jest.mock('@notifee/react-native', () => ({
  onForegroundEvent: jest.fn(),
  onBackgroundEvent: jest.fn(),
  displayNotification: jest.fn(),
  requestPermission: jest.fn(),
  setNotificationCategories: jest.fn(),
  setBadgeCount: jest.fn(),
  cancelAllNotifications: jest.fn(),
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
}));
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(),
}));
jest.mock('@react-navigation/drawer', () => {
  const Navigator = ({ children }) => children;
  const Screen = ({ children }) => children;
  return {
    createDrawerNavigator: jest.fn(() => ({ Navigator, Screen })),
    DrawerContentScrollView: ({ children }) => children,
    DrawerItemList: ({ children }) => children,
    DrawerItem: () => null,
  };
});
jest.mock('@react-navigation/material-top-tabs', () => {
  const Navigator = ({ children }) => children;
  const Screen = ({ children }) => children;
  return {
    createMaterialTopTabNavigator: jest.fn(() => ({ Navigator, Screen })),
  };
});
