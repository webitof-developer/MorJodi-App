import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Alert,

} from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import AntDesign from 'react-native-vector-icons/AntDesign';
import SubscriptionModal from '../components/SubscriptionModal';
import { API_BASE_URL } from '../constants/config';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import SkeletonList from '../components/SkeletonList';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileVisitorsScreen = ({ navigation }) => {
  const { token } = useSelector(state => state.auth);
  console.log(token)
  const { subscription } = useSelector(state => state.subscription);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [subscriptionModalMessage, setSubscriptionModalMessage] = useState('');

  useEffect(() => {
    const fetchProfileVisitors = async () => {
      try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(
          `${API_BASE_URL}/api/user/viewers`,
          config,
        );
        console.log('Profile Visitors Response:', response.data);
        setVisitors(response.data.viewers);
      } catch (err) {
        // //console.error("Error fetching profile visitors:", err);
        setError('Failed to load profile visitors.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProfileVisitors();
    }
  }, [token]);
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
          res.data.message ||
          `This profile is private. Upgrade your plan to unlock ${item.fullName}.`
        );
        setSubscriptionModalVisible(true);
        return;
      }

      // ⛔ LIMIT REACHED
      if (res?.data?.code === "LIMIT_REACHED") {
        setSubscriptionModalMessage(
          res.data.message ||
          "You have reached your daily profile view limit. Upgrade to continue."
        );
        setSubscriptionModalVisible(true);
        return;
      }

      alert(res?.data?.message || "Unable to open profile. Please try again.");
    }
  };
  ;


  const renderVisitorItem = ({ item }) => (
    <TouchableOpacity
      style={styles.visitorCard}
      onPress={() => openProfile(item)}
      activeOpacity={0.8}
    >
      <Image
        source={
          item?.photos?.length > 0
            ? { uri: item.photos[0] }
            : require('../assets/plaseholder.png')
        }
        style={styles.visitorImage}
      />

      <View style={styles.visitorInfo}>
        <Text style={styles.visitorName}>{item.fullName}</Text>
        <Text style={styles.visitorDetails}>
          {calculateAge(item.dateOfBirth)} yrs, {item.religion?.name}
        </Text>
        <Text style={styles.visitorDetails}>
          {item.location?.city || '-'}, {item.location?.state || '-'}
        </Text>
      </View>
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
        {visitors.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.noDataText}>
              No one has viewed your profile yet.
            </Text>
          </View>
        ) : (
          <FlatList
            data={visitors}
            renderItem={renderVisitorItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
          />
        )}
        <SubscriptionModal
          visible={subscriptionModalVisible}
          message={subscriptionModalMessage}
          onClose={() => setSubscriptionModalVisible(false)}
          onUpgradePress={() => {
            setSubscriptionModalVisible(false);
            navigation.navigate('App', {
              screen: 'HomeTabs',
              params: {
                screen: 'Upgrade'
              }
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
    textAlign: 'center',
    marginTop: 20,
  },
  listContent: {
    paddingVertical: 10,
    flexGrow: 1
  },
  visitorCard: {
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
  visitorImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
    backgroundColor: COLORS.gray,
  },
  visitorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  visitorName: {
    ...FONTS.body4,
    color: COLORS.black,
    fontWeight: '600',
    marginBottom: 2,
  },
  visitorDetails: {
    fontSize: 11,
    color: COLORS.gray,
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

export default ProfileVisitorsScreen;
