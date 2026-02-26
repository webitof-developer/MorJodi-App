import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { COLORS, FONTS } from '../constants/theme';
import SubscriptionModal from './SubscriptionModal';
import LinearGradient from 'react-native-linear-gradient';
import { useSocket } from '../components/SocketManager';
import { getImageUrl } from '../utils/imageUtils';
import { useProfileActions } from '../contexts/ProfileActionsContext';
import Animated, { FadeIn } from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const HomeProfileCard = ({ item }) => {
  const { onlineUsers } = useSocket();

  const userStatus = onlineUsers?.[item._id] || {
    status: 'offline',
    lastActive: null,
  };

  // ── Unified profile actions hook ──────────────────────────────
  const {
    openProfile,
    isUnlocked,
    subscriptionModalVisible,
    subscriptionModalMessage,
    setSubscriptionModalVisible,
    handleSubscriptionUpgrade,
  } = useProfileActions(item);

  const calculateAge = dob => {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const photoUri =
    item?.photos?.length > 0
      ? { uri: getImageUrl(item.photos[0]) }
      : require('../assets/matchplaceholder.png');

  const profileVisibility = item?.privacy?.profileVisibility || 'public';
  const isPremium = item?.isPremium || false;

  return (
    <AnimatedTouchableOpacity
      entering={FadeIn}
      activeOpacity={0.9}
      style={styles.card}
      onPress={openProfile}
    >
      <View style={styles.imageWrapper}>
        {userStatus?.status === 'online' && <View style={styles.onlineDot} />}

        <Image source={photoUri} style={styles.image} resizeMode="cover" />

        {isPremium && (
          <View style={styles.premiumTag}>
            <FontAwesome6 name="crown" size={10} color={COLORS.black} />
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}

        {profileVisibility === 'private' && !isUnlocked && (
          <View style={styles.lockOverlay}>
            <View style={styles.lockBg}>
              <FontAwesome6 name="lock" size={18} color={COLORS.white} />
            </View>
            <Text style={styles.lockText}>Private Profile</Text>
          </View>
        )}

        <LinearGradient
          colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.2)', 'transparent']}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.gradientOverlay}
        />

        <View style={styles.infoContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.name}>{item.fullName}</Text>
          </View>
          <Text style={styles.detailText} numberOfLines={1}>
            {item?.location?.city || 'Unknown'} • {calculateAge(item.dateOfBirth)} yrs
          </Text>
        </View>
      </View>

      <SubscriptionModal
        visible={subscriptionModalVisible}
        message={subscriptionModalMessage}
        onClose={() => setSubscriptionModalVisible(false)}
        onUpgradePress={handleSubscriptionUpgrade}
      />
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 165,
    height: 240,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    marginRight: 16,
    overflow: 'hidden',
    elevation: 0,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2.5,
    borderColor: COLORS.white,
    zIndex: 20,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    zIndex: 1,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    zIndex: 30,
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.white,
    textAlign: 'left',
    marginBottom: 4,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  detailText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#E5E7EB',
    textAlign: 'left',
    marginBottom: 2,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  premiumTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFD700',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  premiumText: {
    fontSize: 10,
    fontFamily: FONTS.body5.fontFamily,
    color: COLORS.black,
    marginLeft: 4,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 10,
  },
  lockBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  lockText: {
    color: COLORS.white,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default HomeProfileCard;
