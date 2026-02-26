import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';
import i18n from '../localization/i18n';
import Icon from 'react-native-vector-icons/Ionicons';

import { useSelector, useDispatch } from 'react-redux';
import { updateUserData } from '../redux/actions/authActions';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomHeader from '../components/CustomHeader';

const PrivacyToggle = ({ label, value, onChange }) => (
  <View style={{ marginBottom: 20 }}>
    <Text style={{ fontSize: 14, color: COLORS.black, marginBottom: 10, fontWeight: '600', fontFamily: FONTS.body3.fontFamily }}>
      {label}
    </Text>
    <View style={{ flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 12, padding: 4, height: 50 }}>
      <TouchableOpacity
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 10,
          backgroundColor: value === 'public' ? COLORS.primary : 'transparent',
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: value === 'public' ? 0.2 : 0,
          shadowRadius: 1.41,
          elevation: value === 'public' ? 2 : 0
        }}
        onPress={() => onChange('public')}
      >
        <Icon name="lock-open-outline" size={18} color={value === 'public' ? COLORS.white : COLORS.darkGray} style={{ marginRight: 6 }} />
        <Text style={{ fontSize: 14, color: value === 'public' ? COLORS.white : COLORS.darkGray, fontWeight: '500' }}>{i18n.t('privacy.public')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 10,
          backgroundColor: value === 'private' ? COLORS.primary : 'transparent',
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: value === 'private' ? 0.2 : 0,
          shadowRadius: 1.41,
          elevation: value === 'private' ? 2 : 0
        }}
        onPress={() => onChange('private')}
      >
        <Icon name="lock-closed-outline" size={18} color={value === 'private' ? COLORS.white : COLORS.darkGray} style={{ marginRight: 6 }} />
        <Text style={{ fontSize: 14, color: value === 'private' ? COLORS.white : COLORS.darkGray, fontWeight: '500' }}>{i18n.t('privacy.private')}</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const PrivacySettingsScreen = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState(
    user?.privacy?.profileVisibility || 'public',
  );
  const [photoVisibility, setPhotoVisibility] = useState(
    user?.privacy?.photoVisibility || 'public',
  );
  const [contactVisibility, setContactVisibility] = useState(
    user?.privacy?.contactVisibility || 'private',
  );

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/user/${user._id}`,
        { privacy: { profileVisibility, photoVisibility, contactVisibility } },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      dispatch(updateUserData(response.data.user));
      Alert.alert(
        i18n.t('common.success'),
        i18n.t('privacy.success')
      );
    } catch (error) {
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('privacy.error')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }} edges={['top', 'bottom']}>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.privacySection}>
          <PrivacyToggle
            label={i18n.t('privacy.profileVisibility')}
            value={profileVisibility}
            onChange={setProfileVisibility}
          />
          <PrivacyToggle
            label={i18n.t('privacy.photoVisibility')}
            value={photoVisibility}
            onChange={setPhotoVisibility}
          />
          <PrivacyToggle
            label={i18n.t('privacy.contactVisibility')}
            value={contactVisibility}
            onChange={setContactVisibility}
          />

          <TouchableOpacity
            style={[styles.saveButton, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}> {i18n.t('privacy.save')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: 40,
  },
  privacySection: {
    marginTop: SIZES.padding,
  },
  saveButton: {
    width: '100%',
    height: 55,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  saveButtonText: {
    ...FONTS.h3,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default PrivacySettingsScreen;
