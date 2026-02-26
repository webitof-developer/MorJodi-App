import React, { useState, useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { checkToken } from '../redux/actions/authActions';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import OtpVerifyScreen from '../screens/OtpVerifyScreen';
import DrawerNavigator from './DrawerNavigator';
import LoadingScreen from '../screens/LoadingScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AccountSettingsScreen from '../screens/AccountSettingsScreen';
import PrivacySettingsScreen from '../screens/PrivacySettingsScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import PhotoPreviewScreen from '../screens/PhotoPreviewScreen';
import LikedProfilesScreen from '../screens/LikedProfilesScreen';
import BlockedProfilesScreen from '../screens/BlockedProfilesScreen';
import IdWiseSearch from '../screens/IdWiseSearch';
import InterestedUsersScreen from '../screens/InterestedUsersScreen';
import ProfileVisitorsScreen from '../screens/ProfileVisitorsScreen';
import ComplaintScreen from '../screens/ComplaintScreen';
import ProfileDetailScreen from '../screens/ProfileDetailScreen';
import { LanguageContext } from '../contexts/LanguageContext';
import MessageScreen from '../screens/MessageScreen';
import WalletScreen from '../screens/WalletScreen';
import ReferralScreen from '../screens/ReferralScreen';
import AboutScreen from '../screens/AboutScreen';
import ContactScreen from '../screens/ContactScreen';
import TermPrivacyScreen from '../screens/TermPrivacyScreen';
import LanguageSettingScreen from '../screens/LanguageSettingScreen';
import LanguageSelectScreen from '../screens/LanguageSelectScreen';
import PartnerPreferenceScreen from '../screens/PartnerPreferenceScreen';
import { fetchUnreadUserNotificationCount, fetchUnreadNotificationCount, } from '../redux/slices/notificationSlice';
import i18n from '../localization/i18n';
import { navigationRef, flushPendingNavigation } from './navigationRef';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const { loading: languageLoading, isLanguageSelected } =
    useContext(LanguageContext);
  const [showSplash, setShowSplash] = useState(true);


  /* Analytics Tracking Helper */
  const routeNameRef = React.useRef();




  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      dispatch(checkToken());
    }, 2000);
    return () => clearTimeout(timer);
  }, [dispatch]);




  useEffect(() => {
    if (!isAuthenticated) return;

    // First hit
    dispatch(fetchUnreadNotificationCount());
    dispatch(fetchUnreadUserNotificationCount());

    // Continuous polling (throttled to 30s; foreground FCM also updates counts)
    const interval = setInterval(() => {
      dispatch(fetchUnreadNotificationCount());
      dispatch(fetchUnreadUserNotificationCount());
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, dispatch]);

  if (languageLoading) {
    return <SplashScreen />;
  }


  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.getCurrentRoute().name;
        flushPendingNavigation();
      }}
      onStateChange={async () => {
        const previousRouteName = routeNameRef.current;
        const currentRoute = navigationRef.getCurrentRoute();
        const currentRouteName = currentRoute?.name;

        if (previousRouteName !== currentRouteName) {
          // Import implicitly to avoid top-level require cycles if any, though import is fine too
          // using the imported analyticsService from file
          // We need to import it at top level or require here. 
          // Let's rely on the import I will add at the top.
          try {
            const analyticsService = require('../services/analyticsService').default;
            await analyticsService.trackScreenView(currentRouteName);
          } catch (err) {
            console.log("Analytics error:", err);
          }
        }
        routeNameRef.current = currentRouteName;
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showSplash ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : !isLanguageSelected ? (

          <Stack.Screen
            name="LanguageSelect"
            component={LanguageSelectScreen}
          />
        ) : isLoading ? (
          <Stack.Screen name="Loading" component={LoadingScreen} />
        ) : isAuthenticated ? (

          <>
            <Stack.Screen name="App" component={DrawerNavigator} />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{
                headerShown: true,
                headerTitle: i18n.t('headers.editProfile'),
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="AccountSettings"
              component={AccountSettingsScreen}
              options={{
                headerShown: true,
                headerTitle: i18n.t('headers.accountSettings'),
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="PartnerPreferenceSettings"
              component={PartnerPreferenceScreen}
              options={{
                headerShown: true,
                headerTitle: i18n.t('drawer.menu.partnerPreferences'),
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="LanguageSettings"
              component={LanguageSettingScreen}
              options={{
                headerShown: true,
                headerTitle: i18n.t('headers.languageSettings'),
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="PrivacySettings"
              component={PrivacySettingsScreen}
              options={{
                headerShown: true,
                headerTitle: i18n.t('headers.privacySettings'),
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="NotificationSettings"
              component={NotificationSettingsScreen}
              options={{
                headerShown: true,
                headerTitle: i18n.t('headers.notificationSettings'),
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="IdWiseSearch"
              component={IdWiseSearch}
              options={{
                headerShown: true,
                headerTitle: i18n.t('headers.idWiseSearch'),
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="ProfileDetailScreen"
              component={ProfileDetailScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="MessageScreen"
              component={MessageScreen}
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="PhotoPreview"
              component={PhotoPreviewScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="LikedProfiles"
              component={LikedProfilesScreen}
              options={{
                headerShown: true,
                headerTitle: i18n.t('headers.likedProfiles'),
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="BlockedProfiles"
              component={BlockedProfilesScreen}
              options={{ headerShown: true, title: i18n.t('headers.blockedProfiles') }}
            />

            <Stack.Screen
              name="ProfileVisitorsScreen"
              component={ProfileVisitorsScreen}
              options={{ headerShown: true, title: i18n.t('headers.profileVisitors') }}
            />
            <Stack.Screen
              name="InterestedUsersScreen"
              component={InterestedUsersScreen}
              options={{ headerShown: true, title: i18n.t('headers.interestRequests') }}
            />
            <Stack.Screen
              name="Complaint"
              component={ComplaintScreen}
              options={{ headerShown: true, title: i18n.t('headers.complaint') }}
            />
            <Stack.Screen
              name="WalletScreen"
              component={WalletScreen}
              options={{ headerShown: true, title: i18n.t('headers.wallet') }}
            />
            <Stack.Screen
              name="ReferralScreen"
              component={ReferralScreen}
              options={{ headerShown: true, title: i18n.t('headers.referral') }}
            />
            <Stack.Screen
              name="TermPrivacy"
              component={TermPrivacyScreen}
              options={{ headerShown: true, title: i18n.t('headers.termsPrivacy') }}
            />
            <Stack.Screen
              name="About"
              component={AboutScreen}
              options={{ headerShown: true, title: i18n.t('headers.about') }}
            />
            <Stack.Screen
              name="Contact"
              component={ContactScreen}
              options={{ headerShown: true, title: i18n.t('headers.contact') }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: true, headerTitle: i18n.t('headers.login') }}
            />
            <Stack.Screen
              name="OtpVerify"
              component={OtpVerifyScreen}
              options={{ headerShown: true, headerTitle: i18n.t('headers.otpVerify') }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

