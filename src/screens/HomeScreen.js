import React, { useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomHeader from '../components/CustomHeader';
import BannerCarousel from '../components/BannerCarousel';
import PremiumProfiles from '../components/PremiumProfiles';
import NearbyMatches from '../components/NearbyMatches';
import FollowUs from '../components/FollowUs';
import SkeletonHome from '../components/SkeletonHome';
import { COLORS } from '../constants/theme';

import { useSelector, useDispatch } from 'react-redux';
import {
  fetchPremiumProfiles,
  fetchNearbyProfiles,
} from '../redux/slices/homeSlice';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const { premium, nearby, loading } = useSelector(state => state.home);
  const { token } = useSelector(state => state.auth);

  const [refreshing, setRefreshing] = React.useState(false);

  // -------- Fetch on mount + on token change --------
  useEffect(() => {
    if (token) {
      dispatch(fetchPremiumProfiles());
      dispatch(fetchNearbyProfiles());
    }
  }, [token]);

  // Animate on loading change
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [loading]);

  // -------- Pull to refresh --------
  const onRefresh = useCallback(() => {
    setRefreshing(true);

    Promise.all([
      dispatch(fetchPremiumProfiles()),
      dispatch(fetchNearbyProfiles()),
    ]).finally(() => setRefreshing(false));
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <CustomHeader title="Home" navigation={navigation} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <BannerCarousel />

        {loading ? (
          <SkeletonHome />
        ) : (
          <>
            <View style={styles.section}>
              <PremiumProfiles profiles={premium} loading={loading} />
            </View>

            <View style={styles.section}>
              <NearbyMatches profiles={nearby} loading={loading} />
            </View>

            <View style={styles.section}>
              <FollowUs />
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  section: {
    marginTop: 20,
  },
  loaderSection: {
    marginTop: 20,
    alignItems: 'center',
  },
});

export default HomeScreen;
