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
import { COLORS, SIZES, FONTS } from '../constants/theme';
import MatchCard from '../components/MatchCard';
import SkeletonMatch from '../components/SkeletonMatch';
import { RefreshContext } from '../contexts/RefreshContext';
import AdvertisementCard from '../components/AdvertisementCard';
import { fetchProfiles } from '../redux/slices/profilesSlice';
import Icon from 'react-native-vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../localization/i18n';

const AllProfiles = () => {
  const dispatch = useDispatch();
  const { token } = useSelector(state => state.auth);
  const { filters } = useSelector(state => state.search);
  const { all: profiles, status, error, fetchingMore, pagination } = useSelector(state => state.profiles);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  const { refreshAll, refreshing: globalRefreshing } =
    useContext(RefreshContext);

  const fetchData = async (pageNum = 1) => {
    if (token) {
      await dispatch(fetchProfiles({ profileType: 'all', filters, page: pageNum }));
    }
  };

  useEffect(() => {
    if (token) {
      setPage(1);
      dispatch(fetchProfiles({ profileType: 'all', filters, page: 1 }));
    }
  }, [token, filters, dispatch]);

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
    const totalPages = pagination?.all?.totalPages || 1;
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage);
    }
  };

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

  if (status === 'loading' && page === 1) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.white }}>
        <SkeletonMatch count={3} />
      </View>
    );
  }

  if (profiles.length === 0 && status !== 'loading') {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: COLORS.white,
        }}
      >
        <Icon name="user-times" size={60} color={COLORS.gray} />
        <Text style={{ fontSize: 16, color: '#555', marginTop: 10 }}>
          {i18n.t('profiles.empty')}
        </Text>

      </View>
    );
  }

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

  imageBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: SIZES.padding,
    borderBottomLeftRadius: SIZES.radius,
    borderBottomRightRadius: SIZES.radius,
  },
  name: {
    ...FONTS.h2,
    color: COLORS.white,
  },
  details: {
    ...FONTS.body3,
    color: COLORS.white,
  },
  photoCountContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.base,
    paddingVertical: SIZES.base / 2,
  },
  photoCountText: {
    color: COLORS.white,
    ...FONTS.body5,
    marginLeft: SIZES.base / 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AllProfiles;
