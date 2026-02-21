// src/components/AdvertisementCard.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '../constants/config';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import LinearGradient from 'react-native-linear-gradient';

const AdvertisementCard = ({ index = 0 }) => {
  const { token } = useSelector(state => state.auth);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchAds = async () => {
      try {
        const now = new Date();
        const res = await axios.get(`${API_BASE_URL}/api/advertising`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Fetched ads:', res.data);

        const adsArray = Array.isArray(res.data) ? res.data : [];
        const activeAds = adsArray
          .filter(ad => {
            const start = new Date(ad.startDate);
            const end = new Date(ad.endDate);
            return ad.isActive && start <= now && end >= now;
          })
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        setAds(activeAds);
      } catch (error) {
        // //console.error('Error fetching ads:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, [token]);

  // 🔹 Loader state
  if (loading) {
    return (
      <View
        style={[
          styles.card,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // 🔹 No active ads
  if (!ads || ads.length === 0) {
    return (
      <View
        style={[
          styles.card,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Text style={{ color: COLORS.darkGray }}>No active advertisement</Text>
      </View>
    );
  }

  // ✅ Safe ad selection
  let ad = null;
  if (Array.isArray(ads) && ads.length > 0) {
    const safeIndex = Math.floor(index % ads.length);
    ad = ads[safeIndex];
  }

  if (!ad) {
    return (
      <View
        style={[
          styles.card,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Text style={{ color: COLORS.darkGray }}>Loading Advertisement...</Text>
      </View>
    );
  }

  console.log('🟢 Selected Ad:', ad);

  const handlePress = async () => {
    if (!ad.link) return;

    let url = ad.link;
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(url)) {
      url = `https://${url}`;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.warn(`Cannot open URL: ${url}`);
      }
    } catch (error) {
      console.error('An error occurred', error);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      {/* 🖼 Image Ad */}
      {ad.type === 'image' && ad.imageUrl && (
        <Image
          source={{ uri: ad.imageUrl }}
          style={styles.imageBackground}
          resizeMode="cover"
        />
      )}

      {/* 🎥 Video Ad */}
      {ad.type === 'video' && ad.videoUrl && (
        <Video
          source={{ uri: ad.videoUrl }}
          style={styles.imageBackground}
          resizeMode="cover"
          repeat
          muted
        />
      )}

      {/* 🧾 Content Ad */}
      {ad.type === 'content' && (
        <LinearGradient
          colors={['#ffecd2', '#fcb69f']}
          style={[styles.imageBackground, { justifyContent: 'center' }]}
        >
          <Text style={styles.textContent}>
            {ad.content || 'Sponsored Post'}
          </Text>
        </LinearGradient>
      )}

      {/* 🏷 Overlay Info */}
      {/* <View style={styles.overlay}>
        <Text style={styles.adTitle}>{ad.title || 'Sponsored'}</Text>
        {ad.brand && <Text style={styles.brandText}>{ad.brand}</Text>}
      </View> */}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: SIZES.base,
    height: 450, // same height as MatchCard
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    backgroundColor: COLORS.lightGray,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    borderRadius: SIZES.radius,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
    borderBottomLeftRadius: SIZES.radius,
    borderBottomRightRadius: SIZES.radius,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SIZES.padding,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  adTitle: {
    ...FONTS.h2,
    color: COLORS.white,
    textAlign: 'center',
  },
  brandText: {
    ...FONTS.body4,
    color: COLORS.white,
    textAlign: 'center',
    marginTop: 4,
  },
  textContent: {
    ...FONTS.h2,
    textAlign: 'center',
    color: COLORS.darkblack,
    paddingHorizontal: 20,
  },
});

export default AdvertisementCard;
