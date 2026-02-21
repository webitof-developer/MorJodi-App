import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import Icon from 'react-native-vector-icons/Feather';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

import { useSelector, useDispatch } from 'react-redux';
import { updateUserData } from '../redux/actions/authActions';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../localization/i18n';

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

const AccountSettingsScreen = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);

 const settingsOptions = [
  {
    title: i18n.t('accountSettings.options.notifications'),
    icon: 'bell',
    onPress: () => navigation.navigate('NotificationSettings'),
  },
  {
    title: i18n.t('accountSettings.options.privacySettings'),
    icon: 'lock',
    onPress: () => navigation.navigate('PrivacySettings'),
  },
];

const deletionReasons = [
  { id: '1', text: i18n.t('accountSettings.delete.reasons.foundPartner') },
  { id: '2', text: i18n.t('accountSettings.delete.reasons.notSatisfied') },
  { id: '3', text: i18n.t('accountSettings.delete.reasons.gettingMarried') },
  { id: '4', text: i18n.t('accountSettings.delete.reasons.privacyConcern') },
  { id: '5', text: i18n.t('accountSettings.delete.reasons.other') },
];


  const handleDeleteAccount = () => {
    setModalVisible(true);
  };

  const handleReasonSelection = reason => {
    setSelectedReason(reason);
  };

  const submitDeletion = async () => {
    let reason = selectedReason?.text;
    if (!reason) {
      Alert.alert('Error', 'Please select a reason for deletion.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/user/delete-request`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setModalVisible(false);
      Alert.alert(
        'Success',
        'Your account deletion request has been submitted.',
      );
    } catch (error) {
      // //console.error('Error submitting deletion request:', error.response?.data || error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Something went wrong.',
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 30 }} // IMPORTANT
      >
        {settingsOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionContainer}
            onPress={option.onPress}
          >
            <Icon name={option.icon} size={24} color={COLORS.darkGray} />
            <Text style={styles.optionText}>{option.title}</Text>
            <Icon name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.optionContainer, styles.deleteButton]}
          onPress={handleDeleteAccount}
        >
          <Icon name="trash-2" size={24} color={COLORS.danger} />
         <Text style={[styles.optionText, styles.deleteButtonText]}>
  {i18n.t('accountSettings.options.deleteAccount')}
</Text>

        </TouchableOpacity>

        {/* Modal stays the same */}
        <Modal
          animationType="slide"
          transparent
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPressOut={() => setModalVisible(false)}
          >
            <View style={styles.modalContent}>
             <Text style={styles.modalHeader}>
  {i18n.t('accountSettings.delete.modalTitle')}
</Text>

              <FlatList
                data={deletionReasons}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.reasonItem,
                      selectedReason?.id === item.id && styles.selectedReason,
                    ]}
                    onPress={() => handleReasonSelection(item)}
                  >
                    <Text style={styles.reasonText}>{item.text}</Text>
                  </TouchableOpacity>
                )}
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitDeletion}
              >
               <Text style={styles.submitButtonText}>
  {i18n.t('accountSettings.delete.submit')}
</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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
  header: {
    ...FONTS.h2,
    color: COLORS.primary,
    marginVertical: SIZES.padding * 2,
    textAlign: 'center',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  optionText: {
    ...FONTS.body3,
    color: COLORS.darkGray,
    marginLeft: SIZES.padding,
    flex: 1,
  },
  deleteButton: {
    borderBottomWidth: 0,
    marginTop: SIZES.padding * 0.25,
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontWeight: 'bold',
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
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: SIZES.small,
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  saveButtonText: {
    ...FONTS.h3,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    width: '90%',
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  modalHeader: {
    ...FONTS.h3,
    color: COLORS.darkGray,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  reasonItem: {
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  selectedReason: {
    backgroundColor: COLORS.lightGray,
  },
  reasonText: {
    ...FONTS.body3,
    color: COLORS.darkGray,
  },
  otherReasonInput: {
    width: '100%',
    padding: SIZES.base * 1.5,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.base,
    ...FONTS.body3,
    marginTop: 20,
  },
  submitButton: {
   width: '100%',
    paddingVertical: 15,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  submitButtonText: {
    ...FONTS.h3,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default AccountSettingsScreen;
