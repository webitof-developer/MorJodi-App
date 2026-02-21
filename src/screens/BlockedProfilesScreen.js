import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useBlock } from '../contexts/BlockContext';
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import Icon from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import SubscriptionModal from '../components/SubscriptionModal';
import SkeletonList from '../components/SkeletonList';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../localization/i18n';

const INTERACTIONS_API_URL = `${API_BASE_URL}/api/interactions`;

const BlockedProfilesScreen = () => {
  const { token } = useSelector(state => state.auth);
  const { unblockProfile, blockedProfiles, fetchBlockedProfiles } = useBlock();
  const { subscription } = useSelector(state => state.subscription);
  const navigation = useNavigation();
  const [subscriptionModalVisible, setSubscriptionModalVisible] =
    useState(false);
  const [subscriptionModalMessage, setSubscriptionModalMessage] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const authAxios = axios.create({
    baseURL: INTERACTIONS_API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  useFocusEffect(
    useCallback(() => {
      fetchBlockedProfilesList();
    }, [blockedProfiles]),
  );

  // ✅ Fetch detailed blocked profiles
  const fetchBlockedProfilesList = async () => {
    try {
      setLoading(true);
      const res = await authAxios.get('/blocked');
      setProfiles(res.data);
    } catch (err) {
      // console.log("❌ Error fetching blocked profiles:", err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleSubscription = () => {
    navigation.navigate('App', {
      screen: 'HomeTabs',
      params: { screen: 'Upgrade' },
    });
    setModalVisible(false);
  };
  // ✅ Unblock confirmation
  const handleUnblock = (id, name) => {
    Alert.alert(
      i18n.t('blockedProfiles.unblock.title'),
      i18n.t('blockedProfiles.unblock.confirm', { name }),
      [
        {
          text: i18n.t('blockedProfiles.unblock.cancel'),
          style: 'cancel',
        },
        {
          text: i18n.t('blockedProfiles.unblock.action'),
          style: 'destructive',
          onPress: async () => {
            await unblockProfile(id);
            fetchBlockedProfilesList();
          },
        },
      ],
    );

  };

  // ✅ Calculate Age
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

  // ✅ Open Profile or show modal (same logic as liked screen)
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

          i18n.t('profile.private', { name: item.fullName })

        );
        setSubscriptionModalVisible(true);
        return;
      }

      // ⛔ LIMIT REACHED
      if (res?.data?.code === "LIMIT_REACHED") {
        setSubscriptionModalMessage(

          i18n.t('profile.limitReached')

        );
        setSubscriptionModalVisible(true);
        return;
      }

      alert(i18n.t('profile.openError'));

    }
  };

  // ✅ Loader
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f6f6fb' }}>
        <SkeletonList count={8} />
      </View>
    );
  }

  // ✅ Empty state
  if (profiles.length === 0) {
    return (
      <View style={styles.centered}>
        <Icon name="ban" size={60} color={COLORS.gray} />
        <Text style={{ fontSize: 16, color: '#555', marginTop: 10 }}>
          {i18n.t('blockedProfiles.empty')}
        </Text>
      </View>
    );
  }

  // ✅ Render Profile Card
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
        <Text style={styles.name}>{item.fullName || 'Unknown'}</Text>
        <Text style={styles.details}>
          {calculateAge(item.dateOfBirth)} yrs, {item.religion?.name || '-'}
        </Text>
        <Text style={styles.details}>
          {item.location?.city || '-'}, {item.location?.state || '-'}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => handleUnblock(item._id, item.fullName)}
        style={styles.actionButton}
      >
        <Text style={styles.actionText}>{i18n.t('blockedProfiles.unblock.action')}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <FlatList
          data={profiles}
          keyExtractor={item => item._id}
          renderItem={renderProfileCard}
          contentContainerStyle={styles.listContent}
        />

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
    shadowColor: '#ffffffff',
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
    ...FONTS.body4,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  details: {
    fontSize: 11,
    color: COLORS.gray,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    marginLeft: 10,
  },
  actionText: {
    ...FONTS.body5,
    color: COLORS.white,
    fontWeight: '600',
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

export default BlockedProfilesScreen;
