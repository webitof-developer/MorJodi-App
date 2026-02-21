import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
 Share
} from 'react-native';
import axios from 'axios';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { API_BASE_URL } from '../constants/config';
import moment from 'moment';
import i18n from '../localization/i18n';

const ReferralScreen = () => {
  const { token } = useSelector(state => state.auth);
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/user/referral-data`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        // console.log("Referral Data:", response.data);

        setReferralCode(response.data.referralCode || '');
        setReferrals(response.data.referredUsers || []);
      } catch (error) {
        // //console.error("Error fetching referral data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, [token]);

const handleShare = async () => {
  if (!referralCode) return;

  try {
    const response = await axios.get(`${API_BASE_URL}/api/settings/app-share-link`);
    const playStoreLink = response.data.link || "https://play.google.com/store/apps/details?id=com.morjodi.app";

  const message = i18n.t('referral.shareMessage', {
      link: playStoreLink,
      code: referralCode,
    });

    await Share.share({ message });

  } catch (error) {

    const fallback = "https://play.google.com/store/apps/details?id=com.morjodi.app";

  const message = i18n.t('referral.shareMessage', {
      link: fallback,
      code: referralCode,
    });

    await Share.share({ message });
  }
};




  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Referral Code Header */}
      <View style={styles.header}>
        <Text style={styles.codeText}>
          {referralCode
            ? `${referralCode.slice(0, 15)}***${referralCode.slice(-3)}`
            : 'N/A'}
        </Text>

        <TouchableOpacity onPress={handleShare}>
          <FontAwesome name="share-alt" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Referral List */}
      <View style={styles.history}>
        <Text style={styles.title}>{i18n.t('referral.history')}</Text>
        {referrals.length > 0 ? (
          <FlatList
            data={referrals}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <View style={styles.referralCard}>
                <View style={styles.initialCircle}>
                  <Text style={styles.initial}>
                    {item.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.fullName}</Text>
                  <Text style={styles.date}>{item.id}</Text>
                  <Text style={styles.date}>
                    {moment(item.date).format('DD MMM YYYY')}
                  </Text>
                </View>
              </View>
            )}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesome name="users" size={60} color={COLORS.gray} />
            <Text style={styles.emptyText}>   {i18n.t('referral.noReferrals')}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },

  codeText: {
    ...FONTS.h3,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  history: {
    flex: 1,
    padding: 10,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  shareText: {
    color: COLORS.white,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    fontWeight: 'semibold',
    marginHorizontal: 20,
    marginVertical: 15,
  },
  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    padding: SIZES.base * 1.5,
  },
  initialCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  initial: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.darkGray,
  },
  date: {
    fontSize: 13,
    color: COLORS.gray,
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});

export default ReferralScreen;
