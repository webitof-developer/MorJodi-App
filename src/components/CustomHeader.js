import React, { useEffect, useRef, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import { useSelector, useDispatch } from 'react-redux';
import io from 'socket.io-client';
import { API_BASE_URL } from '../constants/config';
import { fetchUnreadNotificationCount } from '../redux/slices/notificationSlice';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import i18n from '../localization/i18n';
import { LanguageContext } from '../contexts/LanguageContext';

import { useNavigation, DrawerActions } from '@react-navigation/native';

const CustomHeader = ({ title, navigation, titleKey }) => {
  const navigationProp = navigation || useNavigation();
  const { user } = useSelector(state => state.auth);
  const { unreadCount } = useSelector(state => state.notifications);
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const { language } = useContext(LanguageContext);

  // ✅ Socket connection for real-time unread count updates
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(API_BASE_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('registerUser', user._id);
    });

    socket.on('unreadNotificationCount', () => {
      dispatch(fetchUnreadNotificationCount());
    });

    return () => socket.disconnect();
  }, [user?._id, dispatch]);

  // Determine the title to display
  let displayTitle = title;
  if (titleKey) {
    displayTitle = i18n.t(titleKey);
  } else if (title === 'Home') {
    displayTitle = 'MorJodi';
  }

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        {/* Left: Menu Icon */}
        <View style={styles.leftContainer}>
          <TouchableOpacity onPress={() => navigationProp.dispatch(DrawerActions.openDrawer())}>
            <Icon name="menu-outline" size={26} color="#000000ff" />
          </TouchableOpacity>
        </View>

        {/* Center: Title + Heart */}
        <View style={styles.middleContainer}>
          {displayTitle === 'Home' || displayTitle === 'MorJodi' || displayTitle === 'Mor Jodi' ? (
            <Image
              source={require('../assets/main-logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          ) : (
            <Text
              style={[
                styles.title,
                language === 'hi' ? { fontFamily: undefined } : null,
              ]}
              numberOfLines={1}
            >
              {displayTitle}
            </Text>
          )}
        </View>

        {/* Right: Notification + Search */}
        <View style={styles.rightContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Activity')}>
            <View>
              <Icon name="notifications-outline" size={24} color="#6b7280" />
              {unreadCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('IdWiseSearch')}>
            <Icon name="search-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6', // Subtle separator
  },
  container: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start',
    zIndex: 10,
  },
  middleContainer: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'normal',
    color: '#5e3a45', // Dark brownish/red color from screenshot
    fontFamily: undefined,
  },
  headerLogo: {
    height: 45,
    width: 150, // Prevent it from overlapping side buttons
  },
  rightContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  badgeContainer: {
    position: 'absolute',
    right: -2,
    top: -2,
    backgroundColor: COLORS.primary,
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default CustomHeader;
