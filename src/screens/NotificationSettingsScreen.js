import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,  ActivityIndicator  } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';
import i18n from '../localization/i18n';

import { useSelector, useDispatch } from 'react-redux';
import { updateUserData } from '../redux/actions/authActions';
import { SafeAreaView } from 'react-native-safe-area-context';

const NotificationSettingsScreen = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
const [loading, setLoading] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(
    user?.notifications?.pushNotifications ?? true,
  );

  const handleSave = async () => {
    try {
       setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/user/${user._id}`,
        { notifications: { pushNotifications } },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      dispatch(updateUserData(response.data.user));
      Alert.alert('Success', 'Notification settings updated successfully.');
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Something went wrong.',
      );
    }finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}><Text style={styles.sectionHeader}>
  {i18n.t('notifications.title')}
</Text>
</Text>
          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={() => setPushNotifications(!pushNotifications)}
          >
            <Text style={styles.toggleLabel}><Text style={styles.toggleLabel}>
  {i18n.t('notifications.receive')}
</Text>
</Text>
            <View style={[styles.toggle, pushNotifications && styles.toggleOn]}>
              <View style={[styles.toggleCircle, pushNotifications && styles.toggleCircleOn]} />
            </View>
          </TouchableOpacity>
          <Text style={styles.description}>
           {i18n.t('notifications.description')}
          </Text>
        </View>
              <TouchableOpacity 
          style={[styles.saveButton, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}> {i18n.t('notifications.save')}</Text>
          )}
        </TouchableOpacity>
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
  section: {
    marginTop: SIZES.padding * 2,
  },
  sectionHeader: {
    ...FONTS.h3,
    color: COLORS.darkGray,
    marginBottom: SIZES.padding,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  toggleLabel: {
    ...FONTS.body3,
    color: COLORS.darkGray,
    flex: 1,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: COLORS.primary,
  },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
  },
  toggleCircleOn: {
    alignSelf: 'flex-end',
  },
  description: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginTop: SIZES.base,
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
});

export default NotificationSettingsScreen;
