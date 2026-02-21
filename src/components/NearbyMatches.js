import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { API_BASE_URL } from '../constants/config';
import HomeProfileCard from './HomeProfileCard';
import i18n from '../localization/i18n';
import { LanguageContext } from '../contexts/LanguageContext';

const K = { USER_TOKEN: 'user_token' };

const NearbyMatches = ({ profiles, loading }) => {
  const { language } = useContext(LanguageContext);
  if (loading) return null; // handled globally

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>  {i18n.t('nearby.title', {
        count: profiles.length,
        lng: language,
      })}</Text>

      {profiles.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons
            name="map-marker-radius-outline"
            size={60}
            color={COLORS.gray}
            style={{ marginBottom: 10 }}
          />
          <Text
            style={[FONTS.body3, { color: COLORS.gray, textAlign: 'center' }]}
          >
            {i18n.t('nearby.empty')}
          </Text>
        </View>
      ) : (
        <FlatList
          horizontal
          data={profiles}
          keyExtractor={item => item._id}
          renderItem={({ item }) => <HomeProfileCard item={item} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
  },
  heading: {
    ...FONTS.h3,
    color: COLORS.black,
    marginBottom: 10,
    marginLeft: 20,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 40,
  },
});

export default NearbyMatches;
