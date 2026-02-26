import React, { useContext } from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { useSelector } from 'react-redux';
import Octicons from 'react-native-vector-icons/Octicons';
import SubscriptionModal from './SubscriptionModal';
import AwesomeAlert from './AwesomeAlert';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { useLike } from '../contexts/LikeContext';
import LinearGradient from 'react-native-linear-gradient';
import { useSocket } from './SocketManager';
import UserStatus from './UserStatus';
import { LanguageContext } from '../contexts/LanguageContext';
import { useProfileActions } from '../contexts/ProfileActionsContext';
import i18n from '../localization/i18n';

const MatchCard = ({ item }) => {
  const { language } = useContext(LanguageContext);
  const { isLiked } = useLike();
  const { onlineUsers } = useSocket();

  const onlineState = onlineUsers?.[item._id] || {
    status: 'offline',
    lastActive: item?.lastActive,
  };

  // ── Unified profile actions hook ──────────────────────────────
  const {
    openProfile,
    handleImagePress,
    handleInterestPress,
    handleCreateChat,
    handleLikeUnlike,
    handleShareProfile,
    interestStatus,
    isInterestSent,
    isInterestReceived,
    isInterestAccepted,
    isUnlocked,
    subscriptionModalVisible,
    subscriptionModalMessage,
    setSubscriptionModalVisible,
    handleSubscriptionUpgrade,
    interestAlertState,
    dismissInterestAlert,
  } = useProfileActions(item);

  // ── Privacy helpers ────────────────────────────────────────────
  const profileVisibility = item?.privacy?.profileVisibility || 'public';

  // ── Utility ────────────────────────────────────────────────────
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

  const isPlaceholder = !(item?.photos?.length > 0);

  return (
    <Pressable
      onPress={openProfile}
      style={[
        styles.card,
        item?.isPremium && { borderColor: COLORS.primary, borderWidth: 2 },
      ]}
    >
      <ImageBackground
        source={
          isPlaceholder
            ? require('../assets/matchplaceholder.png')
            : { uri: item.photos[0] }
        }
        style={styles.imageBackground}
        imageStyle={[
          { borderRadius: SIZES.radius },
          isPlaceholder && {
            resizeMode: 'cover',
            backgroundColor: COLORS.white,
            width: '100%',
            height: '100%',
          },
        ]}
      >
        {/* Premium badge */}
        {item?.isPremium && (
          <View style={styles.premiumCornerTag}>
            <FontAwesome6 name="crown" size={14} color={COLORS.white} />
            <Text style={styles.premiumCornerText}> Premium</Text>
          </View>
        )}

        {/* Gradient */}
        <LinearGradient
          colors={['rgba(0,0,0,0.9)', 'transparent']}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.imageGradient}
        />

        {/* Photo count badge */}
        <View style={styles.topRightContainer}>
          {item?.photos?.length > 0 && (
            <Pressable
              onPress={() => handleImagePress(item.photos, 0)}
              style={styles.photoCountContainer}
            >
              <Icon name="image" size={16} color={COLORS.white} />
              <Text style={styles.photoCountText}>{item.photos.length}</Text>
            </Pressable>
          )}
        </View>

        {/* Private lock */}
        {profileVisibility === 'private' && !isUnlocked && (
          <View style={styles.privateLockContainer}>
            <View style={styles.lockBlurBg}>
              <FontAwesome6 name="lock" size={26} color={COLORS.white} />
            </View>
            <Text style={styles.privateText}>{i18n.t('private_profile')}</Text>
          </View>
        )}

        {/* Profile details overlay */}
        <View style={styles.overlay}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
            <Text style={styles.name}>{item?.fullName || 'Unknown'}</Text>
            <UserStatus
              isOnline={onlineState?.status === 'online'}
              lastActive={onlineState?.lastActive}
            />
            {item?.isApproved && (
              <View style={styles.verifiedBadgeContainer}>
                <Octicons name="verified" size={20} color={COLORS.white} />
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
            <FontAwesome6
              name="user"
              size={14}
              color={COLORS.white}
              style={{ marginRight: 5, width: 15, textAlign: 'center' }}
            />
            <Text style={styles.details}>
              {calculateAge(item?.dateOfBirth)} yrs,{' '}
              {item?.religion?.name || ''}, {item?.maritalStatus || ''}, {item?.motherTongue?.name || ''}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Icon
              name="map-marker"
              size={14}
              color={COLORS.white}
              style={{ marginRight: 5, width: 15, textAlign: 'center' }}
            />
            <Text style={styles.details}>{item?.location?.city || ''}</Text>
          </View>

          <Text style={[styles.profileFor, { marginTop: 2, marginLeft: 20 }]}>
            Profile created by{' '}
            {item.profileFor && item.profileFor.trim().length > 0
              ? item.profileFor.trim().charAt(0).toUpperCase() +
              item.profileFor.trim().slice(1)
              : 'Self'}
          </Text>

          {/* Action icons */}
          <View style={styles.bottomIconContainer}>
            {/* Like */}
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => handleLikeUnlike(item._id)}
            >
              <View style={styles.bottomIcon}>
                <Icon
                  name={isLiked(item._id) ? 'heart' : 'heart-o'}
                  size={24}
                  color={isLiked(item._id) ? COLORS.primary : COLORS.white}
                />
              </View>
            </TouchableOpacity>

            {/* Interest */}
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={handleInterestPress}
            >
              <View style={styles.bottomIcon}>
                <Icon
                  name={
                    isInterestAccepted || isInterestReceived || isInterestSent
                      ? 'star'
                      : 'star-o'
                  }
                  size={24}
                  color={
                    isInterestAccepted
                      ? COLORS.primary
                      : isInterestReceived
                        ? COLORS.accent
                        : isInterestSent
                          ? '#00BFFF'
                          : COLORS.white
                  }
                />
              </View>
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity style={styles.iconContainer} onPress={handleShareProfile}>
              <View style={styles.bottomIcon}>
                <AntDesign name="sharealt" size={22} color={COLORS.white} />
              </View>
            </TouchableOpacity>

            {/* Chat */}
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => handleCreateChat(item._id)}
            >
              <View style={styles.bottomIcon}>
                <AntDesign name="message1" size={24} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      <SubscriptionModal
        visible={subscriptionModalVisible}
        profileName={item.fullName}
        message={subscriptionModalMessage}
        onUpgradePress={handleSubscriptionUpgrade}
        onClose={() => setSubscriptionModalVisible(false)}
      />

      <AwesomeAlert
        show={interestAlertState.show}
        showProgress={false}
        title={interestAlertState.title}
        message={interestAlertState.message}
        closeOnTouchOutside
        closeOnHardwareBackPress={false}
        showCancelButton
        showConfirmButton
        cancelText={interestAlertState.cancelText}
        confirmText={interestAlertState.confirmText}
        confirmButtonColor={COLORS.primary}
        onCancelPressed={dismissInterestAlert}
        onConfirmPressed={interestAlertState.onConfirm}
        titleStyle={{ fontSize: 17, fontWeight: 'bold' }}
        messageStyle={{ fontSize: 14, textAlign: 'center' }}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: SIZES.base,
    height: 470,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.lightGray,
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    borderBottomLeftRadius: SIZES.radius,
    borderBottomRightRadius: SIZES.radius,
  },
  verifiedBadgeContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 4,
    marginLeft: 8,
  },
  overlay: {
    padding: SIZES.padding,
    borderBottomLeftRadius: SIZES.radius,
    borderBottomRightRadius: SIZES.radius,
    gap: 4,
  },
  premiumCornerTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
  },
  premiumCornerText: {
    color: COLORS.white,
    fontWeight: 'bold',
    ...FONTS.body5,
  },
  name: {
    fontSize: 18,
    color: COLORS.white,
    marginRight: 10,
    letterSpacing: 0.2,
    fontFamily: 'Poppins-Regular',
  },
  details: {
    ...FONTS.body4,
    color: COLORS.white,
    lineHeight: 18,
  },
  topRightContainer: {
    position: 'absolute',
    top: 30,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.base,
    paddingVertical: SIZES.base / 2,
  },
  photoCountText: {
    color: COLORS.white,
    ...FONTS.body5,
    marginLeft: SIZES.base / 2,
  },
  privateLockContainer: {
    position: 'absolute',
    top: '20%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  lockBlurBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  privateText: {
    marginTop: 8,
    color: COLORS.white,
    ...FONTS.body5,
    fontStyle: 'italic',
    opacity: 0.9,
    textAlign: 'center',
  },
  profileFor: {
    ...FONTS.body5,
    color: COLORS.white,
    opacity: 0.9,
    fontStyle: 'italic',
  },
  bottomIconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.base,
    width: '100%',
    marginTop: 6,
  },
  iconContainer: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  bottomIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
});

export default MatchCard;
