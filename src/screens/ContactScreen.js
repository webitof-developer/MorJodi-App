import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { API_BASE_URL } from '../constants/config';
import { useSelector } from 'react-redux';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../localization/i18n';

const ContactScreen = () => {
  const { token } = useSelector(state => state.auth);
  const [contactData, setContactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContactData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${API_BASE_URL}/api/contact`, config);
        setContactData(response.data.data[0]);
      } catch (err) {
        // //console.error('Error fetching contact data:', err);
       setError(i18n.t('contact.errorLoad'));

      } finally {
        setLoading(false);
      }
    };

    fetchContactData();
  }, [token]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <ScrollView style={styles.container}>
        {contactData ? (
          <>
            <Text style={styles.title}>{contactData.title}</Text>

            {/* 📨 Email */}
            <View style={styles.row}>
              <Text style={styles.label}>{i18n.t('contact.email')}:</Text>
              <Text style={styles.value}>{contactData.email || 'N/A'}</Text>
            </View>

            {/* 📞 Phone */}
            <View style={styles.row}>
              <Text style={styles.label}>{i18n.t('contact.phone')}:</Text>
              <Text style={styles.value}>{contactData.phone || 'N/A'}</Text>
            </View>

            {/* 📍 Address */}
            <View style={styles.row}>
              <Text style={styles.label}>{i18n.t('contact.address')}:</Text>
              <Text style={styles.value}>{contactData.address || 'N/A'}</Text>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
               {i18n.t('contact.empty')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: COLORS.danger || '#ff4d4d',
    textAlign: 'center',
    marginTop: SIZES.medium,
    ...FONTS.body3,
  },
  title: {
    ...FONTS.h3,
    marginBottom: SIZES.medium,
    color: COLORS.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  label: {
    ...FONTS.h4,
    color: COLORS.darkGray,
    fontWeight: '600',
    flex: 0.4, // label width
  },
  value: {
    ...FONTS.h4,
    color: COLORS.black,
    flex: 0.6, // value width
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginTop: 10,
  },
});

export default ContactScreen;
