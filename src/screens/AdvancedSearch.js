import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  Alert,
  Animated,
  Easing,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal, // Added Modal
} from "react-native";
import { LanguageContext } from '../contexts/LanguageContext';

import axios from "axios";
import Slider from "@react-native-community/slider";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDispatch, useSelector } from "react-redux";
import { setFilters } from "../redux/slices/searchSlice";
import { fetchProfiles } from "../redux/slices/profilesSlice";

import { API_BASE_URL } from "../constants/config";
import { COLORS, SIZES, FONTS } from "../constants/theme";
import MatchCard from "../components/MatchCard";
import SkeletonForm from "../components/SkeletonForm";
import SkeletonMatch from "../components/SkeletonMatch";
import i18n from "../localization/i18n";
import FloatingLabelInput from "../components/FloatingLabelInput";
import SelectionModal from "../components/SelectionModal";

import Icon from "react-native-vector-icons/FontAwesome";
import FeatherIcon from "react-native-vector-icons/Feather";
import Ionicons from "react-native-vector-icons/Ionicons";

const META_API_BASE_URL = `${API_BASE_URL}/api/meta`;

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// =========================
// CustomPicker Component
// =========================
const CustomPicker = ({
  label,
  value,
  onValueChange,
  data = [],
  multiSelect = true,
  placeholder,
  searchable = true, // Default to true for most long lists
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  // Animation value: 1 if has value, 0 otherwise. 
  // We can treat "modal open" as focused to lift label.
  const animatedValue = useRef(new Animated.Value((value && value.length > 0) ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: (modalVisible || (value && value.length > 0)) ? 1 : 0,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  }, [modalVisible, value]);

  const labelStyle = {
    position: 'absolute',
    left: 16, // Align with padding
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -10], // Centered at rest (approx), float to top
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [15, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [COLORS.gray, COLORS.primary],
    }),
    backgroundColor: '#FAFAFA', // Match input background if possible, or whitespace
    paddingHorizontal: 4,
    zIndex: 1,
    fontFamily: FONTS.body3.fontFamily,
  };

  // Logic to display text
  const getDisplayValue = () => {
    if (!value || (Array.isArray(value) && value.length === 0)) return "";

    if (Array.isArray(value)) {
      // Filter data to find selected items
      const selectedItems = data.filter(d => value.includes(d.value));
      return selectedItems.map(i => i.name).join(", ");
    } else {
      const item = data.find(d => d.value === value);
      return item ? item.name : "";
    }
  };

  const displayValue = getDisplayValue();

  return (
    <View style={styles.inputContainer}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
        style={[styles.pickerBox, modalVisible && styles.pickerBoxFocused]}
      >
        <Animated.Text style={labelStyle} pointerEvents="none">
          {label}
        </Animated.Text>

        <Text numberOfLines={1} style={styles.pickerText}>
          {displayValue}
        </Text>

        <View style={styles.iconContainer}>
          <FeatherIcon name="chevron-down" size={20} color={COLORS.gray} />
        </View>
      </TouchableOpacity>

      <SelectionModal
        visible={modalVisible}
        title={label}
        options={data}
        onClose={() => setModalVisible(false)}
        onSelect={onValueChange}
        selectedValue={value}
        multiSelect={multiSelect}
        searchable={searchable}
      />
    </View>
  );
};

