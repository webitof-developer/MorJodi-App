import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import i18n from '../localization/i18n';

import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { API_BASE_URL } from '../constants/config';

import { useInterest } from '../contexts/InterestContext';
import SubscriptionModal from '../components/SubscriptionModal';
import AwesomeAlert from '../components/AwesomeAlert';
import SkeletonList from '../components/SkeletonList';
import { SafeAreaView } from 'react-native-safe-area-context';

const Tab = createMaterialTopTabNavigator();

// ------------------- UTILS -------------------
const calculateAge = (dob) => {
  if (!dob) return '-';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

// ------------------- INTEREST CARD -------------------
const InterestCard = ({ item, type, openProfile, acceptInterest, declineInterest }) => {
  const {
    sendInterest,
    unsendInterest,
    removeAcceptedInterest,
    getInterestStatus,
  } = useInterest();

  // ── AwesomeAlert state (same pattern as MatchCard) ──
  const [alertState, setAlertState] = useState({
    show: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    confirmButtonColor: COLORS.primary,
    onConfirm: () => { },
  });

  const showAlert = (opts) => setAlertState({ show: true, ...opts });
  const dismissAlert = () => setAlertState(prev => ({ ...prev, show: false }));

  const profile = type === 'sent' ? item.receiverId : item.senderId;

  // ✅ Null-safe fullName
  const displayName = profile?.fullName || 'Unknown';

  // 🧠 Live interest status
  const status = getInterestStatus(profile?._id);
  const { type: relationType, status: st, interestId } = status;

  const handleInterestAction = () => {
    // 1️⃣ No interest → SEND
    if (relationType === 'none') {
      sendInterest(profile._id);
      return;
    }

    // 2️⃣ SENT & pending → UNSEND
    if (relationType === 'sent' && st === 'pending') {
      showAlert({
        title: i18n.t('unsend_interest_title'),
        message: i18n.t('unsend_interest_message'),
        confirmText: i18n.t('common.unsend'),
        cancelText: i18n.t('common.cancel'),
        confirmButtonColor: COLORS.danger,
        onConfirm: () => { dismissAlert(); unsendInterest(interestId); },
      });
      return;
    }

    // 3️⃣ RECEIVED & pending → ACCEPT
    if (relationType === 'received' && st === 'pending') {
      showAlert({
        title: i18n.t('interest.actions.respond') || 'Respond',
        message: i18n.t('interest.actions.respondMessage') || 'Accept this interest request?',
        confirmText: i18n.t('interest.actions.accept') || 'Accept',
        cancelText: i18n.t('common.cancel'),
        confirmButtonColor: COLORS.primary,
        onConfirm: () => { dismissAlert(); acceptInterest(item._id); },
      });
      return;
    }

    // 4️⃣ ACCEPTED → REMOVE
    if (st === 'accepted') {
      showAlert({
        title: i18n.t('interest.actions.removeTitle') || 'Remove Interest?',
        message: i18n.t('interest.actions.removeMessage') || 'This will remove the mutual accepted interest.',
        confirmText: i18n.t('interest.actions.remove') || 'Remove',
        cancelText: i18n.t('common.cancel'),
        confirmButtonColor: COLORS.danger,
        onConfirm: () => { dismissAlert(); removeAcceptedInterest(interestId); },
      });
      return;
    }

    // 5️⃣ DECLINED → RESEND
    if (st === 'declined') {
      showAlert({
        title: i18n.t('interest.actions.sendAgainTitle') || 'Send Again?',
        message: i18n.t('interest.actions.sendAgainMessage') || 'This user declined earlier. Send again?',
        confirmText: i18n.t('interest.actions.sendAgain') || 'Send',
        cancelText: i18n.t('common.cancel'),
        confirmButtonColor: COLORS.primary,
        onConfirm: () => { dismissAlert(); sendInterest(profile._id); },
      });
      return;
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={() => openProfile(profile)}
        activeOpacity={0.8}
      >
        <Image
          source={
            profile?.photos?.[0]
              ? { uri: profile.photos[0] }
              : require('../assets/plaseholder.png')
          }
          style={styles.profileImage}
        />

        <View style={styles.infoContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.details}>
                {calculateAge(profile?.dateOfBirth)} yrs, {profile?.location?.city || '-'}
              </Text>
            </View>
          </View>

          {/* ACTIONS */}
          <View style={{ marginTop: 8 }}>
            {type === 'sent' ? (
              // ── Sent tab: single action button ──
              <TouchableOpacity
                onPress={handleInterestAction}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor:
                      item.status === 'accepted'
                        ? COLORS.primary
                        : item.status === 'declined'
                          ? COLORS.danger
                          : COLORS.redbg,
                  },
                ]}
              >
                <Text style={[
                  styles.actionText,
                  item.status === 'pending' && { color: COLORS.black },
                ]}>
                  {item.status === 'pending'
                    ? i18n.t('interest.actions.unsend')
                    : item.status === 'accepted'
                      ? i18n.t('interest.actions.remove')
                      : item.status === 'declined'
                        ? i18n.t('interest.actions.sendAgain')
                        : item.status}
                </Text>
              </TouchableOpacity>
            ) : (
              // ── Received tab ──
              <View style={styles.actionRow}>
                {item.status === 'pending' ? (
                  <>
                    {/* Accept */}
                    <TouchableOpacity
                      onPress={() => showAlert({
                        title: i18n.t('interest.actions.acceptTitle') || 'Accept Interest',
                        message: i18n.t('interest.actions.acceptMessage') || 'Accept this interest?',
                        confirmText: i18n.t('interest.actions.accept') || 'Accept',
                        cancelText: i18n.t('common.cancel'),
                        confirmButtonColor: COLORS.primary,
                        onConfirm: () => { dismissAlert(); acceptInterest(item._id); },
                      })}
                      style={[styles.actionButton, { backgroundColor: COLORS.primary, flex: 1, marginRight: 8 }]}
                    >
                      <Text style={styles.actionText}>
                        {i18n.t('interest.actions.accept') || 'Accept'}
                      </Text>
                    </TouchableOpacity>

                    {/* Decline */}
                    <TouchableOpacity
                      onPress={() => showAlert({
                        title: i18n.t('interest.actions.declineTitle') || 'Decline Interest',
                        message: i18n.t('interest.actions.declineMessage') || 'Decline this interest?',
                        confirmText: i18n.t('interest.actions.decline') || 'Decline',
                        cancelText: i18n.t('common.cancel'),
                        confirmButtonColor: COLORS.danger,
                        onConfirm: () => { dismissAlert(); declineInterest(item._id); },
                      })}
                      style={[styles.actionButton, { backgroundColor: COLORS.redbg, flex: 1 }]}
                    >
                      <Text style={[styles.actionText, { color: COLORS.danger }]}>
                        {i18n.t('interest.actions.decline') || 'Decline'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  // Accepted / Declined state in received tab
                  <TouchableOpacity
                    onPress={handleInterestAction}
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor:
                          item.status === 'accepted'
                            ? COLORS.primary
                            : item.status === 'declined'
                              ? COLORS.danger
                              : COLORS.lightGray,
                      },
                    ]}
                  >
                    <Text style={styles.actionText}>
                      {item.status === 'accepted'
                        ? i18n.t('interest.actions.remove') || 'Remove'
                        : item.status === 'declined'
                          ? i18n.t('interest.actions.sendAgain') || 'Send Again'
                          : item.status}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* ── AwesomeAlert: same custom modal as MatchCard ── */}
      <AwesomeAlert
        show={alertState.show}
        showProgress={false}
        title={alertState.title}
        message={alertState.message}
        closeOnTouchOutside
        closeOnHardwareBackPress={false}
        showCancelButton
        showConfirmButton
        cancelText={alertState.cancelText}
        confirmText={alertState.confirmText}
        confirmButtonColor={alertState.confirmButtonColor}
        onCancelPressed={dismissAlert}
        onConfirmPressed={alertState.onConfirm}
        titleStyle={{ fontSize: 17, fontWeight: 'bold' }}
        messageStyle={{ fontSize: 14, textAlign: 'center' }}
      />
    </>
  );
};


