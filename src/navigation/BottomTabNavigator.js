import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeScreen from '../screens/HomeScreen';
import MatchScreen from '../screens/MatchScreen';
import ActivityScreen from '../screens/ActivityScreen';
import MessengerScreen from '../screens/MessengerScreen';
import UpgradeScreen from '../screens/UpgradeScreen';
import { COLORS } from '../constants/theme';
import i18n from '../localization/i18n';
import { LanguageContext } from '../contexts/LanguageContext';

const Tab = createBottomTabNavigator();

import ActionGuard from '../components/ActionGuard';

const BottomTabNavigator = () => {
  const { language } = useContext(LanguageContext);
  const totalUsersWithMessages = useSelector(
    state => state.notifications.totalUsersWithMessages
  );

  // Helper to hex to rgba
  const hexToRgba = (hex, opacity) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    return `rgba(${r},${g},${b},${opacity})`;
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 80,
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          elevation: 10, // Subtle shadow for professional feel
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -4 },
          paddingTop: 15, // Increased top padding
        },
        tabBarIcon: ({ focused }) => {
          let iconName;
          let iconSize = 24;
          let IconComponent = Icon; // Default to Ionicons

          switch (route.name) {
            case 'Home':
              iconName = 'home-outline';
              break;
            case 'Matches':
              iconName = 'heart-outline';
              break;
            case 'Activity':
              iconName = 'flash-outline';
              break;
            case 'Messenger':
              iconName = 'chatbubble-outline';
              break;
            case 'Upgrade':
              IconComponent = MIcon; // Use MaterialCommunityIcons for Crown
              iconName = 'crown-outline';
              iconSize = 26; // Slightly larger for the crown
              break;
            default:
              iconName = 'ellipse-outline';
          }

          return (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: hexToRgba(COLORS.primary, 0.1) },
              ]}
            >
              <View>
                <IconComponent
                  name={iconName}
                  size={iconSize}
                  color={focused ? COLORS.primary : COLORS.iconColor} // Clean gray for inactive
                />
                {route.name === 'Messenger' && totalUsersWithMessages > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {totalUsersWithMessages > 99 ? '99+' : totalUsersWithMessages}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Matches">
        {(props) => (
          <ActionGuard restrict="approval">
            <MatchScreen {...props} />
          </ActionGuard>
        )}
      </Tab.Screen>
      <Tab.Screen name="Messenger">
        {(props) => (
          <ActionGuard restrict="approval">
            <MessengerScreen {...props} />
          </ActionGuard>
        )}
      </Tab.Screen>
      <Tab.Screen name="Activity">
        {(props) => (
          <ActionGuard restrict="approval">
            <ActivityScreen {...props} />
          </ActionGuard>
        )}
      </Tab.Screen>
      <Tab.Screen name="Upgrade" component={UpgradeScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;

const styles = StyleSheet.create({
  iconContainer: {
    width: 48, // Slightly larger touch target
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -4,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: 'bold',
  },
});
