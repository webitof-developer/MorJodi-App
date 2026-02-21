import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { launchImageLibrary } from 'react-native-image-picker';
import { Picker } from '@react-native-picker/picker';
import { MultiSelect, Dropdown } from 'react-native-element-dropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { API_BASE_URL } from '../constants/config';
import Icon from 'react-native-vector-icons/Ionicons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import ModalAlert from '../components/ModalAlert';
import SuccessPopup from '../components/SuccessPopup';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../localization/i18n';
import FloatingLabelInput from '../components/FloatingLabelInput';

import SelectionModal from '../components/SelectionModal';
import DataRequestModal from '../components/DataRequestModal';
import SkeletonForm from '../components/SkeletonForm';

// Assuming you have an Icon library (like react-native-vector-icons) available.
const API_URL = `${API_BASE_URL}/api/user`;
const META_API_BASE_URL = `${API_BASE_URL}/api/meta`;
const REGISTER_DRAFT_KEY = 'register_draft_v1';


const ABOUT_ME_MAX = 500;
const ABOUT_ME_MIN = 50;

const PROFILE_FOR_OPTIONS = [
  { value: 'self', name: 'Self' },
  { value: 'son', name: 'Son' },
  { value: 'daughter', name: 'Daughter' },
  { value: 'brother', name: 'Brother' },
  { value: 'sister', name: 'Sister' },
  { value: 'friend', name: 'Friend' },
  { value: 'relative', name: 'Relative' },
];

// --- Utility Components for Radio/Picker ---
// --- Default Fallback Lists ---
const FATHER_STATUS_OPTIONS = [
  { value: 'Employed', name: 'Employed' },
  { value: 'Business', name: 'Business' },
  { value: 'Retired', name: 'Retired' },
  { value: 'Passed Away', name: 'Passed Away' },
  { value: 'Government Service', name: 'Government Service' },
  { value: 'Private Job', name: 'Private Job' },
  { value: 'Farmer', name: 'Farmer' },
  { value: 'Self Employed', name: 'Self Employed' },
  { value: 'Other', name: 'Other' },
];

const MOTHER_STATUS_OPTIONS = [
  { value: 'Homemaker', name: 'Homemaker' },
  { value: 'Employed', name: 'Employed' },
  { value: 'Business', name: 'Business' },
  { value: 'Retired', name: 'Retired' },
  { value: 'Passed Away', name: 'Passed Away' },
  { value: 'Government Service', name: 'Government Service' },
  { value: 'Private Job', name: 'Private Job' },
  { value: 'Self Employed', name: 'Self Employed' },
  { value: 'Other', name: 'Other' },
];

const FAMILY_VALUES_OPTIONS = [
  { value: 'Traditional', name: 'Traditional' },
  { value: 'Moderate', name: 'Moderate' },
  { value: 'Liberal', name: 'Liberal' },
  { value: 'Orthodox', name: 'Orthodox' },
  { value: 'Other', name: 'Other' },
];

const RadioButton = ({ label, selected, onSelect, value }) => (
  <Pressable onPress={() => onSelect(value)} style={styles.radioOption}>
    {/* Use the new Outer/Inner Circle structure */}
    <View
      style={[
        styles.outerCircle,
        selected === value && styles.selectedOuterCircle,
      ]}
    >
      {selected === value && <View style={styles.selectedInnerCircle} />}
    </View>
    <Text style={[styles.toggleText, selected === value && styles.activeText]}>
      {label}
    </Text>
  </Pressable>
);

const CustomPicker = ({
  label,
  selectedValue,
  onValueChange,
  items,
  placeholder,
  searchable = false,
  error = false,
  onRequestAdd,
  disabled = false,
  disabledMessage,
  onDisabledPress,
  multiSelect = false
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const cleanItemName = (name) => {
    return (name || "")
      .replace(/null|undefined/gi, "")
      .replace(/\s*,\s*,/g, ",")
      .replace(/,\s*$/g, "")
      .replace(/^\s*,/g, "")
      .trim();
  };

  const formattedData = (items ?? []).map(item => ({
    name: cleanItemName(item.name),
    value: item.value || item._id,
  }));

  // Check for required asterisk in label to pass to component
  const isRequired = label?.includes('*');
  const cleanLabel = label?.replace(' *', '').trim() || label;

  let displayValue = "";
  if (multiSelect && Array.isArray(selectedValue)) {
    displayValue = formattedData
      .filter(item => selectedValue.includes(item.value))
      .map(item => item.name)
      .join(', ');
  } else {
    const selectedItem = formattedData.find(item => item.value === selectedValue);
    displayValue = selectedItem ? selectedItem.name : "";
  }

  const handlePress = () => {
    if (disabled) {
      if (onDisabledPress) {
        onDisabledPress();
      } else if (disabledMessage) {
        Alert.alert("Notice", disabledMessage);
      }
      return;
    }
    setModalVisible(true);
  };

  return (
    <>
      <View style={{ marginVertical: 10, minHeight: 55 }}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={disabled ? 1 : 0.8}
          style={[
            {
              width: '100%',
              height: 55,
              borderWidth: 1.5,
              borderColor: disabled ? COLORS.lightGray : COLORS.gray,
              borderRadius: 8,
              backgroundColor: disabled ? '#f9f9f9' : COLORS.white,
              opacity: disabled ? 0.7 : 1,
            },
            error && { borderColor: COLORS.primary }
          ]}
        >
          {/* Non-interactive Overlays */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {/* Label */}
            <Text style={{
              position: 'absolute',
              left: 12,
              top: -10,
              fontSize: 12,
              color: disabled ? COLORS.gray : COLORS.primary,
              backgroundColor: disabled ? '#f9f9f9' : COLORS.white,
              paddingHorizontal: 4,
              fontFamily: FONTS.body3.fontFamily,
              flexDirection: 'row',
            }}>
              {cleanLabel}
              {isRequired && <Text style={{ color: disabled ? COLORS.gray : COLORS.primary }}> *</Text>}
            </Text>

            {/* Value */}
            <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 15 }}>
              <Text style={{
                fontSize: 16,
                color: displayValue ? COLORS.black : COLORS.gray,
                fontFamily: FONTS.body3.fontFamily,
              }} numberOfLines={1}>
                {displayValue || placeholder}
              </Text>
            </View>

            {/* Icon */}
            <View style={{ position: 'absolute', right: 15, top: 0, bottom: 0, justifyContent: 'center' }}>
              <Icon
                name="chevron-down"
                size={20}
                color={COLORS.gray}
              />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {!disabled && (
        <SelectionModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title={cleanLabel}
          options={formattedData}
          onSelect={(value) => {
            onValueChange(value);
          }}
          selectedValue={selectedValue}
          searchable={searchable}
          onRequestAdd={onRequestAdd}
          multiSelect={multiSelect}
        />
      )}
    </>
  );
};


// --- Custom Header Component ---
const CustomHeader = ({ title, showBack, onBackPress }) => (
  <View style={styles.headerContainer}>
    {showBack ? (
      <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
        <Icon name="arrow-back" size={23} />
      </TouchableOpacity>
    ) : (
      <View style={styles.backButton} />
    )}

    <Text style={styles.headerTitle}>{title}</Text>

    {/* right spacer to center title */}
    <View style={styles.backButton} />
  </View>
);