// ------------------- RECEIVED TAB -------------------
const ReceivedTab = () => {
  const navigation = useNavigation();
  const { token } = useSelector((s) => s.auth);
  const {
    receivedInterests,
    acceptInterest,
    declineInterest,
  } = useInterest();

  const [subscriptionVisible, setSubscriptionVisible] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');

  const openProfile = async (profile) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/user/view/${profile._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        navigation.navigate('ProfileDetailScreen', {
          profileId: profile._id,
          item: profile,
        });
      }
    } catch (error) {
      const data = error?.response?.data;
      if (data?.code === 'PRIVATE_PROFILE') {
        setSubscriptionMessage(i18n.t('profile.private', { name: profile?.fullName || '' }));
        setSubscriptionVisible(true);
        return;
      }
      if (data?.code === 'LIMIT_REACHED') {
        setSubscriptionMessage(i18n.t('profile.limitReached'));
        setSubscriptionVisible(true);
        return;
      }
    }
  };

  if (!receivedInterests) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f6f6fb' }}>
        <SkeletonList count={8} />
      </View>
    );
  }

  if (receivedInterests.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="star-outline" size={60} color={COLORS.gray} />
        <Text style={styles.emptyText}>{i18n.t('interest.empty.received')}</Text>
      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <FlatList
          data={receivedInterests}
          keyExtractor={(i) => i._id}
          renderItem={({ item }) => (
            <InterestCard
              item={item}
              type="received"
              openProfile={openProfile}
              acceptInterest={acceptInterest}
              declineInterest={declineInterest}
            />
          )}
          contentContainerStyle={{ paddingVertical: 10, backgroundColor: '#f6f6fb', flexGrow: 1 }}
        />
      </SafeAreaView>

      <SubscriptionModal
        visible={subscriptionVisible}
        message={subscriptionMessage}
        onClose={() => setSubscriptionVisible(false)}
        onUpgradePress={() => {
          setSubscriptionVisible(false);
          navigation.navigate('HomeTabs', { screen: 'Upgrade' });
        }}
      />
    </>
  );
};

