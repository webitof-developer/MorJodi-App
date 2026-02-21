import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { fetchIdWiseProfile } from '../redux/slices/profilesSlice';
import MatchCard from '../components/MatchCard';
import SkeletonMatch from '../components/SkeletonMatch';
import Icon from 'react-native-vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../localization/i18n';
const IdWiseSearch = () => {
  const dispatch = useDispatch();
  const { token } = useSelector(state => state.auth);
  const [userIdInput, setUserIdInput] = useState('');

  const {
    idWiseProfile: profile,
    status,
    error,
  } = useSelector(state => state.profiles);

  const handleSearch = async () => {
    const cleaned = userIdInput.trim();
    if (!cleaned) {
      Alert.alert(
        i18n.t('idSearch.errorTitle'),
        i18n.t('idSearch.invalidId')
      );

      return;
    }
    const normalized = cleaned.toUpperCase();
    dispatch(fetchIdWiseProfile(normalized));
  };

  useEffect(() => {
    if (status === 'failed' && error) {
      Alert.alert(
        i18n.t('idSearch.errorTitle'),
        error
      );

    }
  }, [status, error]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <ScrollView style={styles.container}>
        {/* Input Field */}
        <TextInput
          style={styles.input}
          placeholder={i18n.t('idSearch.inputPlaceholder')}

          placeholderTextColor={COLORS.gray}
          value={userIdInput}
          onChangeText={setUserIdInput}
        />

        {/* Search Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSearch}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>{i18n.t('idSearch.search')}</Text>
          )}
        </TouchableOpacity>

        {/* Loading State Skeleton */}
        {status === 'loading' && (
          <View style={{ marginTop: 10 }}>
            <SkeletonMatch count={1} />
          </View>
        )}

        {/* Show Result */}
        {status === 'succeeded' && profile && (
          <View style={{ marginTop: 10 }}>
            {/* ✅ Use MatchCard */}
            <MatchCard item={profile} />
          </View>
        )}

        {/* Empty State */}
        {status === 'succeeded' && !profile && (
          <View style={styles.emptyContainer}>
            <Icon name="search" size={70} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>
              {i18n.t('idSearch.noUserTitle')}
            </Text>

            <Text style={styles.emptySubtitle}>
              {i18n.t('idSearch.noUserDesc')}
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
  title: {
    ...FONTS.h3,
    color: COLORS.primary,
    marginBottom: 15,
  },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: SIZES.radius,
    marginBottom: 12,
    color: COLORS.black,
    backgroundColor: COLORS.white,
    ...FONTS.body3,
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: COLORS.white,
    ...FONTS.h4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    ...FONTS.h4,
    color: COLORS.gray,
  },
});

export default IdWiseSearch;
