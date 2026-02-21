import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RefreshContext } from '../contexts/RefreshContext';
import { COLORS, SIZES } from '../constants/theme';
import MatchCard from '../components/MatchCard';
import SkeletonMatch from '../components/SkeletonMatch';
import AdvertisementCard from '../components/AdvertisementCard';
import { fetchProfiles } from '../redux/slices/profilesSlice';
import Icon from 'react-native-vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../localization/i18n';
import { LanguageContext } from '../contexts/LanguageContext';

const YourMatches = () => {
  const dispatch = useDispatch();
  const { token } = useSelector(state => state.auth);
  const {
    yourMatches: profiles,
    status,
    error,
    fetchingMore,
    pagination
  } = useSelector(state => state.profiles);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  const { refreshAll, refreshing: globalRefreshing } =
    useContext(RefreshContext);
  const { language } = useContext(LanguageContext);
  const fetchData = async (pageNum = 1) => {
    if (token) {
      await dispatch(fetchProfiles({ profileType: 'yourMatches', page: pageNum }));
    }
  };
  // 🔹 Fetch matches initially
  useEffect(() => {
    if (token) {
      setPage(1);
      dispatch(fetchProfiles({ profileType: 'yourMatches', page: 1 }));
    }
  }, [dispatch, token]);

  // 🔹 Pull-to-refresh
  // 🔁 Trigger when global refresh happens
  useEffect(() => {
    if (globalRefreshing) {
      setPage(1);
      fetchData(1);
    }
  }, [globalRefreshing]);

  const handleRefresh = async () => {
    setRefreshing(true);
    refreshAll(); // trigger all screens to refresh
    setPage(1);
    await fetchData(1);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (fetchingMore) return;
    const totalPages = pagination?.yourMatches?.totalPages || 1;
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage);
    }
  };

  // 🔹 Interleave Ads after every 4 profiles
  const dataWithAds = useMemo(() => {
    const result = [];
    profiles.forEach((profile, index) => {
      result.push({ type: 'profile', data: profile });
      if ((index + 1) % 4 === 0) {
        result.push({ type: 'ad', data: { adIndex: index / 4 } });
      }
    });
    return result;
  }, [profiles]);

  // 🔹 Loading state
  if (status === 'loading' && page === 1) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.white }}>
        <SkeletonMatch count={3} />
      </View>
    );
  }

  // 🔹 Error state
  if (status === 'failed' && page === 1) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: COLORS.red }}>Error: {error}</Text>
      </View>
    );
  }

  // 🔹 Empty state
  if ((!profiles || profiles.length === 0) && status !== 'loading') {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="user-times" size={60} color={COLORS.gray} />
        <Text style={styles.emptyText}> {i18n.t('yourMatches.empty', { lng: language })}</Text>
      </View>
    );
  }

  // 🔹 List with ads
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <FlatList
        data={dataWithAds}
        renderItem={({ item }) =>
          item.type === 'ad' ? (
            <AdvertisementCard index={item.data.adIndex} />
          ) : (
            <MatchCard item={item.data} />
          )
        }
        keyExtractor={(item, index) =>
          item.type === 'ad' ? `ad-${index}` : item.data._id
        }
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]} // 🎨 primary color for Android spinner
            tintColor={COLORS.primary} // 🎨 primary color for iOS spinner
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          fetchingMore ? (
            <View style={{ padding: 10 }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: SIZES.padding / 1.5,
    backgroundColor: COLORS.white,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 10,
  },
});

export default YourMatches;
