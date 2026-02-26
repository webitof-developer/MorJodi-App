import React, { useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { COLORS } from '../constants/theme';
import i18n from '../localization/i18n';
import { LanguageContext } from '../contexts/LanguageContext';
import { useNavigation, DrawerActions } from '@react-navigation/native';

const CustomHeader = ({ title, navigation, titleKey }) => {
  const navigationProp = navigation || useNavigation();
  const { unreadCount } = useSelector(state => state.notifications);
  const { language } = useContext(LanguageContext);

  let displayTitle = title;
  if (titleKey) {
    displayTitle = i18n.t(titleKey, { lng: language });
  } else if (title === 'Home') {
    displayTitle = 'MorJodi';
  }

  const localizedHome = i18n.t('customeHeaders.home', { lng: language });
  const showLogo =
    titleKey === 'customeHeaders.home' ||
    displayTitle === 'Home' ||
    displayTitle === localizedHome ||
    displayTitle === 'MorJodi' ||
    displayTitle === 'Mor Jodi';

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          <TouchableOpacity onPress={() => navigationProp.dispatch(DrawerActions.openDrawer())}>
            <Icon name="menu-outline" size={26} color="#000000ff" />
          </TouchableOpacity>
        </View>

        <View style={styles.middleContainer}>
          {showLogo ? (
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

        <View style={styles.rightContainer}>
          <TouchableOpacity onPress={() => navigationProp.navigate('Activity')}>
            <View>
              <Icon name="notifications-outline" size={24} color="#6b7280" />
              {unreadCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigationProp.navigate('IdWiseSearch')}>
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
    borderBottomColor: '#f3f4f6',
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
    color: '#5e3a45',
    fontFamily: undefined,
  },
  headerLogo: {
    height: 45,
    width: 150,
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
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
    paddingHorizontal: 3,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default CustomHeader;
