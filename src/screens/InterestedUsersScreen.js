import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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

// ------------------- CARD COMPONENT -------------------
const InterestCard = ({ item, type, openProfile, acceptInterest, declineInterest }) => {
  const {
    sendInterest,
    unsendInterest,
    removeAcceptedInterest,
    getInterestStatus
  } = useInterest();

  const profile = type === "sent" ? item.receiverId : item.senderId;

  // 🧠 Get live status like MatchCard
  const status = getInterestStatus(profile?._id);
  const { type: relationType, status: st, interestId } = status;

  const handleInterestAction = () => {
    // 1️⃣ No interest → SEND
    if (relationType === "none") {
      sendInterest(profile._id);
      return;
    }

    // 2️⃣ SENT & pending → UNSEND
    if (relationType === "sent" && st === "pending") {
      Alert.alert(i18n.t("unsend_interest_title"), i18n.t("unsend_interest_message"), [
        { text: i18n.t("common.cancel"), style: "cancel" },
        { text: i18n.t("common.unsend"), onPress: () => unsendInterest(interestId) }
      ]);
      return;
    }

    // 3️⃣ RECEIVED & pending → ACCEPT / DECLINE
    if (relationType === "received" && st === "pending") {
      Alert.alert("Respond", "How do you want to respond?", [
        { text: "Cancel", style: "cancel" },
        { text: "Accept", onPress: () => acceptInterest(item._id) },
        {
          text: "Decline",
          style: "destructive",
          onPress: () => declineInterest(item._id)
        }
      ]);
      return;
    }

    // 4️⃣ ACCEPTED → REMOVE INTEREST
    if (st === "accepted") {
      Alert.alert(
        "Remove Interest?",
        "This will remove the mutual accepted interest.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => removeAcceptedInterest(interestId)
          }
        ]
      );
      return;
    }

    // 5️⃣ DECLINED → ALLOW RESEND
    if (st === "declined") {
      Alert.alert("Send Again?", "This user declined earlier. Send again?", [
        { text: "Cancel", style: "cancel" },
        { text: "Send", onPress: () => sendInterest(profile._id) }
      ]);
      return;
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openProfile(profile)}
      activeOpacity={0.8}
    >
      <Image
        source={
          profile?.photos?.[0]
            ? { uri: profile.photos[0] }
            : require("../assets/plaseholder.png")
        }
        style={styles.profileImage}
      />

      <View style={styles.infoContainer}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile.fullName}</Text>
            <Text style={styles.details}>
              {calculateAge(profile.dateOfBirth)} yrs, {profile.location?.city || "-"}
            </Text>
          </View>
        </View>

        {/* ACTIONS */}
        <View style={{ marginTop: 8 }}>
          {type === "sent" ? (
            <TouchableOpacity
              onPress={handleInterestAction}
              style={[
                styles.actionButton,
                {
                  backgroundColor:
                    item.status === "accepted"
                      ? COLORS.primary
                      : item.status === "declined"
                        ? COLORS.danger
                        : COLORS.redbg // Light gray for default
                }
              ]}
            >
              <Text style={[
                styles.actionText,
                item.status === "pending" && { color: COLORS.black } // Dark text for light bg
              ]}>
                {item.status === "pending"
                  ? i18n.t('interest.actions.unsend')
                  : item.status === "accepted"
                    ? i18n.t('interest.actions.remove')
                    : item.status === "declined"
                      ? i18n.t('interest.actions.sendAgain')
                      : item.status}
              </Text>

            </TouchableOpacity>
          ) : (
            <View style={styles.actionRow}>
              {item.status === "pending" ? (
                <>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert("Confirm", "Accept this interest?", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Accept", onPress: () => acceptInterest(item._id) }
                      ])
                    }
                    style={[styles.actionButton, { backgroundColor: COLORS.primary, flex: 1, marginRight: 8 }]}
                  >
                    <Text style={styles.actionText}>Accept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert("Confirm", "Decline this interest?", [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Decline",
                          style: "destructive",
                          onPress: () => declineInterest(item._id)
                        }
                      ])
                    }
                    style={[styles.actionButton, { backgroundColor: COLORS.redbg, flex: 1 }]}
                  >
                    <Text style={[styles.actionText, { color: COLORS.danger }]}>Decline</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={handleInterestAction}
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor:
                        item.status === "accepted"
                          ? COLORS.primary
                          : item.status === "declined"
                            ? COLORS.danger
                            : COLORS.lightGray
                    }
                  ]}
                >
                  <Text style={styles.actionText}>
                    {item.status === "accepted"
                      ? "Remove"
                      : item.status === "declined"
                        ? "Send Again"
                        : item.status}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
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
  console.log("Received Interests → ", receivedInterests);
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
        navigation.navigate("ProfileDetailScreen", {
          profileId: profile._id,
          item: profile,
        });
        return;
      }
    } catch (error) {
      const data = error?.response?.data;

      // 🚫 PRIVATE PROFILE
      if (data?.code === "PRIVATE_PROFILE") {
        setSubscriptionMessage(

          i18n.t('profile.private', { name: profile.fullName })
        );
        setSubscriptionVisible(true);
        return;
      }

      // 🚫 LIMIT REACHED
      if (data?.code === "LIMIT_REACHED") {
        setSubscriptionMessage(
          i18n.t('profile.limitReached')
        );
        setSubscriptionVisible(true);
        return;
      }

      Alert.alert(
        i18n.t('common.error'),
        i18n.t('profile.openError')
      );
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
        <Text style={styles.emptyText}>
          {i18n.t('interest.empty.received')}
        </Text>

      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
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
  console.log("Sent Interests → ", sentInterests);

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
        navigation.navigate("ProfileDetailScreen", {
          profileId: profile._id,
          item: profile,
        });
        return;
      }
    } catch (error) {
      const data = error?.response?.data;

      // 🚫 PRIVATE PROFILE
      if (data?.code === "PRIVATE_PROFILE") {
        setSubscriptionMessage(

          i18n.t('profile.private', { name: profile.fullName })
        );
        setSubscriptionVisible(true);
        return;
      }

      // 🚫 LIMIT REACHED
      if (data?.code === "LIMIT_REACHED") {
        setSubscriptionMessage(
          i18n.t('profile.limitReached')
        );
        setSubscriptionVisible(true);
        return;
      }

      Alert.alert(
        i18n.t('common.error'),
        i18n.t('profile.openError')
      );
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
        <Text style={styles.emptyText}>
          {i18n.t('interest.empty.sent')}
        </Text>

      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
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
          navigation.navigate('App', {
            screen: 'HomeTabs',
            params: {
              screen: 'Upgrade'
            }
          });
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
    alignItems: 'flex-start', // Align to top
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: SIZES.padding,
    marginHorizontal: SIZES.padding, // Margin instead of container padding
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
    width: 44, // Smaller image like notification icon
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
    ...FONTS.body4, // Slightly smaller/regular font to look like "User sent a request"
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
    marginTop: 0, // No extra margin needed if flexed
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
    ...FONTS.body5, // Smaller text for buttons
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
