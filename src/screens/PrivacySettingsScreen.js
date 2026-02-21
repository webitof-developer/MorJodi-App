import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';
import i18n from '../localization/i18n';


import { useSelector, useDispatch } from 'react-redux';
import { updateUserData } from '../redux/actions/authActions';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const CustomPicker = ({
  label,
  selectedValue,
  onValueChange,
  items,
  placeholder,
  required = false,
}) => (
  <View style={styles.pickerWrapper}>
    <Text style={styles.label}>
      {label} {required ? '*' : ''}
    </Text>
    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        style={styles.picker}
        dropdownIconColor={COLORS.gray}
      >
        <Picker.Item
          label={placeholder}
          value=""
          enabled={false}
          style={{ color: COLORS.gray }}
        />
        {items.map(item => (
          <Picker.Item
            key={item.value || item._id || item.name}
            label={item.name}
            value={item.value || item._id}
          />
        ))}
      </Picker>
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
      // console.log(response.data)
      dispatch(updateUserData(response.data.user));
     Alert.alert(
  i18n.t('common.success'),
  i18n.t('privacy.success')
);

    } catch (error) {
      // //console.error('Error updating privacy settings:', error.response?.data || error);
      Alert.alert(
  i18n.t('common.error'),
   i18n.t('privacy.error')
);

    }finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <ScrollView style={styles.container}>
        <View style={styles.privacySection}>
          <CustomPicker
            label={i18n.t('privacy.profileVisibility')}
            selectedValue={profileVisibility}
            onValueChange={setProfileVisibility}
            items={[
             { value: 'public', name: 'public' },
    { value: 'private', name: 'private' },
            ]}
             placeholder={i18n.t('privacy.profileVisibility')}
          />
          <CustomPicker
             label={i18n.t('privacy.photoVisibility')}
            selectedValue={photoVisibility}
            onValueChange={setPhotoVisibility}
            items={[
                { value: 'public', name: 'public' },
    { value: 'private', name: 'private' },
            ]}
             placeholder={i18n.t('privacy.photoVisibility')}
          />
          <CustomPicker
             label={i18n.t('privacy.contactVisibility')}
            selectedValue={contactVisibility}
            onValueChange={setContactVisibility}
            items={[
                { value: 'public', name:'public' },
    { value: 'private', name:   'private' },

            ]}
           placeholder={i18n.t('privacy.contactVisibility')}
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
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.padding,
  },
  privacySection: {
    marginTop: SIZES.padding * 2,
  },
  sectionHeader: {
    ...FONTS.h3,
    color: COLORS.darkGray,
    marginBottom: SIZES.padding,
  },
  saveButton: {
     width: '100%',
    paddingVertical: 15,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    ...FONTS.h3,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  label: {
    ...FONTS.body4,
    color: COLORS.darkGray,
    marginBottom: SIZES.base,
  },
  pickerWrapper: { width: '100%', marginBottom: 10 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: SIZES.radius,
    height: 50,
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  picker: { height: 50, color: COLORS.darkGray },
});

export default PrivacySettingsScreen;
