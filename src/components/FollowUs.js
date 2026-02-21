import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';
import { API_BASE_URL } from '../constants/config';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import i18n from '../localization/i18n';
import { LanguageContext } from '../contexts/LanguageContext';
import Feather from 'react-native-vector-icons/Feather';

const FollowUs = () => {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);

  const { language } = useContext(LanguageContext);

  useEffect(() => {
    const fetchFollowLinks = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/follow`);
        setPlatforms(data || []);
      } catch (error) {
        // console.error('Error', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFollowLinks();
  }, []);

  const getBrandColors = (platform) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return { primary: '#1877F2', bg: '#E7F5FF' };
      case 'instagram': return { primary: '#E1306C', bg: '#FFF0F5' };
      case 'whatsapp': return { primary: '#25D366', bg: '#E8FDF0' };
      case 'youtube': return { primary: '#FF0000', bg: '#FFF0F0' };
      case 'twitter': return { primary: '#1DA1F2', bg: '#E8F5FE' };
      case 'linkedin': return { primary: '#0077B5', bg: '#E6F4FB' };
      default: return { primary: COLORS.primary, bg: '#F8F8F8' };
    }
  };

  const getPlatformIcon = (platform, color) => {
    const p = platform.toLowerCase();
    const size = 24;

    switch (p) {
      case 'instagram': return <Feather name="instagram" size={size} color={color} />;
      case 'facebook': return <Feather name="facebook" size={size} color={color} />;
      case 'twitter': return <Feather name="twitter" size={size} color={color} />;
      case 'youtube': return <Feather name="youtube" size={size} color={color} />;
      case 'linkedin': return <Feather name="linkedin" size={size} color={color} />;
      case 'whatsapp': return <Icon name="whatsapp" size={size + 2} color={color} />;
      default: return <Feather name="link" size={size} color={color} />;
    }
  };

  if (!platforms.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('follow.title', { lng: language })}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {platforms.map((item, index) => {
          const colors = getBrandColors(item.platform);
          return (
            <TouchableOpacity
              key={index}
              style={styles.itemWrapper}
              onPress={async () => {
                if (item.link) {
                  let url = item.link;
                  if (!/^(https?:\/\/|mailto:|tel:)/i.test(url)) {
                    url = `https://${url}`;
                  }
                  try {
                    await Linking.openURL(url);
                  } catch (err) {
                    console.warn('Cannot open URL:', url);
                  }
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, {
                borderColor: colors.primary,
                backgroundColor: colors.bg
              }]}>
                {getPlatformIcon(item.platform, colors.primary)}
              </View>

              <Text style={styles.platformName}>
                {i18n.t(`follow.platforms.${item.platform.toLowerCase()}`, {
                  defaultValue: item.platform,
                })}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    marginBottom: 35,
  },
  title: {
    fontSize: 18,
    fontFamily: FONTS.h3.fontFamily,
    color: COLORS.black,
    fontWeight: '700',
    marginBottom: 15,
    marginLeft: 20,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  itemWrapper: {
    alignItems: 'center',
    marginRight: 20,
    width: 65,
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  platformName: {
    fontSize: 11,
    fontFamily: FONTS.body4.fontFamily,
    color: COLORS.black,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
});

export default FollowUs;
