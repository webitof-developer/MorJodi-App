import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { useSelector } from 'react-redux';
import Octicons from 'react-native-vector-icons/Octicons';
import SubscriptionModal from './SubscriptionModal';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { useLike } from '../contexts/LikeContext';
import { useInterest } from '../contexts/InterestContext';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { useSocket } from './SocketManager';
import UserStatus from './UserStatus';
import { LanguageContext } from '../contexts/LanguageContext';
import i18n from '../localization/i18n';
const MatchCard = ({ item }) => {
  const navigation = useNavigation();
  const { isLiked, likeProfile, unlikeProfile } = useLike();
  const { language } = useContext(LanguageContext);

  // ---- INTEREST CONTEXT ----
  const {
    sentInterests,
    receivedInterests,
    getInterestStatus,
    hasAcceptedInterest,
    sendInterest,
    acceptInterest,
    unsendInterest,
    removeAcceptedInterest,
  } = useInterest();

  // >>>>>>> CORE FIX: local reactive state <<<<<<<<<
  const [status, setStatus] = useState(getInterestStatus(item._id));

  useEffect(() => {
    setStatus(getInterestStatus(item._id));
  }, [sentInterests, receivedInterests]);

  // ----------------------------------------

  const { subscription } = useSelector((state) => state.subscription);
  const { token } = useSelector((state) => state.auth);
  const { onlineUsers } = useSocket();

  const onlineState = onlineUsers?.[item._id] || {
    status: 'offline',
    lastActive: item?.lastActive,
  };

  // ----------------------------------------
  // STAR UI BOOLEANS
  const isInterestSent =
    status.type === 'sent' && status.status === 'pending';

  const isInterestReceived =
    status.type === 'received' && status.status === 'pending';

  const isInterestAccepted = status.status === 'accepted';
  const isUnlocked = hasAcceptedInterest(item._id);

  // ----------------------------------------

  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [subscriptionModalMessage, setSubscriptionModalMessage] = useState('');

  const handleCreateChat = async (recipientId) => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/chat/create`,
        { recipientId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigation.navigate('MessageScreen', { chatId: data.chat._id });
    } catch (error) { }
  };

  // ----------------------------------------

  const handleInterestPress = async () => {
    const { type, status: st, interestId } = status;

    if (type === 'none') {
      const result = await sendInterest(item._id);

      if (result?.subscriptionRequired) {
        setSubscriptionModalMessage(result.message);
        setSubscriptionModalVisible(true);
      }
      return;
    }

    if (type === 'sent' && st === 'pending') {
      Alert.alert(
        i18n.t('unsend_interest_title'),
        i18n.t('unsend_interest_message'),
        [
          { text: i18n.t('cancel'), style: 'cancel' },
          { text: i18n.t('unsend'), onPress: () => unsendInterest(interestId) },
        ]
      );
      return;
    }

    if (type === 'received' && st === 'pending') {
      Alert.alert(
        i18n.t('accept_interest_title'),
        i18n.t('accept_interest_message'),
        [
          { text: i18n.t('cancel'), style: 'cancel' },
          { text: i18n.t('accept'), onPress: () => acceptInterest(interestId) },
        ]
      );
      return;
    }

    if (st === 'accepted') {
      Alert.alert(
        i18n.t('remove_interest_title'),
        i18n.t('remove_interest_message'),
        [
          { text: i18n.t('cancel'), style: 'cancel' },
          {
            text: i18n.t('remove'),
            style: 'destructive',
            onPress: () => removeAcceptedInterest(interestId),
          },
        ]
      );

      return;
    }
  };

  // ✅ Safe age calculation
  const calculateAge = dob => {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // ✅ Safe height conversion
  const convertHeight = cm => {
    if (!cm) return '-';
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  };

  // ✅ Safe Like / Unlike handler
  const handleLikeUnlike = async profileId => {
    if (isLiked(profileId)) await unlikeProfile(profileId);
    else await likeProfile(profileId);
  };

  // ✅ Handle Send Interest


  // ✅ Get privacy safely
  const profileVisibility = item?.privacy?.profileVisibility || 'public';
  const photoVisibility = item?.privacy?.photoVisibility || 'public';
  const isSubscribed = subscription?.status === 'active';

  // ✅ Open profile safely with check
  const openProfile = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/user/view/${item._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        navigation.navigate('ProfileDetailScreen', {
          profileId: item._id,
          item,
        });
        return;
      }
    } catch (error) {
      const res = error.response;

      // If user has an active subscription, bypass gating and open profile
      if (isSubscribed) {
        navigation.navigate('ProfileDetailScreen', { profileId: item._id, item });
        return;
      }

      // dY"1 Private profile check — likely subscription or privacy-based
      if (res?.data?.code === 'PRIVATE_PROFILE') {
        setSubscriptionModalMessage(
          res.data.message ||
          `This profile is private. Upgrade your plan to unlock ${item.fullName || 'this profile'
          }.`,
        );
        setSubscriptionModalVisible(true);
        return;
      }

      // 🔹 Daily view limit
      if (res?.data?.code === 'LIMIT_REACHED') {
        setSubscriptionModalMessage(
          res.data.message ||
          'You’ve reached your daily profile view limit. Upgrade to continue exploring more matches.',
        );
        setSubscriptionModalVisible(true);
        return;
      }

      if (res?.data?.message) {
        alert(res.data.message);
      } else {
        alert('Unable to open profile. Please try again.');
      }
    }
  };

  // ✅ Image press handler with privacy check
  const handleImagePress = async (photos, index = 0) => {
    try {
      if (!item._id || !token) return;

      const res = await axios.get(
        `${API_BASE_URL}/api/user/profile/${item._id}/photos`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data?.success) {
        const imageList = res.data.photos?.length ? res.data.photos : photos;
        navigation.navigate('PhotoPreview', {
          photos: imageList,
          startIndex: index,
        });
        return;
      }
    } catch (error) {
      const res = error.response;

      if (res?.data?.code === 'PRIVATE_PHOTOS') {
        // backend is explicitly saying private; if tied to subscription, show modal
        setSubscriptionModalMessage(
          res.data.message ||
          `Photos of ${item.fullName || 'this profile'
          } are available for subscribed members only.`,
        );
        setSubscriptionModalVisible(true);
        return;
      }

      if (res?.data?.code === 'LIMIT_REACHED') {
        // daily limit hit → push to upgrade
        setSubscriptionModalMessage(
          res.data.message ||
          'You have reached your daily photo view limit. Upgrade your plan to continue viewing photos.',
        );
        setSubscriptionModalVisible(true);
        return;
      }

      if (res?.status === 403) {
        // generic forbidden → assume subscription restriction
        setSubscriptionModalMessage(
          res.data?.message ||
          'You need an active subscription to view these photos.',
        );
        setSubscriptionModalVisible(true);
        return;
      }

      console.log('❌ Photo View Error:', res?.data || error.message);
      Alert.alert('Error', 'Unable to load photos.');
    }
  };

  const handleSubscription = () => {
    setSubscriptionModalVisible(false);
    navigation.navigate('HomeTabs', { screen: 'Upgrade' });
  };

  // ✅ Share profile
  const onShare = async () => {
    try {
      await Share.share({
        message: `Check out this profile on MorJodi: ${item.fullName}`,
      });
    } catch (error) {
      alert(error.message);
    }
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
        style={[
          styles.imageBackground,
          isPlaceholder && {}, // centers the smaller image
        ]}
        imageStyle={[
          { borderRadius: SIZES.radius },
          isPlaceholder && {
            resizeMode: 'cover',
            backgroundColor: COLORS.white,
            width: '100%',
            height: '100%',
          }, // smaller placeholder
        ]}
      >
        {item?.isPremium && (
          <View style={styles.premiumCornerTag}>
            <FontAwesome6 name="crown" size={14} color={COLORS.white} />
            <Text style={styles.premiumCornerText}> Premium</Text>
          </View>
        )}
        {/* Gradient Layers */}
        <LinearGradient
          colors={['rgba(0,0,0,0.9)', 'transparent']}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.imageGradient}
        />

        {/* Photo count */}
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

        {/* Private Tag */}
        {profileVisibility === 'private' && !isUnlocked && (
          <View style={styles.privateLockContainer}>
            <View style={styles.lockBlurBg}>
              <FontAwesome6 name="lock" size={26} color={COLORS.white} />
            </View>
            <Text style={styles.privateText}>{i18n.t('private_profile')}</Text>
          </View>
        )}

        {/* Details */}
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
            <FontAwesome6 name="user" size={14} color={COLORS.white} style={{ marginRight: 5, width: 15, textAlign: 'center' }} />
            <Text style={styles.details}>
              {calculateAge(item?.dateOfBirth)} yrs, {item?.religion?.name || ''}, {item?.maritalStatus || ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Icon name="map-marker" size={14} color={COLORS.white} style={{ marginRight: 5, width: 15, textAlign: 'center' }} />
            <Text style={styles.details}>{item?.location?.city || ''}</Text>
          </View>
          <Text style={[styles.profileFor, { marginTop: 2, marginLeft: 20 }]}>
            Profile created by {item.profileFor && item.profileFor.trim().length > 0
              ? item.profileFor.trim().charAt(0).toUpperCase() + item.profileFor.trim().slice(1)
              : 'Self'}
          </Text>
          {/* Bottom Icons */}
          <View style={styles.bottomIconContainer}>
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

            <TouchableOpacity
              style={styles.iconContainer}
              onPress={handleInterestPress}
            >
              <View style={styles.bottomIcon}>
                <Icon
                  name={
                    isInterestAccepted ||
                      isInterestReceived ||
                      isInterestSent
                      ? 'star'
                      : 'star-o'
                  }
                  size={24}
                  color={
                    isInterestAccepted
                      ? COLORS.primary
                      : isInterestReceived
                        ? '#FFA500'
                        : isInterestSent
                          ? '#00BFFF'
                          : COLORS.white
                  }
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconContainer} onPress={onShare}>
              <View style={styles.bottomIcon}>
                <AntDesign name="sharealt" size={22} color={COLORS.white} />
              </View>
            </TouchableOpacity>

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
        onUpgradePress={handleSubscription}
        onClose={() => setSubscriptionModalVisible(false)}
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
  gradientBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '25%',
    borderBottomLeftRadius: SIZES.radius,
    borderBottomRightRadius: SIZES.radius,
  },
  gradientTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '25%',
    height: '25%',
  },
  premiumCornerTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary, // gold shade
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
    // ...FONTS.h3,
    fontSize: 18,
    color: COLORS.white,
    marginRight: 10, // Add some margin to separate name from status
    letterSpacing: 0.2,
    fontFamily: 'Poppins-Regular',
  },
  onlineStatusContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.base,
    paddingVertical: SIZES.base / 2,
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
    backdropFilter: 'blur(10px)', // works on web; RN alt below
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  profileFor: {
    ...FONTS.body5,
    color: COLORS.white,
    opacity: 0.9,
    fontStyle: 'italic',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
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
  iconText: {
    ...FONTS.body4,
    color: COLORS.white,
    marginTop: 0,
    textAlign: 'center',
  },
  modalText: {
    ...FONTS.h3,
    marginBottom: SIZES.base,
    marginTop: SIZES.base,
  },
  subscriptionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.base,
    marginTop: SIZES.base,
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 10,
  },
  buttonText: {
    color: COLORS.white,
    ...FONTS.body3,
  },
});

export default MatchCard;
