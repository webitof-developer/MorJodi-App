import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import { COLORS, SIZES } from '../constants/theme';
import { API_BASE_URL } from '../constants/config';
import Video from 'react-native-video';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const BannerCarousel = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useSelector(state => state.auth);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const intervalRef = useRef(null);

  // ✅ Fetch active banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/banner/activebanners`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setBanners(res.data || []);
      } catch (err) {
        // //console.error("❌ Error fetching banners:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // ✅ Auto Carousel
  useEffect(() => {
    if (banners.length === 0) return;

    intervalRef.current = setInterval(() => {
      setActiveIndex(prevIndex =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1,
      );
    }, 4000);

    return () => clearInterval(intervalRef.current);
  }, [banners]);

  useEffect(() => {
    if (flatListRef.current && banners.length > 0) {
      flatListRef.current.scrollToIndex({
        index: activeIndex,
        animated: true,
      });
    }
  }, [activeIndex, banners]);

  // ✅ Render Banner
  const renderBanner = ({ item }) => {
    const imageUrl = getImageUrl(item.imageUrl);
    const videoUrl = getImageUrl(item.videoUrl);

    return (
      <TouchableOpacity activeOpacity={0.9} style={styles.bannerWrapper}>
        {item.type === 'image' && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        )}

        {item.type === 'video' && (
          <Video
            source={{ uri: videoUrl }}
            style={styles.bannerImage}
            muted
            resizeMode="cover"
            repeat
          />
        )}
      </TouchableOpacity>
    );
  };

  // if (loading) {
  //   return (
  //     <ActivityIndicator
  //       style={{ marginTop: 20 }}
  //       size="large"
  //       color={COLORS.primary}
  //     />
  //   );
  // }

  if (!banners.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No active banners</Text>
      </View>
    );
  }

  return (
    <View style={styles.carouselContainer}>
      <FlatList
        ref={flatListRef}
        data={banners}
        keyExtractor={item => item._id}
        renderItem={renderBanner}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
        }}
      />

      {/* Dots Indicator */}
      <View style={styles.dotContainer}>
        {banners.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.activeDot]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    width: '100%',
    height: 150,
    paddingHorizontal: 12, // ✅ Padding added
    marginTop: 10,
  },
  bannerWrapper: {
    width: width - 24, // ✅ Adjusted to account for horizontal padding
    height: 150,
    borderRadius: 14,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  dotContainer: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: COLORS.primary,
    width: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 14,
  },
});

export default BannerCarousel;
