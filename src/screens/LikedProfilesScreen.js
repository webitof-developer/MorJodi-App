import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useLike } from '../contexts/LikeContext';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../constants/config';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import SubscriptionModal from '../components/SubscriptionModal';
import SkeletonList from '../components/SkeletonList';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../localization/i18n';

const INTERACTIONS_API_URL = `${API_BASE_URL}/api/interactions`;

const LikedProfilesScreen = ({ }) => {
  const navigation = useNavigation();
  const { fetchLikedProfiles, unlikeProfile } = useLike();
  const { token } = useSelector(state => state.auth);
  const { subscription } = useSelector(state => state.subscription);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [subscriptionModalVisible, setSubscriptionModalVisible] =
    useState(false);
  const [subscriptionModalMessage, setSubscriptionModalMessage] = useState('');

  const authAxios = axios.create({
    baseURL: INTERACTIONS_API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const getFullLikedProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAxios.get('/liked');
      console.log('Full Liked Profiles Response:', response.data);
      setProfiles(response.data);
    } catch (err) {
      // //console.error('Error fetching full liked profiles:', err);
      setError(i18n.t('likedProfiles.errorLoad'));

    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLikedProfiles();
      getFullLikedProfiles();
    }, [token]),
  );

  const handleUnlike = async profileId => {
    const success = await unlikeProfile(profileId);
    if (success) {
      setProfiles(prev => prev.filter(p => p._id !== profileId));
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

  // Function to open profile detail or show modal based on subscription status
  const openProfile = async (item) => {
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

      // 🔒 PRIVATE PROFILE (same behaviour as HomeProfileCard)
      if (res?.data?.code === "PRIVATE_PROFILE") {
        setSubscriptionModalMessage(

          i18n.t('likedProfiles.subscription.privateProfile', {
            name: item.fullName,
          })
        );
        setSubscriptionModalVisible(true);
        return;
      }

      // ⛔ LIMIT REACHED
      if (res?.data?.code === "LIMIT_REACHED") {
        setSubscriptionModalMessage(

          i18n.t('likedProfiles.subscription.limitReached')
        );

        setSubscriptionModalVisible(true);
        return;
      }

      alert(
        res?.data?.message ||
        i18n.t('likedProfiles.alerts.openProfileFailed')
      );

    }
  };



  const renderProfileCard = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openProfile(item)}>
      <Image
        source={
          item?.photos?.[0]
            ? { uri: item.photos[0] }
            : require('../assets/plaseholder.png')
        }
        style={styles.profileImage}
      />

      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.fullName}</Text>
        <Text style={styles.details}>
          {calculateAge(item.dateOfBirth)} yrs, {item.religion?.name || '-'}
        </Text>
        <Text style={styles.details}>
          {item.location?.city || '-'}, {item.location?.state || '-'}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => handleUnlike(item._id)}
        style={styles.actionButton}
      >
        <AntDesign name="heart" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f6f6fb' }}>
        <SkeletonList count={8} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {profiles.length === 0 ? (
          <View style={styles.centered}>
            <AntDesign name="hearto" size={60} color={COLORS.gray} />
            <Text style={styles.noDataText}>
              {i18n.t('likedProfiles.empty.title')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={profiles}
            keyExtractor={item => item._id}
            renderItem={renderProfileCard}
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* Subscription modal */}
        <SubscriptionModal
          visible={subscriptionModalVisible}
          message={subscriptionModalMessage}
          onClose={() => setSubscriptionModalVisible(false)}
          onUpgradePress={() => {
            setSubscriptionModalVisible(false);
            navigation.navigate('App', {
              screen: 'HomeTabs',
              params: {
                screen: 'Upgrade',
              },
            });
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6fb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...FONTS.body3,
    color: COLORS.red,
  },
  noDataText: {
    ...FONTS.h3,
    color: COLORS.darkGray,
    marginTop: 10,
  },
  listContent: {
    paddingVertical: 10,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: SIZES.padding,
    marginHorizontal: SIZES.padding,
    marginBottom: 8,
    borderRadius: 12,
    // Soft Shadow
    shadowColor: '#ffffffff', // Using the custom shadow color from requirements
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
    backgroundColor: COLORS.gray,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    ...FONTS.body4, // matching visitor name style (was h3)
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  details: {
    fontSize: 11,
    color: COLORS.gray,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#fff0f0', // Light reddish bg for unlike button
    borderRadius: 20,
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
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
    top: 10,
    right: 10,
  },
  buttonText: {
    color: COLORS.white,
    ...FONTS.body3,
  },
});

export default LikedProfilesScreen;
