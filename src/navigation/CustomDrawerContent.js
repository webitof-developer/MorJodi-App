import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/Feather';
import DeviceInfo from 'react-native-device-info';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/actions/authActions';
import { fetchUnreadNotificationCount, fetchUnreadUserNotificationCount } from '../redux/slices/notificationSlice';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { API_BASE_URL } from '../constants/config';
import i18n from '../localization/i18n';
import { LanguageContext } from '../contexts/LanguageContext';
import { getImageUrl } from '../utils/imageUtils';

const CustomDrawerContent = props => {
  const { user, token } = useSelector(state => state.auth);
  const { subscription } = useSelector(state => state.subscription);
  const { unreadCount } = useSelector(state => state.notifications);
  const [referralCode, setReferralCode] = useState('');
  const [profilePrefix, setProfilePrefix] = useState('MJ');
  const dispatch = useDispatch();
  const { language } = useContext(LanguageContext);

  // --- Helper Logic ---
  const formatProfileId = u => {
    if (!u) return '';
    const prefix = profilePrefix || 'MJ';
    const nameParts = (u.fullName || '').trim().split(/\s+/).filter(Boolean);
    const firstInitial = nameParts[0]?.[0]?.toUpperCase?.() || '';
    const lastInitial =
      nameParts.length > 1
        ? nameParts[nameParts.length - 1][0].toUpperCase?.() || ''
        : nameParts[0]?.slice(1, 2)?.toUpperCase?.() || '';
    const initials = `${firstInitial}${lastInitial}`;
    const dobDay = u.dateOfBirth
      ? String(new Date(u.dateOfBirth).getDate()).padStart(2, '0')
      : '00';
    const seqSource =
      u.profileNumber ??
      u.sequenceNumber ??
      u.serialNumber ??
      u.profileCode ??
      u._id;
    const seq =
      typeof seqSource === 'number'
        ? seqSource
        : parseInt(String(seqSource).slice(-3), 16) % 1000;
    const seqPadded = String(seq || 0).padStart(3, '0');
    return `${prefix}${initials}${seqPadded}${dobDay}`;
  };

  const formattedProfileId = formatProfileId(user);

  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/user/referral-data`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setReferralCode(data.referralCode || '');
        }
      } catch (err) {
        // silent error
      }
    };
    if (token) fetchReferralData();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    dispatch(fetchUnreadNotificationCount());
    dispatch(fetchUnreadUserNotificationCount());
  }, [token, dispatch]);

  useEffect(() => {
    const fetchPrefix = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/settings`);
        const data = await response.json();
        if (Array.isArray(data)) {
          const keyMatch =
            data.find(s => s.key === 'profile_id_prefix') ||
            data.find(s => s.key === 'profile_prefix');
          if (keyMatch?.value) {
            setProfilePrefix(String(keyMatch.value).toUpperCase());
          }
        }
      } catch (err) {
        // silent error
      }
    };
    fetchPrefix();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleShare = async () => {
    if (!user?._id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/app-share-link`);
      const data = await response.json();
      const playStoreURL = data?.link || "https://play.google.com/store/apps/details?id=com.morjodi.app";
      const profileCode = formattedProfileId || referralCode || user._id;
      const referralLink = `${playStoreURL}${playStoreURL.includes('?') ? '&' : '?'}ref=${encodeURIComponent(profileCode)}`;
      const messageText = `Install Mor Jodi App from Play Store 👇
${playStoreURL}

My Profile ID (use while signup):
${profileCode}

Referral Link:
${referralLink}

Note: Tap the referral link to install and your referral code fills automatically.`;
      await Share.share({ message: messageText });
    } catch (error) {
      // fallback handled by not sharing
    }
  };

  const isPremium = user?.isPremium || subscription?.status === 'active';

  // --- UI Components ---

  const MenuItem = ({ label, icon, onPress, color = COLORS.iconColor }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconContainer}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      <Icon name="chevron-right" size={16} color={COLORS.gray} />
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
        key={language}
      >
        {/* Modern Header Section */}
        <LinearGradient
          colors={[COLORS.primary, '#E31C44']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Decorative Background Elements */}
          <View style={styles.bgCircle1} />
          <View style={styles.bgCircle2} />

          <View style={styles.userInfoContainer}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={isPremium ? ['#FFD700', '#FFA500', '#FFD700'] : ['#ffffff', '#f0f0f0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarBorder}
              >
                <Image
                  source={
                    user?.image
                      ? { uri: getImageUrl(user.image) }
                      : user?.photos && user.photos.length > 0
                        ? { uri: getImageUrl(user.photos[0]) }
                        : require('../assets/plaseholder.png')
                  }
                  style={styles.avatar}
                />
              </LinearGradient>

              {isPremium && (
                <View style={styles.premiumIndicator}>
                  <Icon name="award" size={12} color={COLORS.white} />
                </View>
              )}
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.nameText} numberOfLines={1}>
                {user?.fullName || 'User Name'}
              </Text>

              {isPremium && (
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.premiumTag}
                >
                  <Icon name="award" size={12} color="#8B0000" />
                  <Text style={styles.premiumTagText}>Premium Member</Text>
                </LinearGradient>
              )}

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleShare}
                style={styles.idChip}
              >
                <Text style={styles.idText}>
                  {formattedProfileId || user?._id?.slice(-7) || 'Loading...'}
                </Text>
                <Icon name="copy" size={12} color={COLORS.white} style={{ marginLeft: 6, opacity: 0.8 }} />
              </TouchableOpacity>

              {!user?.isApproved && (
                <View style={styles.pendingTag}>
                  <Text style={styles.pendingTagText}>Verification Pending</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Upgrade Banner */}
        {!isPremium && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              props.navigation.closeDrawer();
              props.navigation.navigate('HomeTabs', { screen: 'Upgrade' });
            }}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.upgradeBanner}
            >
              <View>
                <Text style={styles.upgradeTitle}>{i18n.t('drawer.upgradeMembership')}</Text>
                <Text style={styles.upgradeSubtitle}>Get up to 39% off • Unlock All Features</Text>
              </View>
              <Icon name="arrow-right-circle" size={24} color="#7a4600" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.menuContainer}>
          {/* Dashboard */}
          <SectionHeader title="Dashboard" />
          <MenuItem
            label={i18n.t('drawer.menu.editProfile')}
            icon="user"
            onPress={() => props.navigation.navigate('EditProfile')}
          />
          <MenuItem
            label={i18n.t('drawer.menu.wallet')}
            icon="dollar-sign"
            onPress={() => props.navigation.navigate('WalletScreen')}
          />
          <MenuItem
            label={i18n.t('drawer.menu.referrals')}
            icon="users"
            onPress={() => props.navigation.navigate('ReferralScreen')}
          />

          {/* Discovery */}
          <View style={styles.divider} />
          <SectionHeader title="Discovery" />

          <MenuItem
            label={i18n.t('matchTabs.yourmatches')}
            icon="users"
            onPress={() => {
              props.navigation.closeDrawer();
              props.navigation.navigate('HomeTabs', {
                screen: 'Matches',
                params: { screen: 'Your Matches' },
              });
            }}
          />
          
          <MenuItem
            label={i18n.t('drawer.menu.searchByUser')}
            icon="search"
            onPress={() => props.navigation.navigate('IdWiseSearch')}
          />
          <MenuItem
            label={i18n.t('drawer.menu.likedProfiles')}
            icon="heart"
            onPress={() => props.navigation.navigate('LikedProfiles')}
          />
         <MenuItem
            label={i18n.t('drawer.menu.blockedProfiles')}
            icon="slash"
            onPress={() => props.navigation.navigate('BlockedProfiles')}
          />

          {/* Settings & Support */}
          <View style={styles.divider} />
          <SectionHeader title="Settings & Support" />
<MenuItem
            label={i18n.t('drawer.menu.partnerPreferences')}
            icon="sliders"
            onPress={() => {
              props.navigation.closeDrawer();
              props.navigation.navigate('PartnerPreferenceSettings');
            }}
          />
          <MenuItem
            label={i18n.t('drawer.menu.accountSettings')}
            icon="settings"
            onPress={() => props.navigation.navigate('AccountSettings')}
          />
          <MenuItem
            label={i18n.t('drawer.menu.languageSettings')}
            icon="globe"
            onPress={() => props.navigation.navigate('LanguageSettings')}
          />
        
          <MenuItem
            label={i18n.t('drawer.menu.complaint')}
            icon="alert-circle"
            onPress={() => props.navigation.navigate('Complaint')}
          />
          <MenuItem
            label={i18n.t('drawer.menu.contactUs')}
            icon="phone"
            onPress={() => props.navigation.navigate('Contact')}
          />
          <MenuItem
            label={i18n.t('drawer.menu.aboutUs')}
            icon="info"
            onPress={() => props.navigation.navigate('About')}
          />
          <MenuItem
            label={i18n.t('drawer.menu.termsPrivacy')}
            icon="file-text"
            onPress={() => props.navigation.navigate('TermPrivacy')}
          />

          <View style={{ height: 20 }} />

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="log-out" size={18} color={COLORS.danger} />
            <Text style={styles.logoutText}>{i18n.t('drawer.menu.logout')}</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>{`App Version ${DeviceInfo.getVersion()}`}</Text>
        </View>

      </DrawerContentScrollView>
    </View>
  );
};

export default CustomDrawerContent;

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    marginBottom: 0,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  // decorative circles for modern feel
  bgCircle1: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -30,
    right: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  avatarBorder: {
    padding: 3,
    borderRadius: 45,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    borderColor: COLORS.white,
    backgroundColor: COLORS.lightGray,
  },
  premiumIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFA500',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    elevation: 4,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: COLORS.white,
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  idChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', // Glass effect
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  idText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.5,
  },
  premiumTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  premiumTagText: {
    color: '#8B0000',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pendingTag: {
    marginTop: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  pendingTagText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '600',
  },

  upgradeBanner: {
    marginHorizontal: 16,
    marginTop: -25, // Overlap the header slightly
    marginBottom: 10,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    backgroundColor: COLORS.white, // fallback
  },
  upgradeTitle: {
    color: '#5c3a00',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  upgradeSubtitle: {
    color: '#7a4600',
    fontSize: 11,
  },

  menuContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },
  sectionHeader: {
    fontSize: 12,
    color: COLORS.gray,
    fontFamily: 'Poppins-Bold',
    marginTop: 15,
    marginBottom: 5,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    // backgroundColor: '#f9f9f9', // Optional: if want bubble style items
    marginBottom: 2,
  },
  menuIconContainer: {
    width: 30,
    alignItems: 'flex-start',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    marginLeft: 5,
    fontFamily: 'Poppins-Medium',
    color: COLORS.darkGray,
  },
  drawerBadgeContainer: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    paddingHorizontal: 5,
  },
  drawerBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 5,
    marginHorizontal: 10,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
  },
  logoutText: {
    color: COLORS.danger,
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  versionText: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 11,
    marginTop: 20,
  }
});
