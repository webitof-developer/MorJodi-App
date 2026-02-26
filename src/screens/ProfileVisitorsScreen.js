import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
  TouchableOpacity,
  RefreshControl,

} from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SubscriptionModal from '../components/SubscriptionModal';
import { API_BASE_URL } from '../constants/config';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import SkeletonList from '../components/SkeletonList';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileActions } from '../contexts/ProfileActionsContext';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const calculateAge = (dob) => {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

// ─────────────────────────────────────────────────────────────────────────────
// Visitor Card
// ─────────────────────────────────────────────────────────────────────────────
const VisitorCard = ({ item, onPress }) => {
  const age = calculateAge(item.dateOfBirth);
  const city = item.location?.city || '';
  const state = item.location?.state || '';
  const location = [city, state].filter(Boolean).join(', ');
  const profession = item.profession?.title || '';
  const religion = item.religion?.name || '';
  const caste = item.caste?.name || '';

  const subParts = [
    age != null ? `${age} yrs` : null,
    religion,
    caste,
    profession,
  ].filter(Boolean);

  return (
    <TouchableOpacity style={styles.visitorCard} onPress={onPress} activeOpacity={0.8}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <Image
          source={
            item?.photos?.length > 0
              ? { uri: item.photos[0] }
              : require('../assets/plaseholder.png')
          }
          style={styles.avatar}
        />
        {item.isPremium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={8} color="#fff" />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoWrap}>
        <View style={styles.nameRow}>
          <Text style={styles.visitorName} numberOfLines={1}>{item.fullName}</Text>
          {item.isPremium && (
            <View style={styles.premiumPill}>
              <Text style={styles.premiumPillText}>Premium</Text>
            </View>
          )}
        </View>

        {subParts.length > 0 && (
          <Text style={styles.subText} numberOfLines={1}>{subParts.join(' · ')}</Text>
        )}

        {location ? (
          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={11} color={COLORS.gray} />
            <Text style={styles.locText} numberOfLines={1}>{location}</Text>
          </View>
        ) : null}
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
const ProfileVisitorsScreen = ({ navigation }) => {
  const { token } = useSelector((state) => state.auth);

  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [totalUnique, setTotalUnique] = useState(0);
  // ProfileActionsContext — gate check + openProfileById (same as MessageScreen)
  const {
    openProfileById,
    handleViewVisitors,
    subscriptionModalVisible,
    subscriptionModalMessage,
    setSubscriptionModalVisible,
    handleSubscriptionUpgrade,
  } = useProfileActions(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch
  // ─────────────────────────────────────────────────────────────────────────
  const fetchVisitors = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE_URL}/api/user/viewers`, config);
      const list = response.data?.viewers || [];
      setVisitors(list);
      setTotalUnique(response.data?.totalUnique ?? list.length);
    } catch (err) {
      setError('Failed to load profile visitors. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    // Check access gate first — only fetch visitors if access is granted.
    // If limit/no-access, the hook already shows SubscriptionModal; go back.
    handleViewVisitors().then((granted) => {
      if (granted) {
        fetchVisitors();
      } else {
        // Gate denied — go back so user isn't stuck on a blank screen
        navigation.goBack();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVisitors();
  }, [fetchVisitors]);

  // Use context openProfileById — handles PRIVATE_PROFILE / LIMIT_REACHED via SubscriptionModal
  const openProfileWithGate = useCallback(
    (item) => openProfileById(item),
    [openProfileById],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        <View style={{ flex: 1, backgroundColor: '#f6f6fb' }}>
          <SkeletonList count={8} />
        </View>
        <SubscriptionModal
          visible={subscriptionModalVisible}
          message={subscriptionModalMessage}
          onClose={() => setSubscriptionModalVisible(false)}
          onUpgradePress={handleSubscriptionUpgrade}
        />
      </SafeAreaView>
    );
  }

  // function renderHeader() {
  //   return (
  //     <View style={styles.header}>
  //       <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
  //         <Ionicons name="arrow-back" size={22} color={COLORS.black} />
  //       </TouchableOpacity>
  //       <View>
  //         <Text style={styles.headerTitle}>Profile Visitors</Text>
  //         {totalUnique > 0 && (
  //           <Text style={styles.headerSub}>{totalUnique} unique viewer{totalUnique !== 1 ? 's' : ''}</Text>
  //         )}
  //       </View>
  //       <View style={{ width: 36 }} />
  //     </View>
  //   );
  // }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={56} color={COLORS.gray + '80'} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchVisitors}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <SubscriptionModal
          visible={subscriptionModalVisible}
          message={subscriptionModalMessage}
          onClose={() => setSubscriptionModalVisible(false)}
          onUpgradePress={handleSubscriptionUpgrade}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>


      {visitors.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="eye-off-outline" size={64} color={COLORS.gray + '80'} />
          <Text style={styles.noDataText}>No one has viewed your profile yet.</Text>
          <Text style={styles.noDataSub}>
            Complete your profile and stay active to attract visitors!
          </Text>
        </View>
      ) : (
        <FlatList
          data={visitors}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <VisitorCard
              item={item}
              onPress={() => openProfileWithGate(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      )}

      <SubscriptionModal
        visible={subscriptionModalVisible}
        message={subscriptionModalMessage}
        onClose={() => setSubscriptionModalVisible(false)}
        onUpgradePress={handleSubscriptionUpgrade}
      />
    </SafeAreaView>
  );
};

export default ProfileVisitorsScreen;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.black,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 2,
  },

  // List
  listContent: {
    paddingVertical: 10,
    paddingBottom: 30,
    flexGrow: 1,
    backgroundColor: '#f6f6fb',
  },

  // Visitor Card
  visitorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: SIZES.padding,
    marginHorizontal: SIZES.padding,
    marginBottom: 8,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.gray + '40',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#FFA000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  infoWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  visitorName: {
    ...FONTS.body4,
    fontWeight: '700',
    color: COLORS.black,
    flexShrink: 1,
  },
  premiumPill: {
    backgroundColor: '#FFF3CD',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  premiumPillText: {
    fontSize: 9,
    color: '#856404',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locText: {
    fontSize: 11,
    color: COLORS.gray,
    flexShrink: 1,
  },

  // Empty / Error
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#f6f6fb',
  },
  noDataText: {
    ...FONTS.h3,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: 16,
  },
  noDataSub: {
    ...FONTS.body4,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  errorText: {
    ...FONTS.body3,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 16,
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
});
