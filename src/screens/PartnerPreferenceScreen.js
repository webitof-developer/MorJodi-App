import React, { useEffect, useMemo, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';

import SelectionModal from '../components/SelectionModal';
import CustomHeader from '../components/CustomHeader';
import FloatingLabelInput from '../components/FloatingLabelInput';
import SuccessPopup from '../components/SuccessPopup';
import SkeletonPartnerPreference from '../components/SkeletonPartnerPreference';
import { API_BASE_URL } from '../constants/config';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { updateUserData } from '../redux/actions/authActions';
import i18n from '../localization/i18n';
import { LanguageContext } from '../contexts/LanguageContext';

const MARITAL_STATUS_OPTIONS = [
  { name: 'Never Married', value: 'Never Married' },
  { name: 'Divorced', value: 'Divorced' },
  { name: 'Widowed', value: 'Widowed' },
  { name: 'Awaiting Divorce', value: 'Awaiting Divorce' },
];

const CHILDREN_OPTIONS = [
  { name: 'No Children', value: 'No Children' },
  { name: '1 Child', value: '1 Child' },
  { name: '2 Children', value: '2 Children' },
  { name: '3+ Children', value: '3+ Children' },
  { name: 'Prefer not to say', value: 'Prefer not to say' },
];

const MANGLIK_OPTIONS = [
  { name: 'Doesnt Matter', value: 'Doesnt Matter' },
  { name: 'Manglik', value: 'Manglik' },
  { name: 'Non Manglik', value: 'Non Manglik' },
  { name: 'Angshik (Partial Manglik)', value: 'Angshik (Partial Manglik)' },
];

const toId = item => item?._id || item?.value || item?.id || item;
const toIdArray = value =>
  Array.isArray(value) ? value.map(v => toId(v)).filter(Boolean) : [];

const toStringArray = value =>
  Array.isArray(value) ? value.map(v => String(v)).filter(Boolean) : [];

const cleanOptionName = raw => {
  const value = (raw || '').toString();
  return value
    .replace(/null|undefined/gi, '')
    .replace(/\s*,\s*,/g, ', ')
    .replace(/,\s*$/g, '')
    .replace(/^\s*,/g, '')
    .trim();
};

const mapOptions = (items = [], getName) =>
  items
    .map(item => ({
      value: String(toId(item)),
      name: cleanOptionName(getName(item)),
    }))
    .filter(item => item.value && item.name);

// --- CustomPicker Component (Mirrored from EditProfileScreen) ---
const CustomPicker = ({
  label,
  selectedValue,
  onValueChange,
  items,
  placeholder,
  searchable = false,
  error = false,
  multiSelect = false,
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const formattedData = (items ?? []).map(item => ({
    name: item.name || item.label,
    value: item.value || item._id,
  })).filter(item => item.name && item.name.length > 0);

  let displayValue = "";
  if (multiSelect && Array.isArray(selectedValue)) {
    const selected = formattedData.filter(item => selectedValue.map(String).includes(String(item.value)));
    if (selected.length > 0) {
      if (selected.length <= 2) {
        displayValue = selected.map(item => item.name).join(', ');
      } else {
        displayValue = `${selected.slice(0, 2).map(item => item.name).join(', ')} +${selected.length - 2}`;
      }
    }
  } else {
    const selectedItem = formattedData.find(item => String(item.value) === String(selectedValue));
    if (selectedItem) displayValue = selectedItem.name;
  }

  return (
    <>
      <View style={{ marginVertical: 10 }}>
        <TouchableOpacity
          onPress={() => !disabled && setModalVisible(true)}
          activeOpacity={disabled ? 1 : 0.8}
          style={[
            styles.pickerContainer,
            error && { borderColor: COLORS.primary },
            disabled && { opacity: 0.6, backgroundColor: '#f9f9f9' }
          ]}
        >
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Text style={styles.pickerLabel}>{label}</Text>
            <View style={styles.pickerContent}>
              <Text style={[styles.pickerText, !displayValue && styles.placeholderText]} numberOfLines={1}>
                {displayValue || placeholder}
              </Text>
            </View>
            <View style={styles.pickerIcon}>
              <Icon name="chevron-down" size={20} color={COLORS.gray} />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <SelectionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={label}
        options={formattedData}
        onSelect={onValueChange}
        selectedValue={selectedValue}
        searchable={searchable}
        multiSelect={multiSelect}
      />
    </>
  );
};

const PartnerPreferenceScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { language } = useContext(LanguageContext);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState({});
  const [fadeAnim] = useState(new Animated.Value(0));

  const [ageMin, setAgeMin] = useState('18');
  const [ageMax, setAgeMax] = useState('50');
  const [heightMin, setHeightMin] = useState(140);
  const [heightMax, setHeightMax] = useState(200);
  const [annualIncome, setAnnualIncome] = useState('');

  const [maritalStatus, setMaritalStatus] = useState(['Never Married']);
  const [children, setChildren] = useState(['No Children']);
  const [manglik, setManglik] = useState(['Doesnt Matter']);

  const [religion, setReligion] = useState([]);
  const [caste, setCaste] = useState([]);
  const [subCaste, setSubCaste] = useState([]);
  const [gotra, setGotra] = useState([]);
  const [motherTongue, setMotherTongue] = useState([]);
  const [raasi, setRaasi] = useState([]);
  const [education, setEducation] = useState([]);
  const [profession, setProfession] = useState([]);
  const [location, setLocation] = useState([]);

  const [successPopup, setSuccessPopup] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success'
  });

  useEffect(() => {
    const init = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [metaRes, userRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/meta/profile-meta`),
          axios.get(`${API_BASE_URL}/api/user/singleuser`, config),
        ]);

        setMeta(metaRes.data || {});

        const pref = userRes.data?.user?.partnerPreference || {};
        setAgeMin(String(pref.ageRange?.[0] ?? 18));
        setAgeMax(String(pref.ageRange?.[1] ?? 50));
        setHeightMin(Number(pref.heightRange?.[0] ?? 140));
        setHeightMax(Number(pref.heightRange?.[1] ?? 200));
        setAnnualIncome(pref.annualIncome || '');

        setMaritalStatus(toStringArray(pref.maritalStatus).length ? toStringArray(pref.maritalStatus) : ['Never Married']);
        setChildren(toStringArray(pref.children).length ? toStringArray(pref.children) : ['No Children']);
        setManglik(toStringArray(pref.manglik).length ? toStringArray(pref.manglik) : ['Doesnt Matter']);

        setReligion(toIdArray(pref.religion).map(String));
        setCaste(toIdArray(pref.caste).map(String));
        setSubCaste(toIdArray(pref.subCaste).map(String));
        setGotra(toIdArray(pref.gotra).map(String));
        setMotherTongue(toIdArray(pref.motherTongue).map(String));
        setRaasi(toIdArray(pref.raasi).map(String));
        setEducation(toIdArray(pref.education).map(String));
        setProfession(toIdArray(pref.profession).map(String));
        setLocation(toIdArray(pref.location).map(String));

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        // console.error(error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const religionOptions = useMemo(
    () => mapOptions(meta.religions, item => item?.name),
    [meta.religions]
  );
  const casteOptionsRaw = useMemo(
    () => mapOptions(meta.castes, item => item?.name),
    [meta.castes]
  );
  const subCasteOptionsRaw = useMemo(
    () => mapOptions(meta.subCastes, item => item?.name),
    [meta.subCastes]
  );
  const gotraOptionsRaw = useMemo(
    () => mapOptions(meta.gotras, item => item?.name),
    [meta.gotras]
  );
  const motherTongueOptions = useMemo(
    () => mapOptions(meta.motherTongues, item => item?.name),
    [meta.motherTongues]
  );
  const raasiOptions = useMemo(
    () => mapOptions(meta.raasis, item => item?.name),
    [meta.raasis]
  );
  const educationOptions = useMemo(
    () =>
      mapOptions(meta.educations, item => `${item?.degree || ''} ${item?.field ? `(${item.field})` : ''}`),
    [meta.educations]
  );
  const professionOptions = useMemo(
    () => mapOptions(meta.professions, item => `${item?.occupation || ''}, ${item?.industry || ''}`),
    [meta.professions]
  );
  const locationOptions = useMemo(
    () => mapOptions(meta.locations, item => `${item?.city || ''}, ${item?.state || ''}, ${item?.country || ''}`),
    [meta.locations]
  );

  const casteOptions = useMemo(() => {
    if (!religion.length) return casteOptionsRaw;
    const allowed = new Set(religion.map(String));
    return (meta.castes || [])
      .filter(item => allowed.has(String(toId(item?.religion))))
      .map(item => ({ value: String(toId(item)), name: cleanOptionName(item?.name) }));
  }, [religion, meta.castes, casteOptionsRaw]);

  const subCasteOptions = useMemo(() => {
    if (!caste.length) return subCasteOptionsRaw;
    const allowed = new Set(caste.map(String));
    return (meta.subCastes || [])
      .filter(item => allowed.has(String(toId(item?.caste))))
      .map(item => ({ value: String(toId(item)), name: cleanOptionName(item?.name) }));
  }, [caste, meta.subCastes, subCasteOptionsRaw]);

  const gotraOptions = useMemo(() => {
    if (!subCaste.length) return gotraOptionsRaw;
    const allowed = new Set(subCaste.map(String));
    return (meta.gotras || [])
      .filter(item => allowed.has(String(toId(item?.subCaste))))
      .map(item => ({ value: String(toId(item)), name: cleanOptionName(item?.name) }));
  }, [subCaste, meta.gotras, gotraOptionsRaw]);

  const toNum = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const handleSave = async () => {
    const minAge = toNum(ageMin, 18);
    const maxAge = toNum(ageMax, 50);
    const minHeight = toNum(heightMin, 140);
    const maxHeight = toNum(heightMax, 200);

    if (minAge > maxAge) {
      setSuccessPopup({
        visible: true,
        title: i18n.t('common.error'),
        message: i18n.t('partnerPreferences.validation.minAgeMaxAge', { lng: language }),
        type: 'error'
      });
      return;
    }
    if (minHeight > maxHeight) {
      setSuccessPopup({
        visible: true,
        title: i18n.t('common.error'),
        message: i18n.t('partnerPreferences.validation.minHeightMaxHeight', { lng: language }),
        type: 'error'
      });
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');
      const payload = {
        ageRange: [minAge, maxAge],
        heightRange: [minHeight, maxHeight],
        maritalStatus: maritalStatus.length ? maritalStatus : ['Never Married'],
        children: children.length ? children : ['No Children'],
        manglik: manglik.length ? manglik : ['Doesnt Matter'],
        religion,
        caste,
        subCaste,
        gotra,
        motherTongue,
        raasi,
        education,
        profession,
        location,
        annualIncome: annualIncome || '',
      };

      const formData = new FormData();
      formData.append('partnerPreference', JSON.stringify(payload));

      const res = await axios.put(
        `${API_BASE_URL}/api/user/${user._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (res.data?.user) {
        dispatch(updateUserData(res.data.user));
      }
      setSuccessPopup({
        visible: true,
        title: i18n.t('common.success'),
        message: i18n.t('partnerPreferences.success.updated', { lng: language }),
        type: 'success'
      });
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error) {
      setSuccessPopup({
        visible: true,
        title: i18n.t('common.error'),
        message: error?.response?.data?.message || i18n.t('partnerPreferences.error.updateFailed', { lng: language }),
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SkeletonPartnerPreference />;
  }

  return (
    <SafeAreaView style={styles.container}>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('partnerPreferences.sections.agePreference', { lng: language })}</Text>
            <View style={styles.row}>
              <View style={styles.half}>
                <FloatingLabelInput
                  label={i18n.t('partnerPreferences.labels.minAge', { lng: language })}
                  value={ageMin}
                  onChangeText={setAgeMin}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.half}>
                <FloatingLabelInput
                  label={i18n.t('partnerPreferences.labels.maxAge', { lng: language })}
                  value={ageMax}
                  onChangeText={setAgeMax}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {i18n.t('partnerPreferences.sections.heightPreference', { lng: language })}: {heightMin} {i18n.t('advancedSearch.units.cm', { lng: language })} - {heightMax} {i18n.t('advancedSearch.units.cm', { lng: language })}
            </Text>
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.label}>{i18n.t('partnerPreferences.labels.minHeight', { lng: language })}: {heightMin} {i18n.t('advancedSearch.units.cm', { lng: language })}</Text>
              <Slider
                style={styles.slider}
                minimumValue={120}
                maximumValue={220}
                step={1}
                value={heightMin}
                onValueChange={setHeightMin}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor={COLORS.gray}
                thumbTintColor={COLORS.primary}
              />
            </View>
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.label}>{i18n.t('partnerPreferences.labels.maxHeight', { lng: language })}: {heightMax} {i18n.t('advancedSearch.units.cm', { lng: language })}</Text>
              <Slider
                style={styles.slider}
                minimumValue={120}
                maximumValue={220}
                step={1}
                value={heightMax}
                onValueChange={setHeightMax}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor={COLORS.gray}
                thumbTintColor={COLORS.primary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('partnerPreferences.sections.basicPreferences', { lng: language })}</Text>
            <CustomPicker
              label={i18n.t('advancedSearch.filters.maritalStatus', { lng: language })}
              selectedValue={maritalStatus}
              items={MARITAL_STATUS_OPTIONS}
              onValueChange={setMaritalStatus}
              multiSelect
              placeholder={i18n.t('advancedSearch.placeholders.maritalStatus', { lng: language })}
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.children', { lng: language })}
              selectedValue={children}
              items={CHILDREN_OPTIONS}
              onValueChange={setChildren}
              multiSelect
              placeholder={i18n.t('advancedSearch.placeholders.children', { lng: language })}
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.manglik', { lng: language })}
              selectedValue={manglik}
              items={MANGLIK_OPTIONS}
              onValueChange={setManglik}
              multiSelect
              placeholder={i18n.t('advancedSearch.placeholders.manglik', { lng: language })}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('partnerPreferences.sections.backgroundPreferences', { lng: language })}</Text>
            <CustomPicker
              label={i18n.t('advancedSearch.filters.religion', { lng: language })}
              selectedValue={religion}
              items={religionOptions}
              onValueChange={setReligion}
              multiSelect
              placeholder={i18n.t('advancedSearch.placeholders.religion', { lng: language })}
              searchable
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.caste', { lng: language })}
              selectedValue={caste}
              items={casteOptions}
              onValueChange={setCaste}
              multiSelect
              placeholder={i18n.t('advancedSearch.placeholders.caste', { lng: language })}
              searchable
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.subCaste', { lng: language })}
              selectedValue={subCaste}
              items={subCasteOptions}
              onValueChange={setSubCaste}
              multiSelect
              placeholder={i18n.t('advancedSearch.placeholders.subCaste', { lng: language })}
              searchable
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.gotra', { lng: language })}
              selectedValue={gotra}
              items={gotraOptions}
              onValueChange={setGotra}
              multiSelect
              placeholder={i18n.t('advancedSearch.placeholders.gotra', { lng: language })}
              searchable
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.motherTongue', { lng: language })}
              selectedValue={motherTongue}
              items={motherTongueOptions}
              onValueChange={setMotherTongue}
              multiSelect
              placeholder={i18n.t('advancedSearch.placeholders.motherTongue', { lng: language })}
              searchable
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.raasi', { lng: language })}
              selectedValue={raasi}
              items={raasiOptions}
              onValueChange={setRaasi}
              multiSelect
              placeholder={i18n.t('advancedSearch.placeholders.raasi', { lng: language })}
              searchable
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.education', { lng: language })}
              selectedValue={education}
              items={educationOptions}
              onValueChange={setEducation}
              multiSelect
              placeholder={i18n.t('advancedSearch.placeholders.education', { lng: language })}
              searchable
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.profession', { lng: language })}
              selectedValue={profession}
              items={professionOptions}
              onValueChange={setProfession}
              multiSelect
              placeholder={i18n.t('advancedSearch.placeholders.profession', { lng: language })}
              searchable
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.location', { lng: language })}
              selectedValue={location}
              items={locationOptions}
              onValueChange={setLocation}
              multiSelect
              placeholder={i18n.t('advancedSearch.placeholders.location', { lng: language })}
              searchable
            />

            <FloatingLabelInput
              label={i18n.t('advancedSearch.labels.annualIncome', { lng: language })}
              value={annualIncome}
              onChangeText={setAnnualIncome}
              placeholder={i18n.t('partnerPreferences.placeholders.expectedIncome', { lng: language })}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.disabledBtn]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.saveText}>{i18n.t('partnerPreferences.actions.save', { lng: language })}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      <SuccessPopup
        visible={successPopup.visible}
        title={successPopup.title}
        message={successPopup.message}
        type={successPopup.type}
        onClose={() => setSuccessPopup({ ...successPopup, visible: false })}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.black,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  half: {
    width: '48%',
  },
  pickerContainer: {
    width: '100%',
    height: 55,
    borderWidth: 1.5,
    borderColor: COLORS.gray,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    marginTop: 5,
  },
  pickerLabel: {
    position: 'absolute',
    left: 12,
    top: -10,
    fontSize: 12,
    color: COLORS.primary,
    backgroundColor: COLORS.white,
    paddingHorizontal: 4,
    fontFamily: FONTS.body3.fontFamily,
    zIndex: 1,
  },
  pickerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  pickerText: {
    fontSize: 16,
    color: COLORS.black,
    fontFamily: FONTS.body3.fontFamily,
  },
  placeholderText: {
    color: COLORS.gray,
  },
  pickerIcon: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  label: {
    ...FONTS.body4,
    color: COLORS.darkGray,
    marginBottom: 5,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  saveBtn: {
    marginTop: 10,
    height: 55,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  saveText: {
    ...FONTS.h3,
    color: COLORS.white,
  },
  disabledBtn: {
    opacity: 0.7,
  },
});

export default PartnerPreferenceScreen;