const RegisterScreen = ({ navigation }) => {
  const [currentPage, setCurrentPage] = useState(1);
  console.log("RegisterScreen Rendered"); // Debug log
  const [alertState, setAlertState] = useState({
    visible: false,
    title: '',
    message: '',
  });
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loginType, setLoginType] = useState(null);
  const [loading, setLoading] = useState(false);

  const [envConfig, setEnvConfig] = useState({
    emailFound: true,
    mobileFound: true,
  });
  const [countryCode] = useState('+91');

  const [fullName, setFullName] = useState('');

  // Page 2 - Personal Details
  const [profileFor, setProfileFor] = useState('self');

  const [gender, setGender] = useState('Male');
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [height, setHeight] = useState(160);
  const [maritalStatus, setMaritalStatus] = useState('Never Married');
  const [children, setChildren] = useState('No Children');

  // Success/Error Popup State
  const [successPopup, setSuccessPopup] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success'
  });

  const [manglik, setManglik] = useState('Doesnt Matter');

  // Page 3 - Background Details (Meta Data Fields)
  const [allMetaData, setAllMetaData] = useState({});

  const [selectedReligion, setSelectedReligion] = useState('');
  const [selectedCaste, setSelectedCaste] = useState('');
  const [selectedSubCaste, setSelectedSubCaste] = useState('');
  const [gotra, setGotra] = useState('');
  const [showGotraSuggestions, setShowGotraSuggestions] = useState(false);
  const [filteredGotras, setFilteredGotras] = useState([]);
  const [selectedMotherTongue, setSelectedMotherTongue] = useState('');
  const [selectedRaasi, setSelectedRaasi] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('');
  const [selectedEducation, setSelectedEducation] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [aboutMe, setAboutMe] = useState('');

  // Page 4 - Images & Referral
  const [aadharFront, setAadharFront] = useState(null);
  const [aadharBack, setAadharBack] = useState(null);
  const [panFront, setPanFront] = useState(null);
  const [panBack, setPanBack] = useState(null);
  // Unify photos: Index 0 is Main DP, 1-5 are Gallery
  const [profilePhotos, setProfilePhotos] = useState(Array(6).fill(null));
  const [referralCode, setReferralCode] = useState('');

  // Page 5 - Complex Object Fields (Family, Lifestyle, Privacy)
  const [fatherStatus, setFatherStatus] = useState('');
  const [motherStatus, setMotherStatus] = useState('');
  const [brothers, setBrothers] = useState('');
  const [sisters, setSisters] = useState('');
  const [familyType, setFamilyType] = useState('Nuclear');
  const [familyValues, setFamilyValues] = useState('');
  const [familyLocation, setFamilyLocation] = useState('');

  // --- Filtering Logic ---
  const filteredCastes = useMemo(() => {
    if (!selectedReligion) return [];

    const relevant = (allMetaData.castes || []).filter(
      c => (c.religion === selectedReligion || c.religion?._id === selectedReligion) && c.name !== 'Hindu'
    );

    // Deduplicate by name
    const seen = new Set();
    return relevant.filter(item => {
      const duplicate = seen.has(item.name);
      seen.add(item.name);
      return !duplicate;
    });
  }, [allMetaData.castes, selectedReligion]);

  const filteredSubCastes = useMemo(() => {
    if (!selectedCaste) return [];
    const relevant = (allMetaData.subCastes || []).filter(
      sc => sc.caste === selectedCaste || sc.caste?._id === selectedCaste
    );

    // Deduplicate by name
    const seen = new Set();
    return relevant.filter(item => {
      const duplicate = seen.has(item.name);
      seen.add(item.name);
      return !duplicate;
    });
  }, [allMetaData.subCastes, selectedCaste]);

  // Gotras are filtered in handleGotraChange typically via search, but we might want to restrict their pool if needed.
  // Existing handleGotraChange logic uses `allMetaData.gotras`. Let's refine the pool available for search.
  const uniqueGotras = useMemo(() => {
    // 1. Determine source list
    let source = [];
    if (selectedSubCaste) {
      source = (allMetaData.gotras || []).filter(
        g => g.subCaste === selectedSubCaste || g.subCaste?._id === selectedSubCaste
      );
    } else {
      // If no subcaste selected (or available), show ALL unique gotras? 
      // Or filter by selected Caste if possible? 
      // For now, let's use allMetaData.gotras as the pool.
      source = allMetaData.gotras || [];
    }

    // 2. Deduplicate by name
    const seen = new Set();
    return source.filter(item => {
      if (!item.name) return false;
      const cleanName = item.name.trim().toLowerCase();
      if (seen.has(cleanName)) return false;
      seen.add(cleanName);
      return true;
    });
  }, [allMetaData.gotras, selectedSubCaste]);

  // --- Reset Logic as Effects (Hooks) ---
  // --- Explicit Change Handlers (avoid useEffect reset loops) ---
  const handleReligionChange = (val) => {
    setSelectedReligion(val);
    setSelectedCaste('');
    setSelectedSubCaste('');
    setGotra('');
  };

  const handleCasteChange = (val) => {
    setSelectedCaste(val);
    setSelectedSubCaste('');
    setGotra('');
  };

  const handleSubCasteChange = (val) => {
    setSelectedSubCaste(val);
    setGotra('');
  };

  const [diet, setDiet] = useState('Vegetarian');
  const [smoking, setSmoking] = useState('No');
  const [drinking, setDrinking] = useState('No');
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [photoVisibility, setPhotoVisibility] = useState('public');
  const [contactVisibility, setContactVisibility] = useState('private');
  const [errors, setErrors] = useState({});
  const phoneDigits = phoneNumber.replace(/[^0-9]/g, '');
  const isValidEmail = text =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((text || '').trim());
  const phoneError = errors.page1 && loginType === 'phone' && phoneDigits.length < 10;
  const emailError = errors.page1 && loginType === 'email' && !isValidEmail(email);
  const fullNameError = errors.page1 && !fullName;

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [errorMeta, setErrorMeta] = useState(null);
  const [loadingEnv, setLoadingEnv] = useState(false); // Default to false for instant load
  const maxDob = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
  }, []);

  const saveDraft = async (pageOverride = currentPage) => {
    try {
      const draft = {
        currentPage: pageOverride,
        loginType,
        email,
        phoneNumber,
        fullName,
        profileFor,
        gender,
        dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : null,
        height,
        maritalStatus,
        children,
        manglik,
        selectedReligion,
        selectedCaste,
        selectedSubCaste,
        maritalStatus,
        children,
        manglik,
        selectedReligion,
        selectedCaste,
        selectedSubCaste,
        gotra,
        selectedMotherTongue,
        selectedRaasi,
        selectedProfession,
        selectedEducation,
        selectedLocation,
        aadharFront,
        aadharBack,
        panFront,
        panBack,

        profilePhotos, // Unified array
        referralCode,
        fatherStatus,
        motherStatus,
        brothers,
        sisters,
        familyType,
        familyValues,
        familyLocation,
        diet,
        smoking,
        drinking,
        profileVisibility,
        photoVisibility,
        contactVisibility,
        annualIncome,
        aboutMe,
      };
      await AsyncStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(draft));
    } catch (err) {
      // non-blocking
    }
  };

  const loadDraft = async () => {
    try {
      const raw = await AsyncStorage.getItem(REGISTER_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.loginType) setLoginType(draft.loginType);
      if (draft.email) setEmail(draft.email);
      if (draft.phoneNumber) setPhoneNumber(draft.phoneNumber);
      if (draft.fullName) setFullName(draft.fullName);
      if (draft.profileFor) setProfileFor(draft.profileFor);
      if (draft.gender) setGender(draft.gender);
      if (draft.dateOfBirth) setDateOfBirth(new Date(draft.dateOfBirth));
      if (draft.height) setHeight(draft.height);
      if (draft.maritalStatus) setMaritalStatus(draft.maritalStatus);
      if (draft.children) setChildren(draft.children);
      if (draft.manglik) setManglik(draft.manglik);
      if (draft.selectedReligion) setSelectedReligion(draft.selectedReligion);
      if (draft.selectedCaste) setSelectedCaste(draft.selectedCaste);
      if (draft.selectedSubCaste) setSelectedSubCaste(draft.selectedSubCaste);
      if (draft.gotra) setGotra(draft.gotra);
      if (draft.selectedMotherTongue) setSelectedMotherTongue(draft.selectedMotherTongue);
      if (draft.selectedRaasi) setSelectedRaasi(draft.selectedRaasi);
      if (draft.selectedProfession) setSelectedProfession(draft.selectedProfession);
      if (draft.selectedEducation) setSelectedEducation(draft.selectedEducation);
      if (draft.selectedLocation) setSelectedLocation(draft.selectedLocation);
      if (draft.aadharFront) setAadharFront(draft.aadharFront);
      if (draft.aadharBack) setAadharBack(draft.aadharBack);
      if (draft.panFront) setPanFront(draft.panFront);
      if (draft.panBack) setPanBack(draft.panBack);

      // Unified Photos Migration Logic
      if (draft.profilePhotos && Array.isArray(draft.profilePhotos)) {
        // If coming from old draft with profileImage separate
        let photos = [...draft.profilePhotos];
        // Ensure size 6
        while (photos.length < 6) photos.push(null);

        if (draft.profileImage && !photos[0]) {
          photos[0] = draft.profileImage;
        }
        setProfilePhotos(photos);
      } else if (draft.profileImage) {
        // Only profileImage exists
        const photos = Array(6).fill(null);
        photos[0] = draft.profileImage;
        setProfilePhotos(photos);
      }

      if (draft.referralCode) setReferralCode(draft.referralCode);
      if (draft.fatherStatus) setFatherStatus(draft.fatherStatus);
      if (draft.motherStatus) setMotherStatus(draft.motherStatus);
      if (draft.brothers) setBrothers(draft.brothers);
      if (draft.sisters) setSisters(draft.sisters);
      if (draft.familyType) setFamilyType(draft.familyType);
      if (draft.familyValues) setFamilyValues(draft.familyValues);
      if (draft.familyLocation) setFamilyLocation(draft.familyLocation);
      if (draft.diet) setDiet(draft.diet);
      if (draft.smoking) setSmoking(draft.smoking);
      if (draft.drinking) setDrinking(draft.drinking);
      if (draft.profileVisibility) setProfileVisibility(draft.profileVisibility);
      if (draft.photoVisibility) setPhotoVisibility(draft.photoVisibility);
      if (draft.contactVisibility) setContactVisibility(draft.contactVisibility);
      if (draft.annualIncome) setAnnualIncome(draft.annualIncome);
      if (draft.aboutMe) setAboutMe(draft.aboutMe);
      if (draft.currentPage) setCurrentPage(draft.currentPage);
    } catch (err) {
      // ignore bad drafts
    }
  };

  const showAlert = (title, message) =>
    setAlertState({ visible: true, title, message });
  const hideAlert = () => setAlertState(prev => ({ ...prev, visible: false }));

  useEffect(() => {
    const fetchMetaData = async () => {
      try {
        const profileMetaResponse = await axios.get(
          `${META_API_BASE_URL}/profile-meta`,
        );
        // console.log(`profileMetaResponse`, profileMetaResponse.data)
        setAllMetaData(profileMetaResponse.data);
      } catch (err) {
        setErrorMeta('Failed to fetch meta data');
        // //console.error(err);
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchMetaData();
    loadDraft();
  }, []);

  useEffect(() => {
    // Auto-save when images change
    saveDraft();
  }, [profilePhotos]);

  // Resolve Gotra ID to Name
  useEffect(() => {
    if (gotra && allMetaData.gotras && allMetaData.gotras.length > 0) {
      if (/^[0-9a-fA-F]{24}$/.test(gotra)) {
        const found = allMetaData.gotras.find(g => g._id === gotra);
        if (found) {
          setGotra(found.name);
        }
      }
    }
  }, [allMetaData.gotras, gotra]);

  const handleGotraChange = (text) => {
    const cleaned = text.replace(/[^a-zA-Z\s]/g, '');
    setGotra(cleaned);

    if (cleaned.length > 0) {
      // Use availableGotras if subcaste is selected, otherwise fallback to all (or empty if strict)
      // Assuming we want to search broadly if no subcaste, but prompt mentions strict hierarchy.
      // If user says "hierarchy sahi nahi hai", strict filtering is better.
      const source = availableGotras.length > 0 ? availableGotras : allMetaData.gotras || [];

      const matches = source.filter(g =>
        g.name.toLowerCase().includes(cleaned.toLowerCase())
      );
      setFilteredGotras(matches);
      setShowGotraSuggestions(true);
    } else {
      setShowGotraSuggestions(false);
    }
  };
  const pickPhoto = async (setter, multiple = false, targetIndex = -1) => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: (multiple && targetIndex === -1) ? 6 : 1,
        quality: 0.8
      });
      if (result.assets && result.assets.length > 0) {
        if (multiple) {
          setter(prev => {
            const copy = Array.isArray(prev) ? [...prev] : Array(6).fill(null);
            while (copy.length < 6) copy.push(null);
            const uris = result.assets.map(a => a.uri);

            if (targetIndex !== -1) {
              // Targeted update: strict assignment to specific slot
              copy[targetIndex] = uris[0];
            } else {
              // Fill empty slots (fallback or generic add)
              let uriIndex = 0;
              for (let i = 0; i < 6 && uriIndex < uris.length; i++) {
                if (!copy[i]) {
                  copy[i] = uris[uriIndex];
                  uriIndex++;
                }
              }
            }
            return copy;
          });
        } else {
          // Single setter (legacy) - used for ID cards
          if (typeof setter === 'function') {
            setter(result.assets[0].uri);
          }
        }
      }
    } catch (e) { }
  };

  const removePhoto = (index) => {
    setProfilePhotos(prev => {
      const newP = [...prev];
      newP[index] = null;
      return newP;
    });
  };



  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestInitialType, setRequestInitialType] = useState('caste');

  const requestAddCaste = () => {
    setRequestInitialType('caste');
    setRequestModalVisible(true);
  };

  const requestAddSubCaste = () => {
    setRequestInitialType('subcaste');
    setRequestModalVisible(true);
  };

  const requestAddGotra = () => {
    setRequestInitialType('gotra');
    setRequestModalVisible(true);
  };

  const handleDataRequestSubmit = async (type, name) => {
    let parentType = null;
    let parentId = null;

    if (type === 'caste') {
      parentType = 'religion';
      parentId = selectedReligion;
    } else if (type === 'subcaste') {
      parentType = 'caste';
      parentId = selectedCaste;
    } else if (type === 'gotra') {
      parentType = 'subcaste';
      parentId = selectedSubCaste;
      // Fallback to Caste if SubCaste is missing ( Gotra -> Caste link support if desired)
      if (!parentId && selectedCaste) {
        parentType = 'caste';
        parentId = selectedCaste;
      }
    }

    await submitDataRequest(type, name, parentType, parentId);
  };

  const submitDataRequest = async (type, name, parentType, parentId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const config = {};
      if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
      }

      const res = await axios.post(`${API_BASE_URL}/api/data-request/create`, {
        type,
        name,
        parentType,
        parentId
      }, config);
      if (res.data.success) {
        setSuccessPopup({
          visible: true,
          title: "Request Submitted",
          message: `Your request to add ${type} "${name}" has been submitted. It will appear in the list after admin approval.`,
          type: 'success'
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Request failed";
      setSuccessPopup({
        visible: true,
        title: "Error",
        message: msg,
        type: 'error'
      });
    }
  };

  const handleRegister = async () => {
    if (!dateOfBirth) {
      showAlert(
        i18n.t('register.validation'),
        i18n.t('register.placeholders.selectDate'),
      );
      return;
    }
    if (!aboutMe || aboutMe.trim().length < ABOUT_ME_MIN) {
      showAlert(
        i18n.t('register.validation'),
        i18n.t('register.validationtext.aboutMeMin', { min: ABOUT_ME_MIN })
      );
      return; // ⛔ STOP SUBMIT
    }
    try {
      // OPTIMISTIC NAVIGATION: Navigate immediately for "Instant" feel
      navigation.navigate('OtpVerify', {
        email: loginType === 'email' ? email : undefined,
        phoneNumber: loginType === 'phone' ? phoneNumber : undefined,
        type: 'register',
        otpExpires: Date.now() + 5 * 60 * 1000,
      });

      // Defer payload creation to allow navigation transition to start smoothly
      setTimeout(async () => {
        try {
          setLoading(true);
          await saveDraft(currentPage);
          const formData = new FormData();

          // Page 1
          if (loginType === 'email') {
            formData.append('email', email);
          }

          if (loginType === 'phone') {
            formData.append('phoneNumber', phoneNumber);
          }

          formData.append('fullName', fullName);

          // Page 2
          formData.append('profileFor', profileFor);
          formData.append('gender', gender);
          if (dateOfBirth instanceof Date && !isNaN(dateOfBirth)) {
            formData.append('dateOfBirth', dateOfBirth.toISOString().split('T')[0]);
          } else {
            // Fallback or skip. If backend requires it, it might fail there, but app won't crash here.
          }
          formData.append('height', height ? height.toString() : '');
          formData.append('maritalStatus', maritalStatus || '');
          formData.append('children', children || '');
          formData.append('manglik', manglik || '');
          formData.append('gotra', gotra || '');

          // Page 3
          formData.append('religion', selectedReligion || '');
          formData.append('caste', selectedCaste || '');
          formData.append('subCaste', selectedSubCaste || '');
          formData.append('motherTongue', selectedMotherTongue || '');
          formData.append('raasi', selectedRaasi || '');
          formData.append('profession', selectedProfession || '');
          formData.append('education', JSON.stringify(selectedEducation || []));
          formData.append('location', selectedLocation || '');
          formData.append('annualIncome', annualIncome || '');
          formData.append('aboutMe', aboutMe || '');

          // Page 4
          formData.append('referralCode', referralCode || '');

          // Page 5 - Complex fields
          formData.append(
            'familyDetails',
            JSON.stringify({
              fatherStatus: fatherStatus || '',
              motherStatus: motherStatus || '',
              brothers: brothers || '0',
              sisters: sisters || '0',
              familyType: familyType || 'Nuclear',
              familyValues: familyValues || '',
              familyLocation: familyLocation || '',
            }),
          );
          formData.append(
            'lifestyle',
            JSON.stringify({
              diet: diet || 'Vegetarian',
              smoking: smoking || 'No',
              drinking: drinking || 'No',
            }),
          );
          formData.append(
            'privacy',
            JSON.stringify({
              profileVisibility: profileVisibility || 'public',
              photoVisibility: photoVisibility || 'public',
              contactVisibility: contactVisibility || 'private',
            }),
          );

          // Image uploads
          // Main DP is index 0
          if (profilePhotos[0]) {
            formData.append('image', {
              uri: profilePhotos[0],
              name: 'profile_dp.jpg',
              type: 'image/jpeg',
            });
          }

          if (aadharFront) {
            formData.append('aadharFront', {
              uri: aadharFront,
              name: 'aadhar_front.jpg',
              type: 'image/jpeg',
            });
          }
          if (aadharBack) {
            formData.append('aadharBack', {
              uri: aadharBack,
              name: 'aadhar_back.jpg',
              type: 'image/jpeg',
            });
          }

          if (panFront) {
            formData.append('panFront', {
              uri: panFront,
              name: 'pancard_front.jpg',
              type: 'image/jpeg',
            });
          }
          if (panBack) {
            formData.append('panBack', {
              uri: panBack,
              name: 'pancard_back.jpg',
              type: 'image/jpeg',
            });
          }

          // Gallery photos (Index 1 to 5)
          const galleryPhotos = profilePhotos.slice(1).filter(p => p !== null);
          galleryPhotos.forEach((photoUri, index) => {
            if (photoUri) {
              formData.append('photos', {
                uri: photoUri,
                name: `photo_${Date.now()}_${index}.jpg`,
                type: 'image/jpeg',
              });
            }
          });

          // console.log('Sending Registration Data:', formData);

          const response = await axios.post(
            `${API_URL}/register/request-otp`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            },
          );

          // Alert.alert('Success', response.data.message);
          // Alert.alert('Success', response.data.message);
          // Navigation already happened optimistically

        } catch (error) {
          console.log('Registration Error:', error);

          // If failed, go back from OTP screen so user can retry
          navigation.goBack();

          const errorMessage = error.response?.data?.message || error.message || i18n.t('register.registerFailed');
          showAlert(
            i18n.t('register.error'),
            errorMessage,
          );
        } finally {
          setLoading(false);
        }
      }, 50);
    } catch (e) {
      console.log('Registration Setup Error:', e);
      setLoading(false);
    }
  };

  const nextPage = () => {
    let missingFields = [];

    // --- Page 1 Validation ---
    if (currentPage === 1) {
      if (!fullName) missingFields.push(i18n.t('register.labels.fullName'));

      if (!loginType) {
        missingFields.push("Email or Phone Login Method");
      } else {
        if (loginType === 'email') {
          if (!email) missingFields.push(i18n.t('register.labels.email'));
          else if (!isValidEmail(email)) missingFields.push("Valid Email");
        }
        if (loginType === 'phone') {
          const digits = phoneNumber.replace(/[^0-9]/g, '');
          if (!phoneNumber) missingFields.push(i18n.t('auth.phone'));
          else if (digits.length < 10) missingFields.push("Valid Phone Number (10 digits)");
        }
      }

      if (missingFields.length > 0) {
        showAlert(
          i18n.t('register.validation'),
          `Please fill the following required details:\n\n${missingFields.join(', ')}`
        );
        setErrors(prev => ({ ...prev, page1: true }));
        return;
      }
      setErrors(prev => ({ ...prev, page1: false }));
    }

    // --- Page 2 Validation ---
    else if (currentPage === 2) {
      if (!gender) missingFields.push(i18n.t('register.labels.gender'));
      if (!profileFor) missingFields.push(i18n.t('register.labels.profileFor'));
      if (!maritalStatus) missingFields.push(i18n.t('register.labels.maritalStatus'));
      if (!manglik) missingFields.push(i18n.t('register.labels.manglik'));
      if (!dateOfBirth) missingFields.push(i18n.t('register.labels.dob'));
      if (!height) missingFields.push(i18n.t('register.labels.height'));

      // Validate Children only if Marital Status is NOT 'Never Married'
      if (maritalStatus !== 'Never Married' && !children) {
        missingFields.push(i18n.t('register.labels.children'));
      }

      if (missingFields.length > 0) {
        showAlert(
          i18n.t('register.validation'),
          `Please fill the following required details:\n\n${missingFields.join(', ')}`
        );
        setErrors(prev => ({ ...prev, page2: true }));
        return;
      }
      setErrors(prev => ({ ...prev, page2: false }));

      // AGE CHECK – MUST BE 18 OR OLDER
      const today = new Date();
      const dob = new Date(dateOfBirth);
      const age = today.getFullYear() - dob.getFullYear();
      const month = today.getMonth() - dob.getMonth();

      const isUnder18 =
        age < 18 ||
        (age === 18 && month < 0) ||
        (age === 18 && month === 0 && today.getDate() < dob.getDate());

      if (isUnder18) {
        showAlert(i18n.t('register.ageRequirement'), i18n.t('register.ageError'));
        return;
      }
    }

    // --- Page 3 Validation ---
    else if (currentPage === 3) {
      if (!selectedReligion) missingFields.push(i18n.t('register.labels.religion'));
      if (!selectedCaste) missingFields.push(i18n.t('register.labels.caste'));
      if (!selectedMotherTongue) missingFields.push(i18n.t('register.labels.motherTongue'));
      if (!selectedProfession) missingFields.push(i18n.t('register.labels.profession'));
      if (selectedEducation.length === 0) missingFields.push(i18n.t('register.labels.education'));
      if (!selectedLocation) missingFields.push(i18n.t('register.labels.location'));

      if (missingFields.length > 0) {
        showAlert(
          i18n.t('register.validation'),
          `Please fill the following required details:\n\n${missingFields.join(', ')}`
        );
        setErrors(prev => ({ ...prev, page3: true }));
        return;
      }
      setErrors(prev => ({ ...prev, page3: false }));
    }

    // // --- Page 4 Validation ---
    else if (currentPage === 4) {
      // Main Profile (Index 0)
      if (!profilePhotos[0]) {
        showAlert(
          i18n.t('register.validation'),
          "Please upload a main profile display picture."
        );
        return;
      }

      // Total Photos Count
      const validPhotosCount = profilePhotos.filter(p => p !== null).length;
      if (validPhotosCount < 3) {
        showAlert(
          i18n.t('register.validation'),
          "Please upload at least 3 photos (1 Main + 2 Gallery)."
        );
        return;
      }
    }

    // // --- Page 5 Validation (Verification) ---
    else if (currentPage === 5) {
      if (!aadharFront || !aadharBack) {
        showAlert(
          i18n.t('register.validation'),
          "Please upload both front and back sides of Aadhar Card."
        );
        return;
      }
    }

    // --- Page 6 Validation (Family & Lifestyle) ---
    else if (currentPage === 6) {
      if (!fatherStatus) missingFields.push(i18n.t('register.labels.fatherStatus'));
      if (!motherStatus) missingFields.push(i18n.t('register.labels.motherStatus'));
      if (!brothers) missingFields.push(i18n.t('register.labels.brothers'));
      if (!sisters) missingFields.push(i18n.t('register.labels.sisters'));
      if (!familyType) missingFields.push(i18n.t('register.labels.familyType'));
      if (!familyValues) missingFields.push(i18n.t('register.labels.familyValues'));
      if (!diet) missingFields.push(i18n.t('register.labels.diet'));
      if (!annualIncome) missingFields.push(i18n.t('register.labels.income'));
      if (!aboutMe) missingFields.push(i18n.t('register.labels.about'));

      if (missingFields.length > 0) {
        showAlert(
          i18n.t('register.validation'),
          `Please fill the following required details:\n\n${missingFields.join(', ')}`
        );
        setErrors(prev => ({ ...prev, page6: true }));
        return;
      }
      setErrors(prev => ({ ...prev, page6: false }));

      handleRegister();
      return;
    }

    const nextPg = currentPage + 1;
    saveDraft(nextPg);
    setCurrentPage(nextPg);
  };

  const prevPage = () => {
    if (currentPage > 1) {
      const prevPg = currentPage - 1;
      saveDraft(prevPg);
      setCurrentPage(prevPg);
    } else if (currentPage === 1) {
      // Navigate to the Login screen from Step 1
      navigation.navigate('Onboarding');
    }
  };

  const getPageTitle = page => {
    switch (page) {
      case 1:
        return i18n.t('register.page1');
      case 2:
        return i18n.t('register.page2');
      case 3:
        return i18n.t('register.page3');
      case 4:
        return i18n.t('register.page4');
      case 5:
        return i18n.t('register.page5');
      default:
        return i18n.t('register.title');
    }
  };

  const pageTitle = getPageTitle(currentPage);
  // FETCH ENV
  useEffect(() => {
    fetchEnvSettings();
  }, []);

  const fetchEnvSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/env/check-env`);
      const data = await res.json();

      const emailEnabled = data.emailFound;
      const phoneEnabled = data.mobileFound;

      setEnvConfig({ emailFound: emailEnabled, mobileFound: phoneEnabled });

      setLoginType(prev => {
        // If already set (e.g. by draft), check if it's still valid
        if (prev === 'email' && emailEnabled) return prev;
        if (prev === 'phone' && phoneEnabled) return prev;

        // Otherwise set defaults based on availability
        if (emailEnabled && !phoneEnabled) return 'email';
        if (!emailEnabled && phoneEnabled) return 'phone';
        if (emailEnabled && phoneEnabled) return 'phone'; // Default preference
        return null;
      });
    } catch (err) {
      console.log('Env Fetch Error', err);
      setLoginType(null);
    } finally {
      setLoadingEnv(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  // --- Render Functions ---

  const renderPage1 = () => (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.authTitle}>{i18n.t('register.title')}</Text>
      <Text style={styles.authSubtitle}>
        {i18n.t('register.validationtext.page1')}
      </Text>

      {loadingEnv || !loginType ? (
        <View style={{ marginTop: 10 }}>
          <SkeletonForm rows={5} />
        </View>
      ) : (
        <>
          <View style={styles.toggleRowPill}>
            {envConfig.emailFound && (
              <Pressable
                onPress={() => setLoginType('email')}
                style={[
                  styles.togglePill,
                  loginType === 'email' && styles.togglePillActive,
                ]}
              >
                <FeatherIcon
                  name="mail"
                  size={16}
                  color={loginType === 'email' ? COLORS.primary : COLORS.darkGray}
                  style={styles.toggleIcon}
                />
                <Text
                  style={[
                    styles.toggleText,
                    loginType === 'email' && styles.toggleTextActive,
                  ]}
                >
                  {i18n.t('register.labels.email')}
                </Text>
              </Pressable>
            )}

            {envConfig.mobileFound && (
              <Pressable
                onPress={() => setLoginType('phone')}
                style={[
                  styles.togglePill,
                  loginType === 'phone' && styles.togglePillActive,
                ]}
              >
                <FeatherIcon
                  name="smartphone"
                  size={16}
                  color={loginType === 'phone' ? COLORS.primary : COLORS.darkGray}
                  style={styles.toggleIcon}
                />
                <Text
                  style={[
                    styles.toggleText,
                    loginType === 'phone' && styles.toggleTextActive,
                  ]}
                >
                  {i18n.t('auth.phone')}
                </Text>
              </Pressable>
            )}
          </View>

          <FloatingLabelInput
            label={loginType === 'email' ? i18n.t('register.labels.email') : i18n.t('auth.phone')}
            value={loginType === 'email' ? email : phoneNumber}
            onChangeText={text =>
              loginType === 'email'
                ? setEmail(text)
                : setPhoneNumber(text.replace(/[^0-9]/g, '').slice(0, 10))
            }
            keyboardType={loginType === 'phone' ? 'numeric' : 'email-address'}
            required
            containerStyle={(phoneError || emailError) ? { borderColor: 'red' } : {}}
          />

          <FloatingLabelInput
            label={i18n.t('register.labels.fullName')}
            value={fullName}
            onChangeText={setFullName}
            required
            containerStyle={fullNameError ? { borderColor: 'red' } : {}}
          />

          <FloatingLabelInput
            label={`${i18n.t('register.labels.referralCode')} (${i18n.t('register.optional')})`}
            value={referralCode}
            onChangeText={setReferralCode}
          />

          <TouchableOpacity style={styles.nextButton} onPress={nextPage}>
            <Text style={styles.nextButtonText}>{i18n.t('register.next')}</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView >
  );


  const renderPage2 = () => (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>
        {i18n.t('register.labels.gender')} *
      </Text>

      <View style={styles.toggleRowPill}>
        <RadioButton
          label="Male"
          selected={gender}
          onSelect={setGender}
          value="Male"
        />
        <RadioButton
          label="Female"
          selected={gender}
          onSelect={setGender}
          value="Female"
        />
        <RadioButton
          label="Other"
          selected={gender}
          onSelect={setGender}
          value="Other"
        />
      </View>
      {/* Profile For */}
      {/* Profile For */}
      <CustomPicker
        label={i18n.t('register.labels.profileFor')}
        selectedValue={profileFor}
        onValueChange={setProfileFor}
        items={PROFILE_FOR_OPTIONS}
        error={errors.page2 && !profileFor}
      />



      {/* Gender Radio Buttons */}


      {/* Marital Status */}
      <CustomPicker
        label={`${i18n.t('register.labels.maritalStatus')} *`}
        selectedValue={maritalStatus}
        onValueChange={setMaritalStatus}
        items={[
          { value: 'Never Married', name: 'Never Married' },
          { value: 'Divorced', name: 'Divorced' },
          { value: 'Widowed', name: 'Widowed' },
          { value: 'Awaiting Divorce', name: 'Awaiting Divorce' },
        ]}
        placeholder={i18n.t('register.placeholders.selectMaritalStatus')}
        error={errors.page2 && !maritalStatus}

      />
      {maritalStatus !== 'Never Married' && (
        <CustomPicker
          label={i18n.t('register.labels.children')}
          selectedValue={children}
          onValueChange={setChildren}
          items={[
            { value: 'No Children', name: 'No Children' },
            { value: '1 Child', name: '1 Child' },
            { value: '2 Children', name: '2 Children' },
            { value: '3+ Children', name: '3+ Children' },
            { value: 'Prefer not to say', name: 'Prefer not to say' },
          ]}
          placeholder={i18n.t('register.placeholders.selectChildren')}
          error={errors.page2 && maritalStatus !== 'Never Married' && !children}

        />
      )}
      {/* Manglik */}
      <CustomPicker
        label={i18n.t('register.labels.manglik')}
        selectedValue={manglik}
        onValueChange={setManglik}
        items={[
          { value: 'Doesnt Matter', name: "Doesn't Matter" },
          { value: 'Manglik', name: 'Manglik' },
          { value: 'Non Manglik', name: 'Non Manglik' },
          {
            value: 'Angshik (Partial Manglik)',
            name: 'Angshik (Partial Manglik)',
          },
        ]}
        placeholder={i18n.t('register.placeholders.manglikQuestion')}
        error={errors.page2 && !manglik}

      />

      {/* Date of Birth */}
      {/* Date of Birth */}
      <View style={{ marginVertical: 10, minHeight: 55 }}>
        <TouchableOpacity
          onPress={showDatepicker}
          activeOpacity={0.8}
          style={[
            {
              width: '100%',
              height: 55,
              borderWidth: 1.5,
              borderColor: COLORS.gray,
              borderRadius: 8,
              backgroundColor: COLORS.white,
            },
            errors.page2 && !dateOfBirth && { borderColor: COLORS.primary }
          ]}
        >
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {/* Label */}
            <Text style={{
              position: 'absolute',
              left: 12,
              top: -10,
              fontSize: 12,
              color: COLORS.primary,
              backgroundColor: COLORS.white,
              paddingHorizontal: 4,
              fontFamily: FONTS.body3.fontFamily,
              flexDirection: 'row',
            }}>
              {i18n.t('register.labels.dob')}
              <Text style={{ color: COLORS.primary }}> *</Text>
            </Text>

            {/* Value */}
            <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 15 }}>
              <Text style={{
                fontSize: 16,
                color: dateOfBirth ? COLORS.black : COLORS.gray,
                fontFamily: FONTS.body3.fontFamily,
              }} numberOfLines={1}>
                {dateOfBirth ? dateOfBirth.toDateString() : i18n.t('register.placeholders.selectDate')}
              </Text>
            </View>

            {/* Icon */}
            <View style={{ position: 'absolute', right: 15, top: 0, bottom: 0, justifyContent: 'center' }}>
              <FeatherIcon name="calendar" size={20} color={COLORS.gray} />
            </View>
          </View>
        </TouchableOpacity>
      </View>
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={dateOfBirth || maxDob}
          mode={'date'}
          display="default"
          onChange={onDateChange}
          maximumDate={maxDob}
        />
      )}

      {/* Height Slider */}
      <Text style={styles.label}> {`${i18n.t('register.labels.height')}: ${height} cm *`} </Text>
      <Slider
        style={styles.slider}
        minimumValue={120}
        maximumValue={220}
        step={1}
        value={height}
        onValueChange={setHeight}
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor={COLORS.gray}
        thumbTintColor={COLORS.primary}
      />

      <View style={styles.navigationButtons}>
        <TouchableOpacity style={styles.nextButton} onPress={nextPage}>
          <Text style={styles.nextButtonText}>
            {i18n.t('register.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderPage3 = () => (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {loadingMeta ? (
        <SkeletonForm rows={6} />
      ) : errorMeta ? (
        <Text style={{ color: 'red' }}>{errorMeta}</Text>
      ) : (
        <>
          <CustomPicker
            label={`${i18n.t('register.labels.religion')} *`}
            selectedValue={selectedReligion}
            onValueChange={handleReligionChange}
            items={(allMetaData.religions || []).map(item => ({
              value: item._id,
              name: item.name,
            }))}
            placeholder={i18n.t('register.placeholders.selectReligion')}
            searchable
            error={errors.page3 && !selectedReligion}
          />

          <CustomPicker
            label={`${i18n.t('register.labels.caste')} *`}
            selectedValue={selectedCaste}
            onValueChange={handleCasteChange}
            items={filteredCastes.map(item => ({
              value: item._id,
              name: item.name,
            }))}
            placeholder={i18n.t('register.placeholders.selectCaste')}
            searchable
            error={errors.page3 && !selectedCaste}
            onRequestAdd={requestAddCaste}
            disabled={!selectedReligion}
            onDisabledPress={() => setSuccessPopup({
              visible: true,
              title: "Attention",
              message: "Please select a Religion first.",
              type: 'info'
            })}
          />

          <CustomPicker
            label={i18n.t('register.labels.subCaste')}
            selectedValue={selectedSubCaste}
            onValueChange={handleSubCasteChange}
            items={filteredSubCastes.map(item => ({
              value: item._id,
              name: item.name,
            }))}
            placeholder={i18n.t('register.placeholders.selectSubCasteOptional')}
            searchable
            onRequestAdd={requestAddSubCaste}
            disabled={!selectedCaste}
            onDisabledPress={() => setSuccessPopup({
              visible: true,
              title: "Attention",
              message: "Please select a Caste first.",
              type: 'info'
            })}
          />
          <CustomPicker
            label={i18n.t('register.labels.gotra')}
            selectedValue={gotra}
            onValueChange={setGotra}
            items={uniqueGotras.map(item => ({
              value: item._id,
              name: item.name,
            }))}
            placeholder={i18n.t('register.placeholders.selectGotraOptional')}
            searchable
            onRequestAdd={requestAddGotra}
            disabled={!selectedSubCaste}
            onDisabledPress={() => setSuccessPopup({
              visible: true,
              title: "Attention",
              message: "Please select a SubCaste first.",
              type: 'info'
            })}
          />

          <CustomPicker
            label={`${i18n.t('register.labels.motherTongue')} *`}
            selectedValue={selectedMotherTongue}
            onValueChange={setSelectedMotherTongue}
            items={(allMetaData.motherTongues || []).map(item => ({
              value: item._id,
              name: item.name,
            }))}
            placeholder={i18n.t('register.placeholders.selectMotherTongue')}
            error={errors.page3 && !selectedMotherTongue}
          />

          <CustomPicker
            label={i18n.t('register.labels.raasi')}
            selectedValue={selectedRaasi}
            onValueChange={setSelectedRaasi}
            items={(allMetaData.raasis || []).map(item => ({
              value: item._id,
              name: item.name,
            }))}
            placeholder={i18n.t('register.placeholders.selectRaasiOptional')}
            searchable
          />

          <CustomPicker
            label={`${i18n.t('register.labels.profession')} *`}
            selectedValue={selectedProfession}
            onValueChange={setSelectedProfession}
            items={(allMetaData.professions || []).map(item => ({
              value: item._id,
              name: `${item.occupation},${item.industry}`,
            }))}
            placeholder={i18n.t('register.placeholders.selectProfession')}
            searchable
            error={errors.page3 && !selectedProfession}
          />

          <CustomPicker
            label={`${i18n.t('register.labels.education')} *`}
            selectedValue={selectedEducation}
            onValueChange={setSelectedEducation}
            items={(allMetaData.educations || []).map(item => ({
              value: item._id,
              name: `${item.degree || ''} ${item.field ? `(${item.field})` : ''}`,
            }))}
            placeholder={i18n.t('register.placeholders.selectEducation')}
            searchable
            multiSelect={true}
            error={errors.page3 && selectedEducation.length === 0}
          />

          <CustomPicker
            label={`${i18n.t('register.labels.location')} *`}
            selectedValue={selectedLocation}
            onValueChange={setSelectedLocation}
            items={(allMetaData.locations || []).map(item => ({
              value: item._id,
              name: `${item.city}, ${item.state}, ${item.country}`,
            }))}
            placeholder={i18n.t('register.placeholders.selectCurrentLocation')}
            searchable
            error={errors.page3 && !selectedLocation}
          />
        </>
      )}

      <View style={styles.navigationButtons}>
        <TouchableOpacity style={styles.nextButton} onPress={nextPage}>
          <Text style={styles.nextButtonText}>
            {i18n.t('register.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderPage4 = () => (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">



      {/* 1. Gallery Profile Photos (Remaining) */}
      <View style={{ marginVertical: 10 }}>
        <Text style={[styles.authTitle, { fontSize: 18, marginBottom: 2 }]}>
          {i18n.t('register.labels.profilePhotos')} <Text style={{ color: COLORS.primary }}>*</Text>
        </Text>
        <Text style={[styles.authSubtitle, { fontSize: 13, marginBottom: 15 }]}>
          Required minimum 3 images with clear face.
        </Text>

        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}>

          {[...Array(6)].map((_, index) => {
            const photo = profilePhotos[index];
            const photoUri = photo ? (typeof photo === 'string' ? photo : photo.uri) : null;

            return (
              <View key={index} style={{
                width: '31%',
                aspectRatio: 1, // Square
                marginBottom: 10,
                borderRadius: 8,
                overflow: 'hidden',
                backgroundColor: '#F5F5F5' // Light/Dark mode neutral
              }}>
                {photoUri ? (
                  <View style={{ flex: 1 }}>
                    <Image
                      source={{ uri: photoUri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        borderRadius: 12
                      }}
                      onPress={() => removePhoto(index)}
                    >
                      <Icon name="close" size={16} color={COLORS.white} style={{ margin: 2 }} />
                    </TouchableOpacity>
                    {index === 0 && (
                      <View style={{
                        position: 'absolute',
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        width: '100%',
                        paddingVertical: 2,
                        alignItems: 'center'
                      }}>
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>Main Profile</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={{
                      width: '100%',
                      height: '100%',
                      borderWidth: 1,
                      borderColor: COLORS.gray,
                      borderStyle: 'dashed',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => pickPhoto(setProfilePhotos, true, index)} // Call specific index
                  >
                    <Icon name="add" size={30} color={COLORS.gray} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
        <Text style={{ fontSize: 12, color: COLORS.gray, marginTop: 5, textAlign: 'right' }}>
          Max 6 photos / Min 3 photos
        </Text>

        {/* TIPS SECTION */}
        <View style={{ marginTop: 10, alignItems: 'center', opacity: 0.9 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Icon name="bulb-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black }}>
              Here are a few tips
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: COLORS.gray, textAlign: 'center', marginBottom: 20 }}>
            Avoid the following photos to highlight your profile better
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            {/* 1. Blur */}
            <View style={{ alignItems: 'center', width: '23%' }}>
              <View style={{
                width: 50, height: 50, borderRadius: 25, backgroundColor: '#f0f0f0',
                justifyContent: 'center', alignItems: 'center', marginBottom: 6, position: 'relative'
              }}>
                <Icon name="image-outline" size={24} color="#ccc" style={{ opacity: 0.5 }} />
                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#E57373', borderRadius: 10, padding: 2 }}>
                  <Icon name="close" size={10} color="#FFF" />
                </View>
              </View>
              <Text style={{ fontSize: 11, color: COLORS.gray, textAlign: 'center' }}>Blur photo</Text>
            </View>

            {/* 2. Side */}
            <View style={{ alignItems: 'center', width: '23%' }}>
              <View style={{
                width: 50, height: 50, borderRadius: 25, backgroundColor: '#f0f0f0',
                justifyContent: 'center', alignItems: 'center', marginBottom: 6, position: 'relative'
              }}>
                <Icon name="person-outline" size={24} color="#ccc" />
                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#E57373', borderRadius: 10, padding: 2 }}>
                  <Icon name="close" size={10} color="#FFF" />
                </View>
              </View>
              <Text style={{ fontSize: 11, color: COLORS.gray, textAlign: 'center' }}>Side face</Text>
            </View>

            {/* 3. Watermark */}
            <View style={{ alignItems: 'center', width: '23%' }}>
              <View style={{
                width: 50, height: 50, borderRadius: 25, backgroundColor: '#f0f0f0',
                justifyContent: 'center', alignItems: 'center', marginBottom: 6, position: 'relative'
              }}>
                <Text style={{ fontSize: 8, color: '#ccc' }}>www.xyz</Text>
                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#E57373', borderRadius: 10, padding: 2 }}>
                  <Icon name="close" size={10} color="#FFF" />
                </View>
              </View>
              <Text style={{ fontSize: 11, color: COLORS.gray, textAlign: 'center' }}>Watermark</Text>
            </View>

            {/* 4. Group */}
            <View style={{ alignItems: 'center', width: '23%' }}>
              <View style={{
                width: 50, height: 50, borderRadius: 25, backgroundColor: '#f0f0f0',
                justifyContent: 'center', alignItems: 'center', marginBottom: 6, position: 'relative'
              }}>
                <Icon name="people-outline" size={24} color="#ccc" />
                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#E57373', borderRadius: 10, padding: 2 }}>
                  <Icon name="close" size={10} color="#FFF" />
                </View>
              </View>
              <Text style={{ fontSize: 11, color: COLORS.gray, textAlign: 'center' }}>Group pic</Text>
            </View>
          </View>

          <Text style={{ marginTop: 25, fontSize: 12, color: COLORS.primary, fontWeight: '600', textAlign: 'center', fontStyle: 'italic' }}>
            "Upload high-quality photos to get 3x more interest & matches!"
          </Text>
        </View>
      </View>

      {/* Referral Code */}
      <View style={styles.navigationButtons}>
        <TouchableOpacity style={styles.nextButton} onPress={nextPage}>
          <Text style={styles.nextButtonText}>
            {i18n.t('register.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );




  const renderPage5 = () => (
    <ScrollView contentContainerStyle={[styles.container, { paddingVertical: 5 }]} keyboardShouldPersistTaps="handled">
      <Text style={[styles.authTitle, { fontSize: 20, marginBottom: 2 }]}>ID Verification</Text>
      <Text style={[styles.authSubtitle, { fontSize: 13, marginBottom: 10 }]}>
        Secure your profile with government ID verification.
      </Text>

      {/* Aadhar Card Block */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 2 }}>
          Aadhar Card <Text style={{ color: COLORS.primary }}>*</Text>
        </Text>
        <Text style={{ fontSize: 12, color: COLORS.gray, marginBottom: 8, lineHeight: 16 }}>
          Your ID is required for profile verification and building trust. Your data is safe & secure.
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {/* Front */}
          <View style={{ width: '48%' }}>
            <View style={{
              aspectRatio: 1.6, // Compact
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: '#F5F5F5',
              borderWidth: 1.5,
              borderStyle: aadharFront ? 'solid' : 'dashed',
              borderColor: COLORS.gray
            }}>
              {aadharFront ? (
                <>
                  <Image source={{ uri: aadharFront }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  <TouchableOpacity
                    style={{ position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 2 }}
                    onPress={() => setAadharFront(null)}
                  >
                    <Icon name="close" size={14} color="#FFF" />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                  onPress={() => pickPhoto(setAadharFront)}
                >
                  <Icon name="camera-outline" size={24} color={COLORS.gray} />
                  <Text style={{ fontSize: 11, color: COLORS.gray, marginTop: 2 }}>Front Side</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Back */}
          <View style={{ width: '48%' }}>
            <View style={{
              aspectRatio: 1.6,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: '#F5F5F5',
              borderWidth: 1.5,
              borderStyle: aadharBack ? 'solid' : 'dashed',
              borderColor: COLORS.gray
            }}>
              {aadharBack ? (
                <>
                  <Image source={{ uri: aadharBack }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  <TouchableOpacity
                    style={{ position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 2 }}
                    onPress={() => setAadharBack(null)}
                  >
                    <Icon name="close" size={14} color="#FFF" />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                  onPress={() => pickPhoto(setAadharBack)}
                >
                  <Icon name="camera-outline" size={24} color={COLORS.gray} />
                  <Text style={{ fontSize: 11, color: COLORS.gray, marginTop: 2 }}>Back Side</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Pan Card Block */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 2 }}>
          PAN Card (Optional)
        </Text>
        <Text style={{ fontSize: 12, color: COLORS.gray, marginBottom: 8 }}>
          Additional verification helps you get more matches.
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {/* Front */}
          <View style={{ width: '48%' }}>
            <View style={{
              aspectRatio: 1.6,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: '#F5F5F5',
              borderWidth: 1.5,
              borderStyle: panFront ? 'solid' : 'dashed',
              borderColor: COLORS.gray
            }}>
              {panFront ? (
                <>
                  <Image source={{ uri: panFront }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  <TouchableOpacity
                    style={{ position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 2 }}
                    onPress={() => setPanFront(null)}
                  >
                    <Icon name="close" size={14} color="#FFF" />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                  onPress={() => pickPhoto(setPanFront)}
                >
                  <Icon name="camera-outline" size={24} color={COLORS.gray} />
                  <Text style={{ fontSize: 11, color: COLORS.gray, marginTop: 2 }}>Front Side</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {/* Back */}
          <View style={{ width: '48%' }}>
            <View style={{
              aspectRatio: 1.6,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: '#F5F5F5',
              borderWidth: 1.5,
              borderStyle: panBack ? 'solid' : 'dashed',
              borderColor: COLORS.gray
            }}>
              {panBack ? (
                <>
                  <Image source={{ uri: panBack }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  <TouchableOpacity
                    style={{ position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 2 }}
                    onPress={() => setPanBack(null)}
                  >
                    <Icon name="close" size={14} color="#FFF" />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                  onPress={() => pickPhoto(setPanBack)}
                >
                  <Icon name="camera-outline" size={24} color={COLORS.gray} />
                  <Text style={{ fontSize: 11, color: COLORS.gray, marginTop: 2 }}>Back Side</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity style={styles.nextButton} onPress={nextPage}>
          <Text style={styles.nextButtonText}>
            {i18n.t('register.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderPage6 = () => (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {loadingMeta ? (
        <SkeletonForm rows={8} />
      ) : errorMeta ? (
        <Text style={{ color: 'red' }}>{errorMeta}</Text>
      ) : (
        <>
          {/* Family Details */}
          <Text style={styles.sectionHeader}>
            {i18n.t('register.labels.familyDetails')} *
          </Text>
          <CustomPicker
            label={`${i18n.t('register.labels.fatherStatus')} *`}
            selectedValue={fatherStatus}
            onValueChange={setFatherStatus}
            items={
              (
                allMetaData.familyDetails?.filter(
                  item => item.category === 'fatherStatus',
                ) || []
              ).length > 0
                ? allMetaData.familyDetails
                  .filter(item => item.category === 'fatherStatus')
                  .map(item => ({
                    value: item.name,
                    name: item.name,
                  }))
                : FATHER_STATUS_OPTIONS
            }
            placeholder={i18n.t('register.placeholders.selectFatherStatus')}
            error={errors.page6 && !fatherStatus}
          />
          <CustomPicker
            label={`${i18n.t('register.labels.motherStatus')} *`}
            selectedValue={motherStatus}
            onValueChange={setMotherStatus}
            items={
              (
                allMetaData.familyDetails?.filter(
                  item => item.category === 'motherStatus',
                ) || []
              ).length > 0
                ? allMetaData.familyDetails
                  .filter(item => item.category === 'motherStatus')
                  .map(item => ({
                    value: item.name,
                    name: item.name,
                  }))
                : MOTHER_STATUS_OPTIONS
            }
            placeholder={i18n.t('register.placeholders.selectMotherStatus')}
            error={errors.page6 && !motherStatus}
          />
          <FloatingLabelInput
            value={brothers}
            onChangeText={setBrothers}
            label={i18n.t('register.labels.brothers')}
            required
            keyboardType="numeric"
            error={errors.page6 && !brothers}
          />
          <FloatingLabelInput
            value={sisters}
            onChangeText={setSisters}
            label={i18n.t('register.labels.sisters')}
            required
            keyboardType="numeric"
            error={errors.page6 && !sisters}
          />
          <CustomPicker
            label={i18n.t('register.labels.familyType')}
            selectedValue={familyType}
            onValueChange={setFamilyType}
            items={[
              { value: 'Nuclear', name: 'Nuclear' },
              { value: 'Joint', name: 'Joint' },
              { value: 'Other', name: 'Other' },
            ]}
            placeholder={i18n.t('register.placeholders.selectFamilyType')}
            error={errors.page5 && !familyType}
          />
          <CustomPicker
            label={i18n.t('register.labels.familyValues')}
            selectedValue={familyValues}
            onValueChange={setFamilyValues}
            items={
              (
                allMetaData.familyDetails?.filter(
                  item => item.category === 'familyValues',
                ) || []
              ).length > 0
                ? allMetaData.familyDetails
                  .filter(item => item.category === 'familyValues')
                  .map(item => ({
                    value: item.name,
                    name: item.name,
                  }))
                : FAMILY_VALUES_OPTIONS
            }
            placeholder={i18n.t('register.placeholders.selectFamilyValues')}
            error={errors.page5 && !familyValues}
          />
          <CustomPicker
            label={i18n.t('register.labels.familyLocation')}
            selectedValue={familyLocation}
            onValueChange={setFamilyLocation}
            items={(allMetaData.locations || []).map(item => ({
              value: item._id,
              name: `${item.city}, ${item.state}, ${item.country}`,
            }))}
            placeholder={i18n.t('register.placeholders.selectFamilyLocation')}
          />

          {/* Lifestyle */}
          <Text style={styles.sectionHeader}>
            {i18n.t('register.labels.lifestyle')} *
          </Text>
          <CustomPicker
            label={i18n.t('register.labels.diet')}
            selectedValue={diet}
            onValueChange={setDiet}
            items={[
              { value: 'Vegetarian', name: 'Vegetarian' },
              { value: 'Non-Vegetarian', name: 'Non-Vegetarian' },
              { value: 'Eggetarian', name: 'Eggetarian' },
              { value: 'Vegan', name: 'Vegan' },
              { value: 'Jain', name: 'Jain' },
            ]}
            placeholder={i18n.t('register.placeholders.selectDiet')}
            error={errors.page5 && !diet}
          />
          <CustomPicker
            label={i18n.t('register.labels.smoking')}
            selectedValue={smoking}
            onValueChange={setSmoking}
            items={[
              { value: 'Yes', name: 'Yes' },
              { value: 'No', name: 'No' },
              { value: 'Occasionally', name: 'Occasionally' },
            ]}
            placeholder={i18n.t('register.placeholders.smokingHabit')}
          />
          <CustomPicker
            label={i18n.t('register.labels.drinking')}
            selectedValue={drinking}
            onValueChange={setDrinking}
            items={[
              { value: 'Yes', name: 'Yes' },
              { value: 'No', name: 'No' },
              { value: 'Occasionally', name: 'Occasionally' },
            ]}
            placeholder={i18n.t('register.placeholders.drinkingHabit')}
          />

          {/* Privacy */}
          {/* Privacy - Custom Toggle UI */}
          <Text style={[styles.sectionHeader, { marginBottom: 15 }]}>
            {i18n.t('register.labels.privacy')}
          </Text>

          {/* Helper Component for Privacy Toggle */}
          {(() => {
            const PrivacyToggle = ({ label, value, onChange }) => (
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 14, color: COLORS.black, marginBottom: 8, fontWeight: '600' }}>
                  {label}
                </Text>
                <View style={{ flexDirection: 'row', backgroundColor: '#f0f0f0ff', borderRadius: 12, padding: 4, height: 48 }}>
                  {/* Public Option */}
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
                    <Text style={{ fontSize: 14, color: value === 'public' ? COLORS.white : COLORS.darkGray, fontWeight: '500' }}>Public</Text>
                  </TouchableOpacity>

                  {/* Private Option */}
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
                    <Text style={{ fontSize: 14, color: value === 'private' ? COLORS.white : COLORS.darkGray, fontWeight: '500' }}>Private</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );

            return (
              <>
                <PrivacyToggle
                  label={i18n.t('register.labels.profileVisibility')}
                  value={profileVisibility}
                  onChange={setProfileVisibility}
                />
                <PrivacyToggle
                  label={i18n.t('register.labels.photoVisibility')}
                  value={photoVisibility}
                  onChange={setPhotoVisibility}
                />
                <PrivacyToggle
                  label={i18n.t('register.labels.contactVisibility')}
                  value={contactVisibility}
                  onChange={setContactVisibility}
                />
              </>
            );
          })()}

          <Text style={styles.sectionHeader}> {i18n.t('register.labels.income&about')}</Text>
          <FloatingLabelInput
            label={i18n.t('register.labels.income')}
            value={annualIncome}
            onChangeText={setAnnualIncome}
            required
            error={errors.page6 && !annualIncome}
          />

          <FloatingLabelInput
            label={i18n.t('register.labels.about')}
            value={aboutMe}
            onChangeText={text => {
              if (text.length <= ABOUT_ME_MAX) {
                setAboutMe(text);
              }
            }}
            required
            multiline
            numberOfLines={4}
            maxLength={ABOUT_ME_MAX}
            error={errors.page6 && !aboutMe}
          />

          <Text style={styles.charCount}>
            {aboutMe.length}/{ABOUT_ME_MAX}
          </Text>

        </>
      )}

      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={[styles.nextButton, loading && { opacity: 0.7 }]}
          onPress={nextPage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.nextButtonText}>
              {i18n.t('register.submit')}
            </Text>

          )}
        </TouchableOpacity>

      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <View style={styles.fullContainer}>
        <View style={styles.bgLayer} pointerEvents="none">
          <View style={styles.blobPrimary} />
          <View style={styles.blobSecondary} />
        </View>

        <CustomHeader
          title={pageTitle}
          showBack={true}
          onBackPress={prevPage}
        />

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{i18n.t('register.title')}</Text>
          <Text style={styles.heroSubtitle}>
            {i18n.t('register.validationtext.page1')}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.max(1, (currentPage / 6) * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {i18n.t('register.page' + (currentPage > 6 ? 6 : currentPage))} · {currentPage}/6
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ModalAlert
            visible={alertState.visible}
            title={alertState.title}
            message={alertState.message}
            onClose={hideAlert}
          />
          <View style={styles.card}>
            {currentPage === 1 && renderPage1()}
            {currentPage === 2 && renderPage2()}
            {currentPage === 3 && renderPage3()}
            {currentPage === 4 && renderPage4()}
            {currentPage === 5 && renderPage5()}
            {currentPage === 6 && renderPage6()}
          </View>
        </ScrollView>

        {requestModalVisible && (
          <DataRequestModal
            visible={requestModalVisible}
            onClose={() => setRequestModalVisible(false)}
            onSubmit={handleDataRequestSubmit}
            initialType={requestInitialType}
          />
        )}

        {successPopup.visible && (
          <SuccessPopup
            visible={successPopup.visible}
            title={successPopup.title}
            message={successPopup.message}
            type={successPopup.type}
            onClose={() => setSuccessPopup({ ...successPopup, visible: false })}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // -------- MAIN LAYOUT --------
  fullContainer: {
    flex: 1,
    backgroundColor: '#fdf6f7',
  },

  bgLayer: {
    position: 'absolute',
    inset: 0,
  },

  blobPrimary: {
    position: 'absolute',
    top: -160,
    right: -120,
    height: 320,
    width: 320,
    borderRadius: 260,
    backgroundColor: 'rgba(181, 7, 42, 0.10)',
  },

  blobSecondary: {
    position: 'absolute',
    bottom: -140,
    left: -120,
    height: 300,
    width: 300,
    borderRadius: 240,
    backgroundColor: 'rgba(70, 130, 180, 0.08)',
  },

  // Header (no padding, full width)
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.black,
    textAlign: 'center',
  },

  // -------- PAGE CONTAINER (for padding on pages only) --------
  contentContainer: {
    flex: 1,
    paddingHorizontal: SIZES.padding, // 👈 page padding here
    paddingVertical: SIZES.base,
    gap: SIZES.base,
  },
  container: {
    flexGrow: 1,
    alignItems: 'stretch',
    backgroundColor: 'transparent',
    paddingVertical: SIZES.base * 2,
  },

  authTitle: {
    ...FONTS.h2,
    color: COLORS.black,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },

  authSubtitle: {
    ...FONTS.body3,
    color: COLORS.darkGray,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },

  hero: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base * 1.5,
    gap: 8,
  },

  heroTitle: {
    ...FONTS.h1,
    color: COLORS.primary,
  },

  heroSubtitle: {
    ...FONTS.body3,
    color: COLORS.darkGray,
  },

  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 8,
    backgroundColor: '#f0e7ea',
    overflow: 'hidden',
    marginTop: 6,
  },

  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },

  progressLabel: {
    ...FONTS.body4,
    color: COLORS.darkGray,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius * 1.25,
    padding: SIZES.padding,
    shadowColor: '#eaeaeaff',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  // -------- FORMS & LABELS --------
  label: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    ...FONTS.body3,
    color: COLORS.darkGray,
  },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: SIZES.radius,
    marginBottom: 12,
    color: COLORS.black,
    backgroundColor: COLORS.white,
    ...FONTS.body3,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  inputWrapperPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    backgroundColor: '#ffffff',
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.base * 1.5,
    height: 54,
    shadowColor: '#eaeaeaff',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 12,
  },

  inputPrimary: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
    ...FONTS.body3,
    color: COLORS.black,
    lineHeight: 22,
    height: 22,
    includeFontPadding: false,
  },

  inputIcon: {
    marginRight: SIZES.base * 1.25,
  },

  inputPhone: {
    letterSpacing: 0,
  },

  inlinePrefix: {
    ...FONTS.body3,
    color: COLORS.darkGray,
    marginRight: SIZES.base * 0.5,
  },

  inputError: {
    borderColor: COLORS.primary,
    borderWidth: 1,
  },

  helper: {
    ...FONTS.body4,
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  //-------MULTISELECT------

  dropdown: {
    height: 50,
    borderColor: COLORS.gray,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: COLORS.white,
  },

  placeholderStyle: {
    fontSize: 16,
    color: COLORS.darkGray,
  },

  selectedTextStyle: {
    fontSize: 14,
    color: COLORS.darkGray,
  },

  iconStyle: {
    width: 20,
    height: 20,
  },

  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    color: COLORS.darkGray,
  },

  selectedStyle: {
    borderRadius: 8,
    backgroundColor: '#fff',
    borderColor: 'transparent',
    borderWidth: 0,
  },

  // -------- PICKERS --------
  pickerWrapper: {
    width: '100%',
    marginBottom: 10,
  },
  pickerWrapperDense: {
    zIndex: 10,
  },
  errorBorder: {
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: SIZES.radius,
    height: 50,
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderStyle: 'solid',
  },
  picker: {
    height: 60,
    width: '100%',
    paddingHorizontal: 1,
    color: COLORS.darkGray,
  },

  // -------- RADIO BUTTONS --------
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    width: '100%',
    marginBottom: 15,
  },
  toggleRowPill: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
    width: '100%',
  },

  togglePill: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: COLORS.lightGray,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    flex: 1,
    justifyContent: 'center',
  },

  togglePillActive: {
    backgroundColor: 'rgba(181, 7, 42, 0.12)',
  },

  toggleIcon: {
    marginRight: 6,
  },

  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  outerCircle: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.gray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  selectedOuterCircle: {
    borderColor: COLORS.primary,
  },
  selectedInnerCircle: {
    height: 10,
    width: 10,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    ...FONTS.body4,
    color: COLORS.darkGray,
  },
  activeText: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // -------- BUTTONS --------
  nextButton: {
    width: '100%',
    paddingVertical: 15,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: 10,
  },
  nextButtonText: {
    color: COLORS.white,
    ...FONTS.body3,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: SIZES.padding,
  },

  // -------- DATE & SLIDER --------
  datePickerButton: {
    width: '100%',
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: COLORS.gray,
    borderRadius: SIZES.radius,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: SIZES.base * 1.5,
    marginBottom: 12,
    backgroundColor: COLORS.white,
  },
  datePickerButtonText: {
    ...FONTS.body3,
    color: COLORS.darkGray,
    marginLeft: 0,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 15,
  },

  // -------- IMAGES --------
  imagePickerButton: {
    width: '100%',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: SIZES.radius,
    alignItems: 'start',
    marginBottom: 10,
    backgroundColor: COLORS.white,
  },
  imagePickerButtonText: {
    ...FONTS.body3,
    color: COLORS.darkGray,
    marginLeft: 10,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: SIZES.radius,
    resizeMode: 'cover',
    marginBottom: 10,
  },
  photosPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
    marginBottom: 10,
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radius,
    resizeMode: 'cover',
    marginRight: 8,
    marginBottom: 8,
  },
  sectionHeader: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    ...FONTS.body3,
    color: COLORS.primary,
  },
  photoWrapper: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },

  removeIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    borderRadius: 50,
    zIndex: 1, // Ensure the icon is always on top of the image
    backgroundColor: 'white',
  },

  photoPreview: {
    width: 80,

    borderRadius: SIZES.radius,
    resizeMode: 'cover',
    marginRight: 8,
    marginBottom: 8,
  },
});

export default RegisterScreen;
