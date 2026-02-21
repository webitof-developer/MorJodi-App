import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setFilters } from '../redux/slices/searchSlice';
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import Slider from '@react-native-community/slider';
import { MultiSelect } from 'react-native-element-dropdown';
import { fetchProfiles } from '../redux/slices/profilesSlice';
import MatchCard from '../components/MatchCard';

const META_API_BASE_URL = `${API_BASE_URL}/api/meta`;

const MIN_HEIGHT_CM = 120;
const MAX_HEIGHT_CM = 220;

// 🔹 Reusable Picker Component

const PartnerMultiSelect = ({ label, value, onChange, data, placeholder }) => (
  <View style={styles.pickerWrapper}>
    <Text style={styles.label}>{label}</Text>
    <MultiSelect
      style={styles.dropdown}
      placeholderStyle={styles.placeholderStyle}
      selectedTextStyle={styles.selectedTextStyle}
      inputSearchStyle={styles.inputSearchStyle}
      iconStyle={styles.iconStyle}
      data={data}
      labelField="label"
      valueField="value"
      placeholder={placeholder}
      search
      searchPlaceholder="Search..."
      value={value}
      onChange={onChange}
      selectedStyle={styles.selectedStyle}
    />
  </View>
);

const NormalSearch = () => {
  const dispatch = useDispatch();
  const { token } = useSelector(state => state.auth);
  const {
    search: profiles,
    status,
    error,
  } = useSelector(state => state.profiles);

  const [form, setForm] = useState({
    minAge: '18',
    maxAge: '40',
    minHeight: 160,
    maxHeight: 180,
    maritalStatus: '',
    religion: '',
    annualIncome: '',
  });

  const [meta, setMeta] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // 🔹 Fetch meta data once
  useEffect(() => {
    const fetchMetaData = async () => {
      try {
        const { data } = await axios.get(`${META_API_BASE_URL}/profile-meta`);
        setMeta(data);
      } catch (error) {
        // //console.error('Error loading meta data:', error);
        Alert.alert('Error', 'Failed to fetch meta data.');
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchMetaData();
  }, []);

  // 🔹 Handle filter changes
  const handleFilterChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // 🔹 Format meta arrays (religions, etc.)
  const formatSimple = (arr = []) =>
    arr.map(item => ({
      value: item._id || item.name,
      label: item.name,
    }));

  // 🔹 Handle search
  const handleSearch = async () => {
    if (!token) return Alert.alert('Error', 'Authentication token missing.');

    if (parseInt(form.minAge) > parseInt(form.maxAge)) {
      Alert.alert('Invalid Age Range', 'Min age cannot exceed max age.');
      return;
    }

    const filters = {
      minAge: parseInt(form.minAge),
      maxAge: parseInt(form.maxAge),
      minHeight: form.minHeight,
      maxHeight: form.maxHeight,
      maritalStatus: form.maritalStatus || [],
      religion: form.religion || [],
      annualIncome: form.annualIncome || '',
    };

    dispatch(setFilters(filters));
    dispatch(fetchProfiles({ profileType: 'search', filters }));
  };

  if (loadingMeta || status === 'loading') {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10 }}>Loading search filters...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Quick Search Filters</Text>

      {/* AGE */}
      <Text style={styles.label}>Age Range</Text>
      <View style={styles.rangeInputContainer}>
        <TextInput
          placeholder="Min"
          value={form.minAge}
          onChangeText={v => handleFilterChange('minAge', v)}
          style={styles.rangeInput}
          keyboardType="numeric"
        />
        <Text style={styles.rangeSeparator}>to</Text>
        <TextInput
          placeholder="Max"
          value={form.maxAge}
          onChangeText={v => handleFilterChange('maxAge', v)}
          style={styles.rangeInput}
          keyboardType="numeric"
        />
      </View>

      {/* HEIGHT */}
      <Text style={styles.label}>
        Height: {form.minHeight} cm to {form.maxHeight} cm
      </Text>
      <Slider
        style={styles.slider}
        minimumValue={MIN_HEIGHT_CM}
        maximumValue={MAX_HEIGHT_CM}
        step={1}
        value={form.minHeight}
        onValueChange={v =>
          handleFilterChange('minHeight', Math.min(v, form.maxHeight))
        }
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor={COLORS.gray}
        thumbTintColor={COLORS.primary}
      />
      <Slider
        style={styles.slider}
        minimumValue={MIN_HEIGHT_CM}
        maximumValue={MAX_HEIGHT_CM}
        step={1}
        value={form.maxHeight}
        onValueChange={v =>
          handleFilterChange('maxHeight', Math.max(v, form.minHeight))
        }
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor={COLORS.gray}
        thumbTintColor={COLORS.primary}
      />

      {/* MARITAL STATUS */}
      <PartnerMultiSelect
        label="Marital Status"
        value={form.maritalStatus || []}
        onChange={v => handleFilterChange('maritalStatus', v)}
        data={[
          { value: 'Never Married', label: 'Never Married' },
          { value: 'Divorced', label: 'Divorced' },
          { value: 'Widowed', label: 'Widowed' },
        ]}
        placeholder="Select Marital Status"
      />

      <PartnerMultiSelect
        label="Religion"
        value={form.religion || []}
        onChange={v => handleFilterChange('religion', v)}
        data={formatSimple(meta?.religions)}
        placeholder="Select Religion"
      />
      {/* ANNUAL INCOME */}
      <Text style={styles.label}>Annual Income</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 5 Lakh"
        placeholderTextColor={COLORS.gray}
        value={form.annualIncome}
        onChangeText={v => handleFilterChange('annualIncome', v)}
      />

      {/* SEARCH BUTTON */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleSearch}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>Search</Text>
        )}
      </TouchableOpacity>

      {/* RESULTS */}
      {status !== 'loading' && profiles.length > 0 ? (
        <>
          <Text style={styles.resultsTitle}>Results ({profiles.length})</Text>
          <FlatList
            data={profiles}
            renderItem={({ item }) => <MatchCard item={item} />}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContainer}
            scrollEnabled={false}
          />
        </>
      ) : status !== 'loading' && profiles.length === 0 ? (
        <Text style={styles.noResults}>No matching profiles found.</Text>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: SIZES.padding, backgroundColor: COLORS.white },
  sectionTitle: { ...FONTS.h3, color: COLORS.primary, marginBottom: 10 },
  label: { ...FONTS.body4, color: COLORS.darkGray, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: SIZES.radius,
    padding: SIZES.padding / 2,
    marginBottom: SIZES.base,
    ...FONTS.body4,
  },
  rangeInputContainer: { flexDirection: 'row', alignItems: 'center' },
  rangeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: SIZES.radius,
    padding: SIZES.padding / 2,
    ...FONTS.body4,
    textAlign: 'center',
    marginHorizontal: SIZES.base / 2,
  },
  rangeSeparator: { ...FONTS.body3, color: COLORS.darkGray },
  rangeSliderContainer: { marginVertical: SIZES.base },
  slider: { width: '100%', height: 40 },
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
  button: {
    width: '100%',
    paddingVertical: 15,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: 10,
  },
  dropdown: {
    height: 50,
    borderColor: COLORS.gray,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: COLORS.white,
  },
  placeholderStyle: { fontSize: 16, color: COLORS.darkGray },
  selectedTextStyle: { fontSize: 14, color: COLORS.darkGray },
  iconStyle: { width: 20, height: 20 },
  inputSearchStyle: { height: 40, fontSize: 14, color: COLORS.darkGray },
  selectedStyle: {
    borderRadius: 8,
    backgroundColor: '#fff',
    borderColor: COLORS.primary,
    borderWidth: 1,
  },

  buttonText: { color: COLORS.white, ...FONTS.h4 },
  resultsTitle: { ...FONTS.h3, color: COLORS.black, marginVertical: 10 },
  noResults: { textAlign: 'center', color: COLORS.gray, marginTop: 20 },
  listContainer: { paddingBottom: 40 },
  card: {
    marginVertical: 8,
    height: 400,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.lightGray,
    overflow: 'hidden',
  },
  imageBackground: { flex: 1, justifyContent: 'flex-end' },
  overlay: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 10 },
  name: { ...FONTS.h2, color: COLORS.white },
  details: { ...FONTS.body3, color: COLORS.white },
});

export default NormalSearch;