// =========================
// MAIN COMPONENT
// =========================
const AdvancedSearch = () => {
  const dispatch = useDispatch();
  const { search: results, status } = useSelector(
    (state) => state.profiles
  );
  const { language } = useContext(LanguageContext);
  const [meta, setMeta] = useState({});
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false); // Default hidden
  const scrollRef = useRef(null);

  const openFilters = () => {
    setFilterVisible(true);
  };

  const closeFilters = () => {
    setFilterVisible(false);
  };

  // ------------------------------------
  // FORM STATE
  // ------------------------------------
  const [form, setForm] = useState({
    minAge: 18,
    maxAge: 40,
    minHeight: 120,
    maxHeight: 200,

    maritalStatus: [],
    children: [],

    religion: [],
    caste: [],
    subCaste: [],
    gotra: [],
    motherTongue: [],
    raasi: [],
    location: [],
    education: [],
    profession: [],
    manglik: [],
    diet: [],
    smoking: [],
    drinking: [],
    familyType: [],
    familyValues: [],
    annualIncome: "",
  });

  // =========================
  // Fetch Meta Data
  // =========================
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const { data } = await axios.get(`${META_API_BASE_URL}/profile-meta`);
        setMeta(data);
      } catch (err) {
        Alert.alert(
          i18n.t('common.error'),
          i18n.t('advancedSearch.messages.metaError')
        );

      } finally {
        setLoadingMeta(false);
      }
    };
    loadMeta();
  }, []);

  // 🔥 RESET CHILDREN WHEN NEVER MARRIED
  useEffect(() => {
    if (form.maritalStatus.includes("Never Married")) {
      setForm((f) => ({ ...f, children: [] }));
    }
  }, [form.maritalStatus]);

  // =========================
  // Formatters (Updated to return 'name' instead of 'label')
  // =========================
  const formatSimple = (arr) =>
    (arr || []).map((i) => ({ name: i.name, value: i._id }));

  const formatEducation = (arr) =>
    (arr || []).map((i) => ({
      name: `${i.degree}${i.field ? ` (${i.field})` : ""}`,
      value: i._id,
    }));

  const formatLocation = (arr) =>
    (arr || []).map((i) => ({
      name: `${i.city}, ${i.state}`,
      value: i._id,
    }));

  const formatProfession = (arr) =>
    (arr || []).map((i) => ({
      name: `${i.occupation}, ${i.industry}`,
      value: i._id,
    }));

  // =========================
  // Handle Select Changes
  // =========================
  const handleFilterChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: Array.isArray(value) ? value : [value],
    }));
  };

  // =========================
  // SEARCH BUTTON
  // =========================
  const handleSearch = () => {
    const filters = {
      ...form,
      minAge: Number(form.minAge),
      maxAge: Number(form.maxAge),
      minHeight: Number(form.minHeight),
      maxHeight: Number(form.maxHeight),
    };

    Object.keys(filters).forEach((key) => {
      const v = filters[key];
      if (!v || (Array.isArray(v) && v.length === 0)) delete filters[key];
    });

    setFilterVisible(false); // Minimized on search
    dispatch(setFilters(filters));
    dispatch(fetchProfiles({ profileType: "search", filters }));

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  // =========================
  // Static Options (name/value)
  // =========================
  const MARITAL_STATUS_OPTS = [
    { name: "Never Married", value: "Never Married" },
    { name: "Divorced", value: "Divorced" },
    { name: "Widowed", value: "Widowed" },
  ];
  const CHILDREN_OPTS = [
    { name: "No Children", value: "No Children" },
    { name: "1 Child", value: "1 Child" },
    { name: "2 Children", value: "2 Children" },
    { name: "3+ Children", value: "3+ Children" },
  ];
  const YES_NO_OPTS = [
    { name: "Yes", value: "Yes" },
    { name: "No", value: "No" }
  ];
  const VEG_OPTS = [
    { name: "Vegetarian", value: "Vegetarian" },
    { name: "Non-Vegetarian", value: "Non-Vegetarian" }
  ];
  const FAMILY_TYPE_OPTS = [
    { name: "Nuclear", value: "Nuclear" },
    { name: "Joint", value: "Joint" }
  ];
  const FAMILY_VALUES_OPTS = [
    { name: "Traditional", value: "Traditional" },
    { name: "Liberal", value: "Liberal" }
  ];

  // =========================
  // Render
  // =========================
  if (loadingMeta)
    return (
      <View style={{ flex: 1, padding: SIZES.padding }}>
        <SkeletonForm rows={10} />
      </View>
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>

      <TouchableOpacity
        style={[styles.filterHeader, { marginHorizontal: SIZES.padding / 1.5, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray }]}
        onPress={openFilters}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FeatherIcon name="filter" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.filterTitle}>{i18n.t('advancedSearch.title') || 'Search Filters'}</Text>
        </View>
        <FeatherIcon name="chevron-right" size={24} color={COLORS.gray} />
      </TouchableOpacity>

      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>

        {false && (
          <View>
            {/* AGE */}
            <Text style={styles.sectionTitle}>
              {i18n.t('advancedSearch.sections.ageHeight', { lng: language })}
            </Text>

            <View style={styles.rangeInputContainer}>
              <TextInput
                style={styles.rangeInput}
                keyboardType="numeric"
                value={String(form.minAge)}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, minAge: v.replace(/[^0-9]/g, "") }))
                }
              />
              <Text style={styles.rangeSeparator}>
                {i18n.t('advancedSearch.units.to', { lng: language })}
              </Text>
              <TextInput
                style={styles.rangeInput}
                keyboardType="numeric"
                value={String(form.maxAge)}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, maxAge: v.replace(/[^0-9]/g, "") }))
                }
              />
            </View>

            <Text style={styles.label}>
              {i18n.t('advancedSearch.labels.heightRange')}: {form.minHeight} cm - {form.maxHeight} cm
            </Text>

            <View style={styles.rangeSliderContainer}>
              <Slider
                minimumValue={120}
                maximumValue={220}
                step={1}
                value={form.minHeight}
                onValueChange={(v) => setForm((f) => ({ ...f, minHeight: v }))}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor={COLORS.lightGray}
                thumbTintColor={COLORS.primary}
              />
              <Slider
                minimumValue={120}
                maximumValue={220}
                step={1}
                value={form.maxHeight}
                onValueChange={(v) => setForm((f) => ({ ...f, maxHeight: v }))}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor={COLORS.lightGray}
                thumbTintColor={COLORS.primary}
              />
            </View>

            {/* BACKGROUND */}
            <Text style={styles.sectionTitle}>
              {i18n.t('advancedSearch.sections.background')}
            </Text>

            <CustomPicker
              label={i18n.t('advancedSearch.filters.religion')}
              value={form.religion}
              onValueChange={(v) => handleFilterChange("religion", v)}
              data={formatSimple(meta.religions)}
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.caste')}
              value={form.caste}
              onValueChange={(v) => handleFilterChange("caste", v)}
              data={formatSimple(meta.castes)}
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.subCaste')}
              value={form.subCaste}
              onValueChange={(v) => handleFilterChange("subCaste", v)}
              data={formatSimple(meta.subCastes)}
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.gotra')}
              value={form.gotra}
              onValueChange={(v) => handleFilterChange("gotra", v)}
              data={formatSimple(meta.gotras)}
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.motherTongue')}
              value={form.motherTongue}
              onValueChange={(v) => handleFilterChange("motherTongue", v)}
              data={formatSimple(meta.motherTongues)}
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.raasi')}
              value={form.raasi}
              onValueChange={(v) => handleFilterChange("raasi", v)}
              data={formatSimple(meta.raasis)}
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.location')}
              value={form.location}
              onValueChange={(v) => handleFilterChange("location", v)}
              data={formatLocation(meta.locations)}
            />

            {/* MARITAL STATUS */}
            <CustomPicker
              label={i18n.t('advancedSearch.filters.maritalStatus')}
              value={form.maritalStatus}
              onValueChange={(v) => handleFilterChange("maritalStatus", v)}
              data={MARITAL_STATUS_OPTS}
            />

            {/* CHILDREN (ONLY WHEN NOT NEVER MARRIED) */}
            {form.maritalStatus.length > 0 &&
              !form.maritalStatus.includes("Never Married") && (
                <CustomPicker
                  label={i18n.t('advancedSearch.filters.children')}
                  value={form.children}
                  onValueChange={(v) => handleFilterChange("children", v)}
                  data={CHILDREN_OPTS}
                />
              )}

            <CustomPicker label={i18n.t('advancedSearch.filters.manglik')} value={form.manglik} onValueChange={(v) => handleFilterChange("manglik", v)} data={YES_NO_OPTS} searchable={false} />
            <CustomPicker label={i18n.t('advancedSearch.filters.education')} value={form.education} onValueChange={(v) => handleFilterChange("education", v)} data={formatEducation(meta.educations)} />
            <CustomPicker label={i18n.t('advancedSearch.filters.profession')} value={form.profession} onValueChange={(v) => handleFilterChange("profession", v)} data={formatProfession(meta.professions)} />

            {/* INCOME */}
            <FloatingLabelInput
              label={i18n.t('advancedSearch.labels.annualIncome')}
              value={form.annualIncome}
              onChangeText={(v) => setForm(f => ({ ...f, annualIncome: v }))}
              keyboardType="numeric"
            />

            <CustomPicker label={i18n.t('advancedSearch.filters.diet')} value={form.diet} onValueChange={(v) => handleFilterChange("diet", v)} data={VEG_OPTS} searchable={false} />
            <CustomPicker label={i18n.t('advancedSearch.filters.smoking')} value={form.smoking} onValueChange={(v) => handleFilterChange("smoking", v)} data={YES_NO_OPTS} searchable={false} />
            <CustomPicker label={i18n.t('advancedSearch.filters.drinking')} value={form.drinking} onValueChange={(v) => handleFilterChange("drinking", v)} data={YES_NO_OPTS} searchable={false} />
            <CustomPicker label={i18n.t('advancedSearch.filters.familyType')} value={form.familyType} onValueChange={(v) => handleFilterChange("familyType", v)} data={FAMILY_TYPE_OPTS} searchable={false} />
            <CustomPicker label={i18n.t('advancedSearch.filters.familyValues')} value={form.familyValues} onValueChange={(v) => handleFilterChange("familyValues", v)} data={FAMILY_VALUES_OPTS} searchable={false} />

            <TouchableOpacity style={styles.button} onPress={handleSearch}>
              <Text style={styles.buttonText}>
                {i18n.t('advancedSearch.buttons.search')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* RESULTS */}
        <View style={{ marginTop: 20 }}>
          {status === 'loading' ? (
            <SkeletonMatch count={2} />
          ) : results?.length > 0 ? (
            <FlatList
              data={results}
              renderItem={({ item }) => <MatchCard item={item} />}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.noResultBox}>
              <Icon name="search" size={40} color={COLORS.gray} />
              <Text style={styles.noResultsText}>
                {i18n.t('advancedSearch.messages.noResults')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FILTER MODAL */}
      <Modal visible={filterVisible} animationType="slide" onRequestClose={closeFilters}>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
          <View style={[styles.filterHeader, { paddingHorizontal: SIZES.padding, marginHorizontal: SIZES.padding }]}>
            <Text style={styles.filterTitle}>{i18n.t('advancedSearch.title') || 'Search Filters'}</Text>
            <TouchableOpacity onPress={closeFilters} style={{ padding: 5, backgroundColor: '#F5F5F5', borderRadius: 20 }}>
              <Ionicons name="close" size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 50 }} style={{ flex: 1, paddingHorizontal: SIZES.padding }}>

            {/* AGE */}
            <Text style={styles.sectionTitle}>
              {i18n.t('advancedSearch.sections.ageHeight', { lng: language })}
            </Text>

            <View style={styles.rangeInputContainer}>
              <TextInput
                style={styles.rangeInput}
                keyboardType="numeric"
                value={String(form.minAge)}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, minAge: v.replace(/[^0-9]/g, "") }))
                }
              />
              <Text style={styles.rangeSeparator}>
                {i18n.t('advancedSearch.units.to', { lng: language })}
              </Text>
              <TextInput
                style={styles.rangeInput}
                keyboardType="numeric"
                value={String(form.maxAge)}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, maxAge: v.replace(/[^0-9]/g, "") }))
                }
              />
            </View>

            <Text style={styles.label}>
              {i18n.t('advancedSearch.labels.heightRange')}: {form.minHeight} cm - {form.maxHeight} cm
            </Text>

            <View style={styles.rangeSliderContainer}>
              <Slider
                minimumValue={120}
                maximumValue={220}
                step={1}
                value={form.minHeight}
                onValueChange={(v) => setForm((f) => ({ ...f, minHeight: v }))}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor={COLORS.lightGray}
                thumbTintColor={COLORS.primary}
              />
              <Slider
                minimumValue={120}
                maximumValue={220}
                step={1}
                value={form.maxHeight}
                onValueChange={(v) => setForm((f) => ({ ...f, maxHeight: v }))}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor={COLORS.lightGray}
                thumbTintColor={COLORS.primary}
              />
            </View>

            {/* BACKGROUND */}
            <Text style={styles.sectionTitle}>
              {i18n.t('advancedSearch.sections.background')}
            </Text>

            <CustomPicker
              label={i18n.t('advancedSearch.filters.religion')}
              value={form.religion}
              onValueChange={(v) => handleFilterChange("religion", v)}
              data={formatSimple(meta.religions)}
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.caste')}
              value={form.caste}
              onValueChange={(v) => handleFilterChange("caste", v)}
              data={formatSimple(meta.castes)}
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.subCaste')}
              value={form.subCaste}
              onValueChange={(v) => handleFilterChange("subCaste", v)}
              data={formatSimple(meta.subCastes)}
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.gotra')}
              value={form.gotra}
              onValueChange={(v) => handleFilterChange("gotra", v)}
              data={formatSimple(meta.gotras)}
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.motherTongue')}
              value={form.motherTongue}
              onValueChange={(v) => handleFilterChange("motherTongue", v)}
              data={formatSimple(meta.motherTongues)}
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.raasi')}
              value={form.raasi}
              onValueChange={(v) => handleFilterChange("raasi", v)}
              data={formatSimple(meta.raasis)}
            />
            <CustomPicker
              label={i18n.t('advancedSearch.filters.location')}
              value={form.location}
              onValueChange={(v) => handleFilterChange("location", v)}
              data={formatLocation(meta.locations)}
            />

            {/* MARITAL STATUS */}
            <CustomPicker
              label={i18n.t('advancedSearch.filters.maritalStatus')}
              value={form.maritalStatus}
              onValueChange={(v) => handleFilterChange("maritalStatus", v)}
              data={MARITAL_STATUS_OPTS}
            />

            {/* CHILDREN (ONLY WHEN NOT NEVER MARRIED) */}
            {form.maritalStatus.length > 0 &&
              !form.maritalStatus.includes("Never Married") && (
                <CustomPicker
                  label={i18n.t('advancedSearch.filters.children')}
                  value={form.children}
                  onValueChange={(v) => handleFilterChange("children", v)}
                  data={CHILDREN_OPTS}
                />
              )}

            <CustomPicker label={i18n.t('advancedSearch.filters.manglik')} value={form.manglik} onValueChange={(v) => handleFilterChange("manglik", v)} data={YES_NO_OPTS} searchable={false} />
            <CustomPicker label={i18n.t('advancedSearch.filters.education')} value={form.education} onValueChange={(v) => handleFilterChange("education", v)} data={formatEducation(meta.educations)} />
            <CustomPicker label={i18n.t('advancedSearch.filters.profession')} value={form.profession} onValueChange={(v) => handleFilterChange("profession", v)} data={formatProfession(meta.professions)} />

            {/* INCOME */}
            <FloatingLabelInput
              label={i18n.t('advancedSearch.labels.annualIncome')}
              value={form.annualIncome}
              onChangeText={(v) => setForm(f => ({ ...f, annualIncome: v }))}
              keyboardType="numeric"
            />

            <CustomPicker label={i18n.t('advancedSearch.filters.diet')} value={form.diet} onValueChange={(v) => handleFilterChange("diet", v)} data={VEG_OPTS} searchable={false} />
            <CustomPicker label={i18n.t('advancedSearch.filters.smoking')} value={form.smoking} onValueChange={(v) => handleFilterChange("smoking", v)} data={YES_NO_OPTS} searchable={false} />
            <CustomPicker label={i18n.t('advancedSearch.filters.drinking')} value={form.drinking} onValueChange={(v) => handleFilterChange("drinking", v)} data={YES_NO_OPTS} searchable={false} />
            <CustomPicker label={i18n.t('advancedSearch.filters.familyType')} value={form.familyType} onValueChange={(v) => handleFilterChange("familyType", v)} data={FAMILY_TYPE_OPTS} searchable={false} />
            <CustomPicker label={i18n.t('advancedSearch.filters.familyValues')} value={form.familyValues} onValueChange={(v) => handleFilterChange("familyValues", v)} data={FAMILY_VALUES_OPTS} searchable={false} />

            <TouchableOpacity style={styles.button} onPress={handleSearch}>
              <Text style={styles.buttonText}>
                {i18n.t('advancedSearch.buttons.search')}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: SIZES.padding / 1.5,
    backgroundColor: COLORS.white,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 10,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  filterTitle: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
    fontFamily: FONTS.h3.fontFamily,
  },
  sectionTitle: {
    fontSize: 16,
    color: COLORS.black,
    marginTop: 24,
    marginBottom: 16,
    fontWeight: '700',
    fontFamily: FONTS.h3.fontFamily,
    letterSpacing: 0.5,
  },
  label: {
    ...FONTS.body4,
    color: COLORS.darkGray,
    marginTop: 12,
    marginBottom: 8,
    fontWeight: '500'
  },

  // CustomPicker Styles - Modernized
  inputContainer: {
    marginVertical: 8,
    width: '100%',
  },
  pickerBox: {
    height: 58,
    borderWidth: 1,
    borderColor: '#E8E8E8', // Softer border
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#FAFAFA', // Subtle background
  },
  pickerBoxFocused: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: COLORS.white,
  },
  pickerText: {
    fontSize: 15,
    color: COLORS.black,
    fontFamily: FONTS.body3.fontFamily,
    paddingRight: 24,
  },
  iconContainer: {
    position: 'absolute',
    right: 16,
    top: 19,
  },

  // Range/Slider Styles
  rangeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'space-between'
  },
  rangeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    ...FONTS.body3,
    textAlign: 'center',
    height: 50,
    backgroundColor: '#FAFAFA',
    color: COLORS.black,
  },
  rangeSeparator: {
    ...FONTS.body3,
    color: COLORS.darkGray,
    marginHorizontal: 10,
    fontWeight: '500'
  },
  rangeSliderContainer: {
    marginVertical: 10,
    paddingHorizontal: 5
  },

  button: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 30, // Pill shape
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: '600',
    fontFamily: FONTS.h3.fontFamily
  },

  // Results & Errors
  noResultBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  noResultsText: {
    ...FONTS.body4,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 12,
  },
});

export default AdvancedSearch;


