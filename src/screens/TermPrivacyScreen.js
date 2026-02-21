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
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';

const TermsPrivacyScreen = () => {
  const { token } = useSelector(state => state.auth);
  const [termsPrivacyData, setTermsPrivacyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTermsPrivacyData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(
          `${API_BASE_URL}/api/term/all`,
          config,
        );
        setTermsPrivacyData(response.data.data);
      } catch (err) {
        // //console.error('Error fetching terms & privacy:', err);
        setError('Failed to load terms and privacy information.');
      } finally {
        setLoading(false);
      }
    };

    fetchTermsPrivacyData();
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
        {termsPrivacyData.length > 0 ? (
          termsPrivacyData.map(item => (
            <View key={item._id} style={styles.itemContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.content}>{item.content}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesome name="file-text-o" size={60} color={COLORS.gray} />
            <Text style={styles.emptyText}>
              No terms or privacy information available.
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
    backgroundColor: COLORS.white,
  },
  error: {
    color: COLORS.danger || '#ff4d4d',
    textAlign: 'center',
    marginTop: SIZES.medium,
    ...FONTS.body3,
  },
  itemContainer: {
    marginBottom: SIZES.large,
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
    textAlign: 'center',
  },
});

export default TermsPrivacyScreen;

