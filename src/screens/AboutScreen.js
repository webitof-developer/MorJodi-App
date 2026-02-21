import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { useSelector } from 'react-redux';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../localization/i18n';

const AboutScreen = () => {
  const { token } = useSelector(state => state.auth);
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${API_BASE_URL}/api/about`, config);
        setAboutData(response.data.data[0]); // Assuming the API returns an array and we need the first item
      } catch (err) {
    setError(i18n.t('about.errorLoad'));

      } finally {
        setLoading(false);
      }
    };

    fetchAboutData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
  <ActivityIndicator size="large" color={COLORS.primary} />
  <Text style={{ marginTop: 10 }}>
    {i18n.t('about.loading')}
  </Text>
</View>

    );
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {aboutData ? (
          <>
            <Text style={styles.title}>{aboutData.title || i18n.t('about.titleFallback')}</Text>
            <Text style={styles.content}>{aboutData.content}</Text>
          </>
        ) : (
          <View style={styles.emptyContainer}>
         <Text style={styles.emptyText}>
  {i18n.t('about.empty')}
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
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SIZES.medium,
    ...FONTS.regular,
  },
  title: {
    ...FONTS.h3,
    marginBottom: SIZES.medium,
    color: COLORS.primary,
  },
  content: {
    ...FONTS.h4,
    lineHeight: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
    backgroundColor: COLORS.white,
  },
  emptyText: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginTop: 10,
  },
});

export default AboutScreen;
