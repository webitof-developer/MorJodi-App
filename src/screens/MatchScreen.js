import React, { useContext } from 'react';
import { RefreshProvider } from '../contexts/RefreshContext';
import { View, Text, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomHeader from '../components/CustomHeader';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import i18n from '../localization/i18n';

const Tab = createMaterialTopTabNavigator();

// --- Tab Screens ---
import AllProfiles from './AllProfiles';

import YourMatches from './YourMatches';

import Nearby from './Nearby';

import JustJoined from './JustJoined';

import Search from './Search';
import VerifiedProfiles from './VerifiedProfiles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguageContext } from '../contexts/LanguageContext';


const TAB_LABEL_KEYS = {
  All: 'matchTabs.all',
  Verified: 'matchTabs.verified',
  'Your Matches': 'matchTabs.yourmatches',
  Nearby: 'matchTabs.nearby',
  'Just Joined': 'matchTabs.justjoined',
  Search: 'matchTabs.search',
};

// --- Top Tab Navigator ---
const MatchTabNavigator = () => {
  const { language } = useContext(LanguageContext);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        lazy: true,
        tabBarScrollEnabled: true,
        tabBarStyle: { backgroundColor: COLORS.white },
        tabBarIndicatorStyle: { backgroundColor: 'transparent' },
        tabBarItemStyle: {
          width: 'auto',
        },
        tabBarContentContainerStyle: {},
        tabBarShowIcon: true,
        tabBarLabel: ({ focused }) => {
          const isSearch = route.name === 'Search';
          if (isSearch) return null; // for icon-only tab

          return (
            <Text
              style={{
                ...FONTS.h4,
                color: focused ? COLORS.white : COLORS.iconColor,
                backgroundColor: focused ? COLORS.primary : COLORS.white,
                borderColor: focused ? COLORS.primary : COLORS.lightGray,
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: SIZES.base * 2.5,
                paddingVertical: 5,
                marginHorizontal: 0,
                overflow: 'hidden',
              }}
            >
              {i18n.t(TAB_LABEL_KEYS[route.name], { lng: language })}
            </Text>
          );
        },

        tabBarIcon: ({ color, focused }) => {
          if (route.name === 'Search') {
            return (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: focused ? COLORS.primary : COLORS.lightGray,
                  backgroundColor: focused ? COLORS.primary : COLORS.white,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="filter-sharp"
                  size={18}
                  color={focused ? COLORS.white : COLORS.black}
                />
              </View>
            );
          }
          return null;
        },
      })}
    >
      <Tab.Screen name="All" component={AllProfiles} />
      <Tab.Screen name="Verified" component={VerifiedProfiles} />
      <Tab.Screen name="Your Matches" component={YourMatches} />
      <Tab.Screen name="Nearby" component={Nearby} />
      <Tab.Screen name="Just Joined" component={JustJoined} />
      <Tab.Screen name="Search" component={Search} />
    </Tab.Navigator>
  );
};

// --- Main Screen ---
const MatchScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <CustomHeader titleKey="customeHeaders.matches" navigation={navigation} />

      <RefreshProvider>
        <MatchTabNavigator />
      </RefreshProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MatchScreen;