// ------------------- SENT TAB -------------------
const SentTab = () => {
  const navigation = useNavigation();
  const { token } = useSelector((s) => s.auth);
  const { sentInterests } = useInterest();

  const [subscriptionVisible, setSubscriptionVisible] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');

  const openProfile = async (profile) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/user/view/${profile._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        navigation.navigate('ProfileDetailScreen', {
          profileId: profile._id,
          item: profile,
        });
      }
    } catch (error) {
      const data = error?.response?.data;
      if (data?.code === 'PRIVATE_PROFILE') {
        setSubscriptionMessage(i18n.t('profile.private', { name: profile?.fullName || '' }));
        setSubscriptionVisible(true);
        return;
      }
      if (data?.code === 'LIMIT_REACHED') {
        setSubscriptionMessage(i18n.t('profile.limitReached'));
        setSubscriptionVisible(true);
        return;
      }
    }
  };

  if (!sentInterests) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f6f6fb' }}>
        <SkeletonList count={8} />
      </View>
    );
  }

  if (sentInterests.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="star-outline" size={60} color={COLORS.gray} />
        <Text style={styles.emptyText}>{i18n.t('interest.empty.sent')}</Text>
      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <FlatList
          data={sentInterests}
          keyExtractor={(i) => i._id}
          renderItem={({ item }) => (
            <InterestCard item={item} type="sent" openProfile={openProfile} />
          )}
          contentContainerStyle={{ paddingVertical: 10, backgroundColor: '#f6f6fb', flexGrow: 1 }}
        />
      </SafeAreaView>

      <SubscriptionModal
        visible={subscriptionVisible}
        message={subscriptionMessage}
        onClose={() => setSubscriptionVisible(false)}
        onUpgradePress={() => {
          setSubscriptionVisible(false);
          navigation.navigate('HomeTabs', { screen: 'Upgrade' });
        }}
      />
    </>
  );
};

// ------------------- MAIN SCREEN -------------------
const InterestRequestsScreen = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarLabelStyle: { ...FONTS.h3, textTransform: 'none' },
        tabBarIndicatorStyle: { backgroundColor: COLORS.primary, height: 3 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.darkGray,
        tabBarStyle: { backgroundColor: COLORS.white },
      }}
    >
      <Tab.Screen name="Received" component={ReceivedTab} />
      <Tab.Screen name="Sent" component={SentTab} />
    </Tab.Navigator>
  );
};

export default InterestRequestsScreen;

// ------------------- STYLES -------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6fb',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: SIZES.padding,
    marginHorizontal: SIZES.padding,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
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
    color: COLORS.black,
    fontWeight: '600',
    marginBottom: 2,
  },
  details: {
    fontSize: 11,
    color: COLORS.gray,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 0,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  actionText: {
    color: COLORS.white,
    ...FONTS.body5,
    fontWeight: '600',
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...FONTS.body3,
    color: COLORS.darkGray,
    marginTop: 10,
  },
});
