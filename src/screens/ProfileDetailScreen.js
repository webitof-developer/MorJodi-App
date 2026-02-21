import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Modal,
  Share,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { API_BASE_URL } from '../constants/config';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { useBlock } from '../contexts/BlockContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLike } from '../contexts/LikeContext';
import { useSocket } from '../components/SocketManager';
import { useInterest } from '../contexts/InterestContext';
import UserStatus from '../components/UserStatus';
import LinearGradient from 'react-native-linear-gradient';
const { width } = Dimensions.get('window');
import SubscriptionModal from '../components/SubscriptionModal';
import Icon from 'react-native-vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchSubscription } from '../redux/slices/subscriptionSlice';
import i18n from '../localization/i18n';

const STICKY_OVERLAY_HEIGHT = 60;
const STICKY_TABS_HEIGHT = 50;
const IMAGE_HEIGHT = width * 1.2;
const STICKY_OFFSET = STICKY_OVERLAY_HEIGHT + STICKY_TABS_HEIGHT;

const ProfileDetailScreen = ({ route, navigation }) => {
  const { profileId, item } = route.params;
  console.log('item', item);
  console.log('profileId', profileId);
  const dispatch = useDispatch();
  const { token, user } = useSelector(state => state.auth);
  const { subscription } = useSelector(state => state.subscription);
  const { isBlocked, blockProfile, unblockProfile } = useBlock();
  const { isLiked, likeProfile, unlikeProfile } = useLike();
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
  const displayName = profile?.fullName || item?.fullName || 'this profile';

  const { onlineUsers } = useSocket();
  const status = item?._id
    ? onlineUsers?.[item._id] || {
      status: 'offline',
      lastActive: item?.lastActive,
    }
    : { status: 'offline', lastActive: null };

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverDown, setServerDown] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false); // Renamed for clarity (Block/Share)
  const [imagePrivacyModalVisible, setImagePrivacyModalVisible] =
    useState(false); // NEW STATE
  const [isOverlaySticky, setIsOverlaySticky] = useState(false);
  const [isTabsSticky, setIsTabsSticky] = useState(false);
  const [layouts, setLayouts] = useState({});
  const [activeTab, setActiveTab] = useState('about');
  const [matchData, setMatchData] = useState(null);
  const scrollViewRef = useRef(null);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contactData, setContactData] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [localInterest, setLocalInterest] = useState(getInterestStatus(item._id));
  const t = key => i18n.t(`profileDetail.${key}`);
  const translateCriterion = value => {
    if (!value) {
      return '';
    }
    const raw = value.toString().trim();
    const key = raw.toLowerCase();
    const map = {
      age: 'age',
      height: 'height',
      children: 'children',
      'marital status': 'maritalStatus',
      religion: 'religion',
      caste: 'caste',
      'sub caste': 'subCaste',
      raasi: 'raasi',
      diet: 'diet',
      smoking: 'smoking',
      drinking: 'drinking',
      'mother tongue': 'motherTongue',
      education: 'education',
      profession: 'profession',
      location: 'location',
      'expected income': 'expectedIncome',
    };
    const locKey = map[key];
    if (locKey) {
      const viaProfileDetail = i18n.t(`profileDetail.${locKey}`);
      if (viaProfileDetail && viaProfileDetail !== `profileDetail.${locKey}`) {
        return viaProfileDetail;
      }
      const viaCommon = i18n.t(`common.${locKey}`);
      if (viaCommon && viaCommon !== `common.${locKey}`) {
        return viaCommon;
      }
    }
    return raw;
  };

  useEffect(() => {
    // Keep interest status in sync when lists change; avoid depending on the function identity
    setLocalInterest(getInterestStatus(item._id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentInterests, receivedInterests, item._id]);

  const isInterestSent =
    localInterest.type === 'sent' && localInterest.status === 'pending';

  const isInterestReceived =
    localInterest.type === 'received' && localInterest.status === 'pending';

  const isInterestAccepted = localInterest.status === 'accepted';

  const [subscriptionModalVisible, setSubscriptionModalVisible] =
    useState(false);
  const [subscriptionModalMessage, setSubscriptionModalMessage] = useState('');
  const activePlan = subscription?.subscription?.plan;
  const planName = activePlan?.name?.toLowerCase?.();
  const planIsFree =
    activePlan?.isFree ??
    (typeof activePlan?.price === 'number' && activePlan.price === 0) ??
    (planName ? planName.includes('free') : false);
  const isPaidActive =
    subscription?.status === 'active' &&
    ((activePlan && (planIsFree === false || planIsFree === undefined)) ||
      !activePlan);

  const handleSubscription = () => {
    setSubscriptionModalVisible(false);
    navigation.navigate('HomeTabs', { screen: 'Upgrade' });
  };

  const showSubscriptionModal = message => {
    if (isPaidActive) return;
    setSubscriptionModalMessage(message);
    setSubscriptionModalVisible(true);
  };

  useEffect(() => {
    if (token && !subscription) {
      dispatch(fetchSubscription());
    }
  }, [token, subscription, dispatch]);

  // Fetch profile detail
  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileId) {
        setError('Profile not available.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/api/user/${profileId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const userData = data.user || data;
        if (!userData || !userData._id) {
          throw new Error('Invalid profile response');
        }
        setProfile(userData);
        setServerDown(false);
      } catch (err) {
        const res = err.response;
        if (!res || res?.status >= 500) {
          setServerDown(true);
        }
        if (res?.status === 403) {
          if (!isPaidActive) {
            showSubscriptionModal(
              res.data?.message || 'Upgrade required to view this profile.',
            );
          } else {
            Alert.alert('Error', 'Profile is not available right now.');
          }
        } else {
          setError('Failed to load profile details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileId, token, isPaidActive, reloadKey]);

  const isUnlocked = hasAcceptedInterest(item._id);

  // Normalize ObjectId or primitive to string for comparison
  const normalizeId = value => {
    if (!value) return null;
    if (typeof value === 'object') {
      if (value._id) return value._id.toString();
      if (value.id) return value.id.toString();
    }
    return value.toString();
  };

  const computeLocalMatch = useCallback(() => {
    if (!profile || !user?.partnerPreference) return null;
    const prefs = user.partnerPreference;
    let matched = [];
    let total = 0;

    const addCriteria = (label, condition, enabled = true) => {
      if (!enabled) return;
      total += 1;
      if (condition) matched.push(label);
    };

    // Age
    if (prefs.ageRange && prefs.ageRange.length === 2 && profile.dateOfBirth) {
      const age =
        new Date().getFullYear() -
        new Date(profile.dateOfBirth).getFullYear();
      addCriteria(
        t('age'),
        age >= prefs.ageRange[0] && age <= prefs.ageRange[1],
      );
    }

    // Height
    if (prefs.heightRange && prefs.heightRange.length === 2 && profile.height) {
      addCriteria(
        t('height'),
        profile.height >= prefs.heightRange[0] &&
        profile.height <= prefs.heightRange[1],
      );
    }

    // Children
    if (prefs.children && prefs.children !== 'Prefer not to say') {
      const hasNoChildren =
        profile.children === 'No Children' ||
        profile.children === '' ||
        profile.children == null;
      addCriteria(
        t('children'),
        prefs.children === 'No Children' ? hasNoChildren : !hasNoChildren,
      );
    }

    // Marital Status
    addCriteria(
      t('maritalStatus'),
      prefs.maritalStatus?.includes?.(profile.maritalStatus),
      Array.isArray(prefs.maritalStatus),
    );

    // Religion
    const prefReligion = prefs.religion?.map(normalizeId);
    addCriteria(
      t('religion'),
      prefReligion?.includes?.(normalizeId(profile.religion)),
      Array.isArray(prefReligion),
    );

    // Caste
    const prefCaste = prefs.caste?.map(normalizeId);
    addCriteria(
      t('caste'),
      prefCaste?.includes?.(normalizeId(profile.caste)),
      Array.isArray(prefCaste),
    );

    // Sub Caste
    const prefSubCaste = prefs.subCaste?.map(normalizeId);
    addCriteria(
      t('subCaste'),
      prefSubCaste?.includes?.(normalizeId(profile.subCaste)),
      Array.isArray(prefSubCaste),
    );

    // Mother Tongue
    const prefMotherTongue = prefs.motherTongue?.map(normalizeId);
    addCriteria(
      t('motherTongue'),
      prefMotherTongue?.includes?.(normalizeId(profile.motherTongue)),
      Array.isArray(prefMotherTongue),
    );

    // Education (any match)
    const prefEducation = prefs.education?.map(normalizeId);
    addCriteria(
      t('education'),
      Array.isArray(profile.education) &&
      profile.education
        .map(normalizeId)
        .some(id => prefEducation?.includes?.(id)),
      Array.isArray(prefEducation),
    );

    // Profession
    const prefProfession = prefs.profession?.map(normalizeId);
    addCriteria(
      t('profession'),
      prefProfession?.includes?.(normalizeId(profile.profession)),
      Array.isArray(prefProfession),
    );

    // Location
    const prefLocation = prefs.location?.map(normalizeId);
    addCriteria(
      t('location'),
      prefLocation?.includes?.(normalizeId(profile.location)),
      Array.isArray(prefLocation),
    );

    // Diet
    addCriteria(
      t('diet'),
      prefs.diet?.includes?.(profile?.lifestyle?.diet),
      Array.isArray(prefs.diet),
    );

    // Smoking
    addCriteria(
      t('smoking'),
      prefs.smoking?.includes?.(profile?.lifestyle?.smoking),
      Array.isArray(prefs.smoking),
    );

    // Drinking
    addCriteria(
      t('drinking'),
      prefs.drinking?.includes?.(profile?.lifestyle?.drinking),
      Array.isArray(prefs.drinking),
    );

    // Family Type / Values
    addCriteria(
      t('familyType'),
      prefs.familyType?.includes?.(profile?.familyDetails?.familyType),
      Array.isArray(prefs.familyType),
    );
    addCriteria(
      t('familyValues'),
      prefs.familyValues &&
      profile?.familyDetails?.familyValues &&
      profile.familyDetails.familyValues
        .toLowerCase?.()
        .includes(prefs.familyValues.toLowerCase?.() || ''),
      !!prefs.familyValues,
    );

    // Gotra
    const prefGotra = prefs.gotra?.map(normalizeId);
    addCriteria(
      'Gotra',
      prefGotra?.includes?.(normalizeId(profile.gotra)),
      Array.isArray(prefGotra),
    );

    return { matched, total };
  }, [profile, user?.partnerPreference]);

  const handleCreateChat = async recipientId => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/chat/create`,
        { recipientId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      navigation.navigate('MessageScreen', { chatId: data.chat._id });
    } catch (error) {
      // //console.error("Error creating chat:", error);
    }
  };
  const handleInterestPress = async () => {
    const { type, status: st, interestId } = localInterest;

    // Send new interest
    if (type === 'none') {
      const result = await sendInterest(item._id);

      if (result?.subscriptionRequired) {
        showSubscriptionModal(result.message);
        return;
      }

      Alert.alert("Interest Sent", "Your interest has been sent.");
      return;
    }

    // Unsend interest
    if (type === 'sent' && st === 'pending') {
      Alert.alert('Unsend Interest?', 'Do you want to remove this interest?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unsend', onPress: () => unsendInterest(interestId) },
      ]);
      return;
    }

    // Accept received interest
    if (type === 'received' && st === 'pending') {
      Alert.alert('Accept Interest?', 'Do you want to accept this interest?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: () => acceptInterest(interestId) },
      ]);
      return;
    }

    if (st === 'accepted') {
      Alert.alert(
        'Remove Accepted Interest?',
        'This will remove the mutual interest.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeAcceptedInterest(interestId),
          },
        ]
      );
      return;
    }
  };

  const handleLikeUnlike = async id => {
    if (!id) return;
    try {
      if (isLiked(id)) {
        await unlikeProfile(id);
      } else {
        await likeProfile(id);
      }
    } catch (err) {
      console.log('Like/unlike error:', err.message);
    }
  };

  const renderServerError = message => (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 24,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 360,
          backgroundColor: '#f7f8fb',
          borderRadius: 16,
          paddingVertical: 28,
          paddingHorizontal: 20,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 3,
          borderWidth: 1,
          borderColor: '#e5e7eb',
        }}
      >
        <View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: 14,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#e5e7eb',
          }}
        >
          <MaterialCommunityIcons name="server-off" size={42} color={COLORS.primary} />
        </View>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: COLORS.black,
            textAlign: 'center',
          }}
        >
          {message || 'Server error'}
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 13,
            color: '#4b5563',
            textAlign: 'center',
            lineHeight: 18,
          }}
        >
          We're working on it. Please try again in a bit.
        </Text>
        <TouchableOpacity
          onPress={() => {
            setError(null);
            setServerDown(false);
            setLoading(true);
            setReloadKey(k => k + 1);
          }}
          style={{
            marginTop: 16,
            paddingHorizontal: 18,
            paddingVertical: 11,
            backgroundColor: COLORS.primary,
            borderRadius: 10,
            width: '100%',
          }}
        >
          <Text
            style={{
              color: COLORS.white,
              fontWeight: '700',
              textAlign: 'center',
            }}
          >
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // Fetch match percentage/details
  useEffect(() => {
    const fetchMatchData = async () => {
      if (!token || !profileId || !user?._id) return;
      if (!profile) return;
      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/api/matches/match-percentage`,
          {
            // Backend expects userId1 = current user (preferences), userId2 = profile being viewed
            userId1: user._id,
            userId2: profileId,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const criteria = Array.isArray(data?.matchedCriteria)
          ? data.matchedCriteria.filter(Boolean)
          : [];
        const rawPercent =
          typeof data?.matchPercentage === 'string'
            ? parseFloat(data.matchPercentage)
            : data?.matchPercentage;
        let percent =
          criteria.length > 0 && typeof rawPercent === 'number' && !isNaN(rawPercent)
            ? rawPercent
            : 0;

        // Fallback: compute locally if API returns empty criteria or zero percent
        const local = computeLocalMatch();
        let displayCriteria = criteria;
        if ((!criteria.length || percent === 0) && local) {
          if (local.matched.length) {
            displayCriteria = local.matched;
            if (local.total > 0) {
              percent = parseFloat(
                ((local.matched.length / local.total) * 100).toFixed(2),
              );
            }
          }
        }

        setMatchData({
          ...data,
          matchedCriteria: displayCriteria,
          matchPercentage: percent,
        });
      } catch (err) {
        console.log('Match fetch error:', err.response?.data || err.message);
      }
    };

    fetchMatchData();
  }, [token, profileId, user?._id, profile, computeLocalMatch]);

  const handleTabLayout = useCallback((event, tab) => {
    const y = event?.nativeEvent?.layout?.y;
    if (typeof y === 'number' && !Number.isNaN(y)) {
      setLayouts(prev => ({ ...prev, [tab]: y }));
    }
  }, []);

  const handleTabPress = tab => {
    setActiveTab(tab);
    const y = layouts?.[tab];
    if (scrollViewRef.current && typeof y === 'number' && !Number.isNaN(y)) {
      scrollViewRef.current.scrollTo({ y: y - STICKY_OFFSET, animated: true });
    }
  };

  const handleScroll = event => {
    const y = event?.nativeEvent?.contentOffset?.y ?? 0;
    const overlayStickyPoint = IMAGE_HEIGHT - 60;
    const tabsStickyPoint = IMAGE_HEIGHT - STICKY_OVERLAY_HEIGHT;

    setIsOverlaySticky(y > overlayStickyPoint);
    setIsTabsSticky(y > tabsStickyPoint);

    const currentScrollY = y + STICKY_OFFSET + 1;
    const tabs = ['about', 'family', 'lookingFor', 'match'];
    let newActiveTab = 'about';

    for (let i = tabs.length - 1; i >= 0; i--) {
      const tab = tabs[i];
      if (typeof layouts?.[tab] === 'number' && currentScrollY >= layouts[tab]) {
        newActiveTab = tab;
        break;
      }
    }

    if (activeTab !== newActiveTab) setActiveTab(newActiveTab);
  };


  const handleContactInfoPress = async () => {
    try {
      setContactLoading(true);
      const { data } = await axios.get(
        `${API_BASE_URL}/api/user/profile/${profileId}/contact`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      console.log('Contact API Response:', data);
      setContactData(data);
      setContactModalVisible(true);
    } catch (error) {
      const res = error.response;

      if (res?.data?.code === 'PRIVATE_PROFILE') {
        if (!isPaidActive) {
          showSubscriptionModal(
            res.data.message ||
            'This contact info is private. Upgrade your plan to unlock it.',
          );
        } else {
          Alert.alert('Private', 'This user has kept contact details private.');
        }
        return;
      }

      if (res?.data?.code === 'LIMIT_REACHED') {
        if (!isPaidActive) {
          showSubscriptionModal(
            res.data.message ||
            'You have reached your contact view limit. Upgrade your plan to view more contacts.',
          );
        } else {
          Alert.alert('Limit reached', 'Contact view limit reached.');
        }
        return;
      }

      if (res?.status === 403) {
        if (!isPaidActive) {
          showSubscriptionModal(
            res.data?.message ||
            "You need a premium plan to view this user's contact details.",
          );
        } else {
          Alert.alert('Error', 'Contact details are not available right now.');
        }
        return;
      }

      console.log('Contact fetch error:', res?.data || error.message);
      Alert.alert('Error', 'Failed to load contact details.');
    } finally {
      setContactLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!profile?._id) return;
    try {
      if (isBlocked(profile._id)) {
        await unblockProfile(profile._id);
        Alert.alert('Unblocked', `${profile.fullName} has been unblocked.`);
      } else {
        await blockProfile(profile._id);
        Alert.alert('Blocked', `${profile.fullName} has been blocked.`);
      }
      setOptionsModalVisible(false);
    } catch (err) {
      Alert.alert('Error', 'Something went wrong while blocking/unblocking.');
    }
  };

  const handleShareProfile = async () => {
    setOptionsModalVisible(false);
    try {
      await Share.share({
        message: `Check out this profile on MorJodi: ${profile?.fullName || 'this profile'
          }`,
        url: `${API_BASE_URL}/profile/${profileId}`,
      });
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleImagePress = async (photos, index = 0) => {
    try {
      if (!profileId || !token) return;

      const res = await axios.get(
        `${API_BASE_URL}/api/user/profile/${profileId}/photos`,
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

      // Private photos
      if (res?.data?.code === 'PRIVATE_PHOTOS') {
        if (!isPaidActive) {
          showSubscriptionModal(
            res.data.message ||
            'These photos are available only to eligible members. Upgrade to unlock access.',
          );
        } else {
          Alert.alert('Private', 'Photos are not available to view.');
        }
        return;
      }

      // Daily limit reached
      if (res?.data?.code === 'LIMIT_REACHED') {
        if (!isPaidActive) {
          showSubscriptionModal(
            res.data.message ||
            'You have reached your daily photo view limit. Upgrade your plan to continue viewing photos.',
          );
        } else {
          Alert.alert('Limit reached', 'Photo view limit reached for today.');
        }
        return;
      }

      // Forbidden / subscription gate
      if (res?.status === 403) {
        if (!isPaidActive) {
          showSubscriptionModal(
            res.data?.message ||
            "You don't have access to view these photos. Upgrade your subscription to unlock them.",
          );
        } else {
          Alert.alert('Error', 'Photos are not available to view right now.');
        }
        return;
      }

      console.log('Photo View Error:', res?.data || error.message);
      Alert.alert('Error', 'Unable to load photos.');
    }
  };

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

  const convertHeight = cm => {
    if (!cm) return '-';
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  };

  if (serverDown) {
    return renderServerError();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !profile) {
    return renderServerError(error || 'Server error');
  }

  // --- Tab Button Component ---

  const TabButton = ({ tabKey, title }) => {
    const isActive = activeTab === tabKey;

    return (
      <TouchableOpacity
        style={[
          styles.tab,
          { borderBottomColor: isActive ? COLORS.primary : COLORS.white },
        ]}
        onPress={() => handleTabPress(tabKey)}
      >
        <Text style={[styles.tabText, { color: COLORS.dark }]}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const DetailItem = ({ icon, label, value }) => (
    <View style={styles.detailItemContainer}>
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={COLORS.primary}
        style={styles.detailIcon}
      />
      <View style={styles.detailRow}>
        <Text style={styles.detailLabelText}>{label}</Text>
        <Text style={styles.detailValueText}>{value}</Text>
      </View>
    </View>
  );

  // --- Main Component Render ---

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* 1. Sticky Icon Header (Positioned at top: 0) */}
        {isOverlaySticky && (
          <View style={styles.stickyOverlayHeader}>
            <View style={styles.leftIconsSticky}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backIconSticky}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
              </TouchableOpacity>

              <Image
                source={
                  profile.photos[0]
                    ? {
                      uri: profile.photos[0],
                    }
                    : require('../assets/plaseholder.png')
                }
                style={styles.profileImageOverlay}
              />

              <View style={styles.nameContainerSticky}>
                <Text style={styles.nameSticky}>{profile.fullName}</Text>
                <UserStatus
                  isOnline={status?.status === 'online'}
                  lastActive={status?.lastActive}
                  variant="small"
                />
              </View>
            </View>
            <View style={styles.rightIconsSticky}>
              <TouchableOpacity
                onPress={() => setOptionsModalVisible(true)}
                style={styles.threeDotIconSticky}
              >
                <MaterialCommunityIcons
                  name="dots-vertical"
                  size={24}
                  color={COLORS.dark}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 2. Sticky Tab Bar (Positioned at top: STICKY_OVERLAY_HEIGHT) */}
        {isTabsSticky && (
          <View style={styles.stickyTabs}>
            <TabButton tabKey="about" title={t('tabs.about')} />
            <TabButton tabKey="family" title={t('tabs.family')} />
            <TabButton tabKey="lookingFor" title={t('tabs.lookingFor')} />
            <TabButton tabKey="match" title={t('tabs.match')} />
          </View>
        )}

        <ScrollView
          ref={scrollViewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* A. Image and Absolute Overlays */}
          <View>
            <Image
              source={
                profile.photos[0]
                  ? { uri: profile.photos[0] }
                  : require('../assets/matchplaceholder.png')
              }
              style={styles.profileImage}
            />
            {/* Original Overlay Icons */}
            <View style={styles.overlayIcons}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backIcon}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.white} />
              </TouchableOpacity>
              <View style={styles.rightIcons}>
                <TouchableOpacity
                  onPress={() => handleImagePress(profile.photos, 0)}
                  style={styles.imageCountContainer}
                >
                  <FontAwesome name="image" size={20} color={COLORS.white} />
                  <Text style={styles.imageCountText}>
                    {profile.photos.length}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setOptionsModalVisible(true)}
                  style={styles.threeDotIcon}
                >
                  <MaterialCommunityIcons
                    name="dots-vertical"
                    size={24}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
              </View>
            </View>
            {/* Name Overlay */}
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.3)', 'transparent']}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={styles.bottomOverlay}
            >
              <View style={styles.nameOverlayContainer}>
                <Text style={styles.nameOverlay}>{profile.fullName}</Text>
                <View style={styles.statusOverlayContainer}>

                  <UserStatus
                    isOnline={status?.status === 'online'}
                    lastActive={status?.lastActive}
                  />
                </View>
              </View>

              <Text style={styles.profileFor}>
                Profile is created by {profile.profileFor}
              </Text>
            </LinearGradient>
          </View>

          {/* B. Tabs Container (NON-STICKY, normal flow) - This gets replaced by stickyTabs when scrolled */}
          <View style={styles.tabsContainerNonSticky}>
            <TabButton tabKey="about" title={t('tabs.about')} />
            <TabButton tabKey="family" title={t('tabs.family')} />
            <TabButton tabKey="lookingFor" title={t('tabs.lookingFor')} />
            <TabButton tabKey="match" title={t('tabs.match')} />
          </View>

          {/* C. Content Sections (Layout for navigation and scroll tracking) */}
          <View style={{ paddingHorizontal: SIZES.padding }}>
            <View
              onLayout={e => handleTabLayout(e, 'about')}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>{t('about')}</Text>
              <DetailItem
                icon="cake-variant"
                label={t('age')}
                value={calculateAge(profile.dateOfBirth)}
              />
              <DetailItem
                icon="human-male-height"
                label={t('height')}
                value={convertHeight(profile.height)}
              />
              <DetailItem
                icon="star-circle-outline"
                label={t('religion')}
                value={profile.religion?.name || '-'}
              />
              <DetailItem
                icon="account-group-outline"
                label={t('caste')}
                value={profile.caste?.name || '-'}
              />
              <DetailItem
                icon="account-group-outline"
                label={t('subCaste')}
                value={profile.subCaste?.name || '-'}
              />
              <DetailItem
                icon="heart-outline"
                label={t('maritalStatus')}
                value={profile.maritalStatus || '-'}
              />
              <DetailItem
                icon="baby-face-outline"
                label={t('children')}
                value={profile.children || '-'}
              />
              <DetailItem
                icon="zodiac-virgo"
                label={t('raasi')}
                value={profile.raasi?.name || '-'}
              />

              <DetailItem
                icon="food-apple-outline"
                label={t('diet')}
                value={profile.lifestyle?.diet || '-'}
              />
              <DetailItem
                icon="cup-water"
                label={t('drinking')}
                value={profile.lifestyle?.drinking || '-'}
              />
              <DetailItem
                icon="smoking"
                label={t('smoking')}
                value={profile.lifestyle?.smoking || '-'}
              />
              <DetailItem
                icon="translate"
                label={t('motherTongue')}
                value={profile.motherTongue?.name || '-'}
              />
              {profile.education.map((edu, index) => (
                <DetailItem
                  key={index}
                  icon="school-outline"
                  label={t('education')}
                  value={`${edu.degree} in ${edu.field || 'N/A'}`}
                />
              ))}
              <DetailItem
                icon="briefcase-outline"
                label={t('profession')}
                value={`${profile.profession?.occupation || '-'}, ${profile.profession?.industry || '-'
                  }`}
              />
              <DetailItem
                icon="map-marker-outline"
                label={t('location')}
                value={`${profile.location?.city || '-'}, ${profile.location?.state || '-'
                  },,${profile.location?.country || '-'}`}
              />
            </View>
            <View
              onLayout={e => handleTabLayout(e, 'family')}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>{t('familySection')}</Text>

              <DetailItem
                icon="account-tie"
                label={t('fatherStatus')}
                value={profile.familyDetails?.fatherStatus || '-'}
              />
              <DetailItem
                icon="human-female"
                label={t('motherStatus')}
                value={profile.familyDetails?.motherStatus || '-'}
              />
              <DetailItem
                icon="home-city"
                label={t('familyType')}
                value={profile.familyDetails?.familyType || '-'}
              />
              <DetailItem
                icon="hand-heart"
                label={t('familyValues')}
                value={profile.familyDetails?.familyValues || '-'}
              />
              <DetailItem
                icon="account-group"
                label={t('brothers')}
                value={profile.familyDetails?.brothers ?? '-'}
              />
              <DetailItem
                icon="account-group-outline"
                label={t('sisters')}
                value={profile.familyDetails?.sisters ?? '-'}
              />
              <DetailItem
                icon="map-marker-radius"
                label={t('familyLocation')}
                value={
                  profile.familyDetails?.familyLocation
                    ? `${profile.familyDetails.familyLocation.city || ''}, ${profile.familyDetails.familyLocation.state || ''
                    }, ${profile.familyDetails.familyLocation.country || ''}`
                    : '-'
                }
              />
            </View>

            <View
              onLayout={e => handleTabLayout(e, 'lookingFor')}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>{t('lookingForSection')}</Text>

              <DetailItem
                icon="timer-sand"
                label={t('ageRange')}
                value={`${profile.partnerPreference?.ageRange?.[0] || '-'} - ${profile.partnerPreference?.ageRange?.[1] || '-'
                  }`}
              />
              <DetailItem
                icon="ruler"
                label={t('heightRange')}
                value={`${convertHeight(
                  profile.partnerPreference?.heightRange?.[0],
                )} - ${convertHeight(
                  profile.partnerPreference?.heightRange?.[1],
                )}`}
              />
              <DetailItem
                icon="account-heart"
                label={t('maritalStatus')}
                value={
                  profile.partnerPreference?.maritalStatus?.join(', ') || '-'
                }
              />
              <DetailItem
                icon="baby-face-outline"
                label={t('children')}
                value={profile.partnerPreference?.children || '-'}
              />
              <DetailItem
                icon="star-circle-outline"
                label={t('religion')}
                value={
                  profile.partnerPreference?.religion
                    ?.map(r => r.name)
                    .join(', ') || '-'
                }
              />
              <DetailItem
                icon="account-group"
                label={t('caste')}
                value={
                  profile.partnerPreference?.caste
                    ?.map(c => c.name)
                    .join(', ') || '-'
                }
              />
              <DetailItem
                icon="account-group"
                label={t('subCaste')}
                value={
                  profile.partnerPreference?.subCaste
                    ?.map(sc => sc.name)
                    .join(', ') || '-'
                }
              />
              <DetailItem
                icon="heart-outline"
                label={t('motherTongue')}
                value={
                  profile.partnerPreference?.motherTongue
                    ?.map(mt => mt.name)
                    .join(', ') || '-'
                }
              />

              <DetailItem
                icon="school-outline"
                label={t('education')}
                value={
                  profile.partnerPreference?.education
                    ?.map(e => e.degree)
                    .join(', ') || '-'
                }
              />
              <DetailItem
                icon="briefcase-variant-outline"
                label={t('profession')}
                value={
                  profile.partnerPreference?.profession
                    ?.map(p => p.occupation)
                    .join(', ') || '-'
                }
              />
              <DetailItem
                icon="map-marker"
                label={t('preferredLocation')}
                value={
                  profile.partnerPreference?.location
                    ?.map(l => l.city)
                    .join(', ') || '-'
                }
              />
              <DetailItem
                icon="currency-inr"
                label={t('expectedIncome')}
                value={profile.partnerPreference?.annualIncome || '-'}
              />
            </View>

            <View
              onLayout={e => handleTabLayout(e, 'match')}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>{t('matchSection')}</Text>
              {matchData ? (
                <View>
                  <View style={styles.matchContainer}>
                    <Image
                      source={
                        profile.photos[0]
                          ? { uri: profile.photos[0] }
                          : require('../assets/plaseholder.png')
                      }
                      style={styles.matchPhoto}
                    />
                    <View style={styles.matchPercentageContainer}>
                      <Text style={styles.matchPercentageText}>
                        {matchData.matchPercentage ?? 0}%
                      </Text>
                      <Text style={styles.matchText}>Match</Text>
                    </View>
                    <Image
                      source={
                        user?.photos?.length > 0
                          ? { uri: user.photos[0] }
                          : require('../assets/plaseholder.png')
                      }
                      style={styles.matchPhoto}
                    />
                  </View>
                  <View style={styles.matchedCriteriaContainer}>
                    <Text style={styles.matchedCriteriaTitle}>
                      {t('matchedCriteriaTitle')}
                    </Text>
                    {Array.isArray(matchData.matchedCriteria) &&
                      matchData.matchedCriteria.length > 0 ? (
                      matchData.matchedCriteria.map((criterion, index) => (
                        <Text key={index} style={styles.matchedCriterion}>
                          {translateCriterion(criterion)}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.detailValueText}>
                        {t('noMatchingCriteria')}
                      </Text>
                    )}
                  </View>
                </View>
              ) : (
                <Text style={styles.detailValueText}>
                  {t('matchUnavailable')}
                </Text>
              )}
            </View>
          </View>

          {/* Modal 1: Block/Share Options */}
          <Modal
            animationType="slide"
            transparent
            visible={optionsModalVisible}
            onRequestClose={() => setOptionsModalVisible(false)}
          >
            <TouchableOpacity
              style={styles.optionsModalOverlay}
              activeOpacity={1}
              onPressOut={() => setOptionsModalVisible(false)}
            >
              <View style={styles.optionsModalContent}>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={handleBlockToggle}
                >
                  <MaterialCommunityIcons
                    name={
                      isBlocked(profile._id)
                        ? 'lock-open-outline'
                        : 'block-helper'
                    }
                    size={24}
                    color={COLORS.primary}
                    style={styles.modalOptionIcon}
                  />
                  <Text style={styles.modalOptionText}>
                    {isBlocked(profile._id)
                      ? 'Unblock Profile'
                      : 'Block Profile'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={handleShareProfile}
                >
                  <MaterialCommunityIcons
                    name="share-variant"
                    size={24}
                    color={COLORS.primary}
                    style={styles.modalOptionIcon}
                  />
                  <Text style={styles.modalOptionText}>Share Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setOptionsModalVisible(false);
                    navigation.navigate('Complaint', {
                      reportedUserId: profile._id,
                    });
                  }}
                >
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={24}
                    color={COLORS.primary}
                    style={styles.modalOptionIcon}
                  />
                  <Text style={styles.modalOptionText}>Report Profile</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Modal 3: Contact Info */}
          <Modal
            visible={contactModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setContactModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                {contactLoading ? (
                  <ActivityIndicator size="large" color={COLORS.primary} />
                ) : (
                  <>
                    <Text style={styles.modalTitle}>Contact Information</Text>

                    <View style={styles.contactRowModal}>
                      <Ionicons
                        name="call-outline"
                        size={22}
                        color={COLORS.primary}
                      />
                      <Text style={styles.modalTextValue}>
                        {contactData?.phoneNumber || 'N/A'}
                      </Text>
                    </View>

                    <View style={styles.contactRowModal}>
                      <MaterialCommunityIcons
                        name="email-outline"
                        size={22}
                        color={COLORS.primary}
                      />
                      <Text style={styles.modalTextValue}>
                        {contactData?.email || 'N/A'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => setContactModalVisible(false)}
                      style={styles.closeButton}
                    >
                      <AntDesign name="close" size={20} color={COLORS.black} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </Modal>

          {/* Modal 2: Image Privacy/Subscription Prompt (NEW) */}
          <SubscriptionModal
            visible={subscriptionModalVisible}
            profileName={displayName} // or pass null if you don't care
            message={subscriptionModalMessage}
            onUpgradePress={handleSubscription}
            onClose={() => setSubscriptionModalVisible(false)}
          />
        </ScrollView>

        {/* Sticky Bottom Actions */}
        <View style={styles.stickyBottomContainer}>
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => handleLikeUnlike(profile._id)}
          >
            <View style={styles.iconButton}>
              <FontAwesome
                name={isLiked(profile._id) ? 'heart' : 'heart-o'}
                size={22}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.iconText}>Like</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconContainer}
            onPress={handleInterestPress}
          >
            <View style={styles.iconButton}>
              <Icon
                name={
                  isInterestAccepted ||
                    isInterestReceived ||
                    isInterestSent
                    ? 'star'
                    : 'star-o'
                }
                size={22}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.iconText}>Interest</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContactInfoPress}
            style={styles.iconContainer}
          >
            <View style={styles.iconButton}>
              <Ionicons name="call-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.iconText}>Contact</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => handleCreateChat(profile._id)}
          >
            <View style={styles.iconButton}>
              <AntDesign name="message1" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.iconText}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 25,
    marginRight: SIZES.base,
    marginLeft: SIZES.base,
  },
  container: { flex: 1, backgroundColor: COLORS.white },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileImage: {
    width,
    height: IMAGE_HEIGHT,
    resizeMode: 'cover',
  },
  contactInfoContainer: {
    marginTop: 6,
    marginBottom: 10,
    gap: 4,
  },
  nameOverlayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    ...FONTS.body4,
    color: COLORS.white,
    marginLeft: 4,
  },
  contactPrivateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  contactPrivateText: {
    ...FONTS.body4,
    color: COLORS.white,
    marginLeft: 4,
  },

  overlayIcons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    zIndex: 2,
  },
  profileImageOverlay: {
    width: 40, // Adjust the size according to your requirement
    height: 40,
    borderRadius: 20, // To make it circular
    marginLeft: 10, // Add some space between back icon and image
    borderWidth: 2, // Optional, to add a border around the image
    borderColor: COLORS.white, // Optional, to match the border color
  },
  backIcon: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 5,
  },
  rightIcons: { flexDirection: 'row', alignItems: 'center' },
  imageCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 10,
  },
  imageCountText: { color: COLORS.white, marginLeft: 5, ...FONTS.body4 },
  threeDotIcon: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 5,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    alignItems: 'flex-start',
  },
  modalTitle: {
    ...FONTS.h3,
    color: COLORS.dark,
    marginBottom: 15,
    textAlign: 'center',
    alignSelf: 'center',
  },
  modalTextValue: {
    ...FONTS.body3,
    color: COLORS.dark,
    marginLeft: 10,
    flexShrink: 1,
  },
  contactRowModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },

  stickyOverlayHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: STICKY_OVERLAY_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    backgroundColor: COLORS.white,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backIconSticky: { borderRadius: 20, padding: 5 },
  rightIconsSticky: { flexDirection: 'row', alignItems: 'center' },
  leftIconsSticky: { flexDirection: 'row', alignItems: 'center' },
  nameSticky: { ...FONTS.h3, color: COLORS.dark, marginLeft: 10 },
  imageCountContainerSticky: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 10,
  },
  imageCountTextSticky: { color: COLORS.dark, marginLeft: 5, ...FONTS.body4 },
  threeDotIconSticky: { borderRadius: 20, padding: 5 },

  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.padding,
    paddingTop: 80,
    zIndex: 1,
  },

  nameOverlay: { ...FONTS.h2, color: COLORS.white },
  profileFor: {
    ...FONTS.body4,
    color: COLORS.white,
  },

  tabsContainerNonSticky: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tab: {
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding / 2,
    borderBottomWidth: 3,
  },
  tabText: { ...FONTS.h4 },

  stickyTabs: {
    position: 'absolute',
    top: STICKY_OVERLAY_HEIGHT,
    left: 0,
    right: 0,
    height: STICKY_TABS_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    zIndex: 5,
    elevation: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    paddingHorizontal: SIZES.padding,
  },

  section: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding - 4,
    marginVertical: SIZES.base,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius * 1.1,
    shadowColor: '#d8d8d8ff',
    shadowOpacity: 0.8,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.dark,
    marginBottom: SIZES.base,
    letterSpacing: 0.2,
  },
  detailText: {
    ...FONTS.body3,
    color: COLORS.dark,
    marginBottom: SIZES.base / 2,
  },
  detailItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.base,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SIZES.base,
  },
  detailIcon: {
    marginRight: SIZES.base * 1.2,
  },
  detailLabelText: {
    fontWeight: '600',
    color: COLORS.darkGray,
    ...FONTS.body4,
  },
  detailValueText: {
    ...FONTS.body4,
    color: COLORS.dark,
    flexShrink: 1,
    textAlign: 'right',
  },
  errorText: { color: COLORS.red, ...FONTS.body3 },
  scrollViewContent: { paddingBottom: 130 },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  optionsModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  optionsModalContent: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
    borderTopLeftRadius: SIZES.radius * 2,
    borderTopRightRadius: SIZES.radius * 2,
  },
  imagePrivacyModalContent: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },

  // Style for Block/Share Modal Options
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalOptionText: {
    ...FONTS.h3,
    color: COLORS.dark,
    marginLeft: SIZES.padding,
  },
  modalOptionIcon: { marginRight: SIZES.base },

  // Styles for NEW Image Privacy Modal
  imagePrivacyModalText: {
    ...FONTS.h3,
    color: COLORS.dark,
    marginBottom: SIZES.padding,
    textAlign: 'center',
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
  buttonText: { ...FONTS.h4, color: COLORS.white },
  stickyBottomContainer: {
    position: 'absolute',
    bottom: SIZES.base * 2,
    left: SIZES.padding,
    right: SIZES.padding,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 0,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius * 2,
    borderWidth: 1,
    borderColor: '#eaeaeaff',
    shadowColor: '#eaeaeaff',
    shadowOpacity: 0.9,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    zIndex: 50,
  },
  statusOverlayContainer: {
    marginLeft: 10,

  },
  iconContainer: {
    alignItems: 'center',
    flex: 1,
  },
  iconButton: {
    padding: 10,
    backgroundColor: 'rgba(181,7,42,0.10)',
    borderRadius: 18,
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(181,7,42,0.18)',
  },
  iconText: {
    ...FONTS.body5,
    color: COLORS.dark,
    marginTop: 5,
    textAlign: 'center',
    display: 'none',
  },
  matchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  matchPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  matchPercentageContainer: {
    alignItems: 'center',
  },
  matchPercentageText: {
    ...FONTS.h1,
    color: COLORS.primary,
  },
  matchText: {
    ...FONTS.body3,
    color: COLORS.darkGray,
  },
  matchedCriteriaContainer: {
    marginTop: SIZES.padding,
  },
  matchedCriteriaTitle: {
    ...FONTS.h3,
    color: COLORS.dark,
    marginBottom: SIZES.base,
  },
  matchedCriterion: {
    ...FONTS.body3,
    color: COLORS.darkGray,
    marginBottom: SIZES.base / 2,
  },
});

export default ProfileDetailScreen;
// end file marker
