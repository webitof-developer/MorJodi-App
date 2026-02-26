import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Pressable, // Important
  Animated, // For smooth transitions
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons'; // Register uses Ionicons mostly
import FeatherIcon from 'react-native-vector-icons/Feather';
import i18n from '../localization/i18n';
import FloatingLabelInput from '../components/FloatingLabelInput';
import SelectionModal from '../components/SelectionModal';
import CustomHeader from '../components/CustomHeader';
import DataRequestModal from '../components/DataRequestModal';
import SuccessPopup from '../components/SuccessPopup';
import { getImageUrl } from '../utils/imageUtils';
import { LanguageContext } from '../contexts/LanguageContext';

import { API_BASE_URL } from '../constants/config';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import SkeletonEditProfile from '../components/SkeletonEditProfile';
import { updateUserData } from '../redux/actions/authActions';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = `${API_BASE_URL}/api/user`;
const META_API_BASE_URL = `${API_BASE_URL}/api/meta`;
const ABOUT_ME_MAX = 500;
const MAX_UPLOAD_SIZE_MB = 5;
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

// --- Options Constants (Copied/Aligned with Register) ---
const PROFILE_FOR_OPTIONS = [
  { value: 'self', name: 'Self' },
  { value: 'son', name: 'Son' },
  { value: 'daughter', name: 'Daughter' },
  { value: 'brother', name: 'Brother' },
  { value: 'sister', name: 'Sister' },
  { value: 'friend', name: 'Friend' },
  { value: 'relative', name: 'Relative' },
];

const GENDER_OPTIONS = [
  { value: 'Male', name: 'Male' },
  { value: 'Female', name: 'Female' },
  { value: 'Other', name: 'Other' },
];

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

// --- CustomPicker Component (Copied from RegisterScreen) ---
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
    name: cleanItemName(item.name || item.label), // Handle both name/label
    value: item.value || item._id,
  })).filter(item => item.name && item.name.length > 0);

  // Check for required asterisk in label
  const isRequired = label?.includes('*');
  const cleanLabel = label?.replace(' *', '').trim() || label;

  let displayValue = "";
  if (multiSelect && Array.isArray(selectedValue)) {
    displayValue = formattedData
      .filter(item => selectedValue.includes(item.value))
      .map(item => item.name)
      .join(', ');
  } else {
    // Basic value check (string/number)
    const selectedItem = formattedData.find(item => item.value == selectedValue); // relaxed check 
    if (selectedItem) {
      displayValue = selectedItem.name;
    } else {
      // Fallback for object scenarios or mismatch
      displayValue = "";
    }
  }

  const handlePress = () => {
    if (disabled) {
      if (onDisabledPress) {
        onDisabledPress();
      } else if (disabledMessage) {
        // Alert.alert("Notice", disabledMessage);
        // This component needs access to setSuccessPopup or similar context.
        // Since it is a nested component, we might not have it unless passed.
        // EditProfileScreen passes 'onDisabledPress' explicitly for dependent fields.
        // For general disabled fields (like Gender/ProfileFor), we should pass onDisabledPress prop from parent.
        Alert.alert(i18n.t('common.notice'), disabledMessage); // Keeping fallback or refactor parent to pass handler.
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
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
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

            <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 15 }}>
              <Text style={{
                fontSize: 16,
                color: displayValue ? COLORS.black : COLORS.gray,
                fontFamily: FONTS.body3.fontFamily,
              }} numberOfLines={1}>
                {displayValue || placeholder}
              </Text>
            </View>

            <View style={{ position: 'absolute', right: 15, top: 0, bottom: 0, justifyContent: 'center' }}>
              <Icon name="chevron-down" size={20} color={COLORS.gray} />
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

const EditProfileScreen = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const { language } = useContext(LanguageContext);

  // --- STATE DEFINITIONS (All Hooks at Top) ---
  const [loading, setLoading] = useState(false);
  const [allMetaData, setAllMetaData] = useState({});
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0)); // Fade animation

  // 1. Basic Info
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');

  // 2. Personal
  const [profileFor, setProfileFor] = useState(user?.profileFor || 'self');
  const [gender, setGender] = useState(user?.gender || 'Male');
  // Handle Date
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ? new Date(user.dateOfBirth) : new Date());

  const [height, setHeight] = useState(user?.height ? parseInt(user.height) : 160);
  const [maritalStatus, setMaritalStatus] = useState(user?.maritalStatus || 'Never Married');
  const [children, setChildren] = useState(user?.children || 'No Children');
  const [manglik, setManglik] = useState(user?.manglik || "Doesn't Matter");

  // 3. Religious
  const [selectedReligion, setSelectedReligion] = useState(user?.religion?._id || user?.religion || '');
  const [selectedCaste, setSelectedCaste] = useState(user?.caste?._id || user?.caste || '');
  const [selectedSubCaste, setSelectedSubCaste] = useState(user?.subCaste?._id || user?.subCaste || '');
  const [gotra, setGotra] = useState(user?.gotra?._id || user?.gotra || '');

  const [selectedMotherTongue, setSelectedMotherTongue] = useState(user?.motherTongue?._id || user?.motherTongue || '');
  const [selectedRaasi, setSelectedRaasi] = useState(user?.raasi?._id || user?.raasi || '');

  // 4. Education & Career
  const [selectedEducation, setSelectedEducation] = useState(
    Array.isArray(user?.education) ? user.education.map(e => e._id || e) : []
  );
  const [selectedProfession, setSelectedProfession] = useState(user?.profession?._id || user?.profession || '');
  const [selectedLocation, setSelectedLocation] = useState(user?.location?._id || user?.location || '');
  const [annualIncome, setAnnualIncome] = useState(user?.annualIncome || '');

  // 5. Bio
  const [aboutMe, setAboutMe] = useState(user?.aboutMe || '');

  // 6. Family
  const [fatherStatus, setFatherStatus] = useState(user?.familyDetails?.fatherStatus || '');
  const [motherStatus, setMotherStatus] = useState(user?.familyDetails?.motherStatus || '');
  const [brothers, setBrothers] = useState(String(user?.familyDetails?.brothers || '0'));
  const [sisters, setSisters] = useState(String(user?.familyDetails?.sisters || '0'));
  const [familyType, setFamilyType] = useState(user?.familyDetails?.familyType || 'Nuclear');
  const [familyValues, setFamilyValues] = useState(user?.familyDetails?.familyValues || 'Traditional');
  const [familyLocation, setFamilyLocation] = useState(user?.familyDetails?.familyLocation?._id || user?.familyDetails?.familyLocation || '');

  // 7. Lifestyle
  const [diet, setDiet] = useState(user?.lifestyle?.diet || 'Vegetarian');
  const [smoking, setSmoking] = useState(user?.lifestyle?.smoking || 'No');
  const [drinking, setDrinking] = useState(user?.lifestyle?.drinking || 'No');

  // 7.5 Privacy
  const [profileVisibility, setProfileVisibility] = useState(user?.privacy?.profileVisibility || 'public');
  const [photoVisibility, setPhotoVisibility] = useState(user?.privacy?.photoVisibility || 'public');
  const [contactVisibility, setContactVisibility] = useState(user?.privacy?.contactVisibility || 'public');

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const maxDob = new Date();
  maxDob.setFullYear(maxDob.getFullYear() - 18);

  // 8. Photos & IDs
  const [profileImage, setProfileImage] = useState(user?.image || null);
  const [featurePhotos, setFeaturePhotos] = useState(() => {
    const photos = Array(6).fill(null);
    if (user?.photos && Array.isArray(user.photos)) {
      const others = user.photos.filter(p => p !== user?.image).slice(0, 6);
      others.forEach((p, idx) => {
        photos[idx] = p;
      });
    }
    return photos;
  });
  const [imageMetaByUri, setImageMetaByUri] = useState({});
  const [aadharFront, setAadharFront] = useState(user?.aadharFront || null);
  const [aadharBack, setAadharBack] = useState(user?.aadharBack || null);
  const [panFront, setPanFront] = useState(user?.panFront || null);
  const [panBack, setPanBack] = useState(user?.panBack || null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // --- REQUEST ADD MODAL STATE ---
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestInitialType, setRequestInitialType] = useState('caste');
  const [successPopup, setSuccessPopup] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success'
  });

  // --- HANDLERS (Cascading Logic) ---
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

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  // --- DATA REQUEST SUBMISSION ---
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

  const submitDataRequest = async (type, name, parentType, parentId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const config = {};
      if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
      }

      const res = await axios.post(`${API_BASE_URL}/api/data-request/create`, {
        type,
        name,
        parentType,
        parentId
      }, { ...config, suppressGlobalError: true });
      if (res.data.success) {
        setSuccessPopup({
          visible: true,
          title: i18n.t('register.dataRequest.submittedTitle', { lng: language }),
          message: i18n.t('register.dataRequest.submittedMessage', { type, name, lng: language }),
          type: 'success'
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || i18n.t('register.dataRequest.failedMessage', { lng: language });
      setSuccessPopup({
        visible: true,
        title: i18n.t('common.error', { lng: language }),
        message: msg,
        type: 'error'
      });
    }
  };

  const handleDataRequestSubmit = async (type, name) => {
    // Determine parent based on type and current selections
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
      // Fallback to Caste if SubCaste is missing
      if (!parentId && selectedCaste) {
        parentType = 'caste';
        parentId = selectedCaste;
      }
    }

    await submitDataRequest(type, name, parentType, parentId);
    setRequestModalVisible(false);
  };

  // --- FETCH DATA ON MOUNT ---
  useEffect(() => {
    const fetchData = async () => {
      setLoadingMeta(true);
      try {
        // 1. Fetch Meta
        const metaRes = await axios.get(`${META_API_BASE_URL}/profile-meta`, {
          suppressGlobalError: true,
        });
        setAllMetaData(metaRes.data);

        // 2. Fetch User Profile (Fresh)
        const token = await AsyncStorage.getItem('token');
        const userRes = await axios.get(`${API_BASE_URL}/api/user/singleuser`, {
          suppressGlobalError: true,
          headers: { Authorization: `Bearer ${token}` }
        });

        if (userRes.data && userRes.data.user) {
          const u = userRes.data.user;
          dispatch(updateUserData(u)); // Sync Redux

          // Populate State
          setFullName(u.fullName || '');
          setEmail(u.email || '');
          setPhoneNumber(u.phoneNumber || '');
          setProfileFor(u.profileFor || 'Self');
          setGender(u.gender || 'Male');
          if (u.dateOfBirth) setDateOfBirth(new Date(u.dateOfBirth));
          setHeight(u.height ? parseInt(u.height) : 160);
          setMaritalStatus((u.maritalStatus && u.maritalStatus !== '0') ? u.maritalStatus : 'Never Married');

          let validChild = u.children;
          if (!validChild || validChild === '0' || validChild === 0) validChild = 'No Children';
          setChildren(validChild);

          setManglik(u.manglik || "Doesn't Matter");

          setSelectedReligion(u.religion?._id || u.religion || '');
          setSelectedCaste(u.caste?._id || u.caste || '');
          setSelectedSubCaste(u.subCaste?._id || u.subCaste || '');
          setGotra(u.gotra?._id || u.gotra || '');
          setSelectedMotherTongue(u.motherTongue?._id || u.motherTongue || '');
          setSelectedRaasi(u.raasi?._id || u.raasi || '');

          setSelectedEducation(Array.isArray(u.education) ? u.education.map(e => e._id || e) : []);
          setSelectedProfession(u.profession?._id || u.profession || '');
          setSelectedLocation(u.location?._id || u.location || '');
          setAnnualIncome(u.annualIncome || '');
          setAboutMe(u.aboutMe || '');

          setFatherStatus(u.familyDetails?.fatherStatus || '');
          setMotherStatus(u.familyDetails?.motherStatus || '');
          setBrothers(String(u.familyDetails?.brothers || '0'));
          setSisters(String(u.familyDetails?.sisters || '0'));
          setFamilyType(u.familyDetails?.familyType || 'Nuclear');
          setFamilyValues(u.familyDetails?.familyValues || 'Traditional');
          setFamilyLocation(u.familyDetails?.familyLocation?._id || u.familyDetails?.familyLocation || '');

          setDiet(u.lifestyle?.diet || 'Vegetarian');
          setSmoking(u.lifestyle?.smoking || 'No');
          setDrinking(u.lifestyle?.drinking || 'No');

          setProfileVisibility(u.privacy?.profileVisibility || 'public');
          setPhotoVisibility(u.privacy?.photoVisibility || 'public');
          setContactVisibility(u.privacy?.contactVisibility || 'public');

          // Photos
          setProfileImage(u.image || null);
          const photos = Array(6).fill(null);
          if (u.photos && Array.isArray(u.photos)) {
            const others = u.photos.filter(p => p !== u.image).slice(0, 6);
            others.forEach((p, idx) => {
              photos[idx] = p;
            });
          }
          setFeaturePhotos(photos);


          // Initialize IDs ensuring array access using optional chaining
          // Initialize IDs
          setAadharFront(u.aadharFront || null);
          setAadharBack(u.aadharBack || null);
          setPanFront(u.panFront || null);
          setPanBack(u.panBack || null);
        }

      } catch (e) {
        // console.error("Error fetching data", e);
      } finally {
        setLoadingMeta(false);
        // Trigger smooth fade-in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }
    };
    fetchData();
  }, []);

  // --- FILTERING LOGIC ---
  const filteredCastes = useMemo(() => {
    if (!selectedReligion || !allMetaData.castes) return [];
    return allMetaData.castes.filter(c => (c.religion === selectedReligion || c.religion?._id === selectedReligion));
  }, [allMetaData.castes, selectedReligion]);

  const filteredSubCastes = useMemo(() => {
    if (!selectedCaste || !allMetaData.subCastes) return [];
    return allMetaData.subCastes.filter(sc => (sc.caste === selectedCaste || sc.caste?._id === selectedCaste));
  }, [allMetaData.subCastes, selectedCaste]);

  const filteredGotras = useMemo(() => {
    // If no SubCaste selected, valid Gotras is empty list? Or all? 
    // RegisterScreen filters by subCaste.
    if (!selectedSubCaste || !allMetaData.gotras) return [];
    return allMetaData.gotras.filter(g => (g.subCaste === selectedSubCaste || g.subCaste?._id === selectedSubCaste));
  }, [allMetaData.gotras, selectedSubCaste]);

  // --- IMAGE HELPERS ---
  const getImageValidationMessage = (asset) => {
    if (!asset) return i18n.t('register.validationtext.imagePickFailed', { lng: language });
    if (asset.type && !ALLOWED_IMAGE_MIME_TYPES.includes(asset.type)) {
      return i18n.t('register.validationtext.invalidImageType', { lng: language });
    }
    if (asset.fileSize && asset.fileSize > MAX_UPLOAD_SIZE_BYTES) {
      return i18n.t('register.validationtext.imageTooLarge', {
        size: MAX_UPLOAD_SIZE_MB,
        lng: language
      });
    }
    if (!asset.uri) {
      return i18n.t('register.validationtext.imagePickFailed', { lng: language });
    }
    return '';
  };

  const getAssetSizeBytes = async (asset) => {
    if (!asset) return 0;
    if (Number(asset.fileSize) > 0) return Number(asset.fileSize);
    if (!asset.uri) return 0;

    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      return Number(blob?.size || 0);
    } catch (e) {
      return 0;
    }
  };

  const rememberImageMeta = (asset) => {
    if (!asset?.uri) return;
    setImageMetaByUri(prev => ({
      ...prev,
      [asset.uri]: {
        fileSize: Number(asset.fileSize || 0),
        type: asset.type || '',
      },
    }));
  };

  const hasOversizeSelectedImages = () => {
    const selectedUris = [
      profileImage,
      aadharFront,
      aadharBack,
      panFront,
      panBack,
      ...(Array.isArray(featurePhotos) ? featurePhotos : []),
    ].filter(Boolean);

    return selectedUris.some((uri) => {
      const meta = imageMetaByUri[uri];
      return meta?.fileSize > MAX_UPLOAD_SIZE_BYTES;
    });
  };

  const pickPhoto = async (setter, multiple = false, targetIndex = -1) => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: (multiple && targetIndex === -1) ? 6 : 1,
        quality: 1,
        includeExtra: true,
      });
      if (result.didCancel) return;
      if (result.errorCode) {
        setSuccessPopup({
          visible: true,
          title: i18n.t('register.validation', { lng: language }),
          message: i18n.t('register.validationtext.imagePickFailed', { lng: language }),
          type: 'error'
        });
        return;
      }
      if (result.assets && result.assets.length > 0) {
        const validAssets = [];
        for (const asset of result.assets) {
          const resolvedSize = await getAssetSizeBytes(asset);
          const validatedAsset = {
            ...asset,
            fileSize: resolvedSize || asset.fileSize,
          };
          const imageValidationMessage = getImageValidationMessage(validatedAsset);
          if (imageValidationMessage) {
            setSuccessPopup({
              visible: true,
              title: i18n.t('register.validation', { lng: language }),
              message: imageValidationMessage,
              type: 'error'
            });
            continue;
          }
          rememberImageMeta(validatedAsset);
          validAssets.push(validatedAsset);
        }
        if (validAssets.length === 0) return;

        if (multiple) {
          setter(prev => {
            const copy = Array.isArray(prev) ? [...prev] : [];
            const minSlots = Array.isArray(prev) ? prev.length : (targetIndex + 1);
            while (copy.length < Math.max(1, minSlots)) copy.push(null);
            const uris = validAssets.map(a => a.uri);

            if (targetIndex !== -1) {
              // Targeted update: strict assignment to specific slot
              copy[targetIndex] = uris[0];
            } else {
              // Fill empty slots (fallback or generic add)
              let uriIndex = 0;
              for (let i = 0; i < copy.length && uriIndex < uris.length; i++) {
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
            setter(validAssets[0].uri);
          }
        }
      }
    } catch (e) { }
  };

  const removeGalleryPhoto = (index) => {
    setFeaturePhotos(prev => {
      const next = [...prev];
      if (index < next.length) {
        next[index] = null;
      }
      return next;
    });
  };

  // --- SAVE HANDLER ---
  const handleSave = async () => {
    if (!validateForm()) return;
    if (hasOversizeSelectedImages()) {
      setSuccessPopup({
        visible: true,
        title: i18n.t('register.validation', { lng: language }),
        message: i18n.t('register.validationtext.imageTooLarge', {
          size: MAX_UPLOAD_SIZE_MB,
          lng: language
        }),
        type: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      // Basic
      formData.append('fullName', fullName);
      if (email?.trim()) formData.append('email', email.trim());
      if (phoneNumber?.trim()) formData.append('phoneNumber', phoneNumber.trim());
      formData.append('profileFor', profileFor);
      formData.append('gender', gender);
      formData.append('dateOfBirth', dateOfBirth.toISOString()); // or split T
      formData.append('height', height.toString());
      formData.append('maritalStatus', maritalStatus);
      formData.append('children', (maritalStatus !== 'Never Married' ? children : 'No Children'));
      formData.append('manglik', manglik);

      // Religious & Social
      if (selectedReligion) formData.append('religion', selectedReligion);
      if (selectedCaste) formData.append('caste', selectedCaste);
      if (selectedSubCaste) formData.append('subCaste', selectedSubCaste);
      if (gotra) formData.append('gotra', gotra);
      if (selectedMotherTongue) formData.append('motherTongue', selectedMotherTongue);
      if (selectedRaasi) formData.append('raasi', selectedRaasi);

      // Career
      if (selectedProfession) formData.append('profession', selectedProfession);
      if (selectedLocation) formData.append('location', selectedLocation);
      formData.append('education', JSON.stringify(selectedEducation));
      formData.append('annualIncome', annualIncome);
      formData.append('aboutMe', aboutMe);

      // Family
      formData.append('familyDetails', JSON.stringify({
        fatherStatus, motherStatus, brothers, sisters, familyType, familyValues, familyLocation
      }));
      // Lifestyle
      formData.append('lifestyle', JSON.stringify({
        diet, smoking, drinking
      }));

      // Privacy
      formData.append('privacy', JSON.stringify({
        profileVisibility,
        photoVisibility,
        contactVisibility
      }));

      // Photos Handling
      const existingPhotos = [];
      const isMainNewFile =
        profileImage &&
        (profileImage.startsWith('file:') || profileImage.startsWith('content:'));
      if (isMainNewFile) {
        const name = `profile_${Date.now()}.jpg`;
        formData.append('image', { uri: profileImage, name, type: 'image/jpeg' });
      } else if (profileImage) {
        formData.append('mainImage', profileImage);
      }

      featurePhotos.forEach((p, i) => {
        const isNewFile = p && (p.startsWith('file:') || p.startsWith('content:'));
        if (isNewFile) {
          const name = `photo_${i}_${Date.now()}.jpg`;
          formData.append('photos', { uri: p, name, type: 'image/jpeg' });
        } else if (p) {
          existingPhotos.push(p);
        }
      });
      // Append existing photos as array/individual fields
      // FormData handles arrays by appending multiple times with same key
      existingPhotos.forEach(p => {
        formData.append('existingPhotos', p);
      });

      // IDs
      // Check against current user state to only upload if CHANGED
      if (aadharFront && aadharFront !== user.aadharFront) {
        formData.append('aadharFront', { uri: aadharFront, name: 'aadhar_front.jpg', type: 'image/jpeg' });
      }
      if (aadharBack && aadharBack !== user.aadharBack) {
        formData.append('aadharBack', { uri: aadharBack, name: 'aadhar_back.jpg', type: 'image/jpeg' });
      }
      if (panFront && panFront !== user.panFront) {
        formData.append('panFront', { uri: panFront, name: 'pan_front.jpg', type: 'image/jpeg' });
      }
      if (panBack && panBack !== user.panBack) {
        formData.append('panBack', { uri: panBack, name: 'pan_back.jpg', type: 'image/jpeg' });
      }

      const token = await AsyncStorage.getItem('token');
      const res = await axios.put(`${API_URL}/${user._id}`, formData, {
        suppressGlobalError: true,
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (percentCompleted > 100) percentCompleted = 100;
          setUploadProgress(percentCompleted);
        }
      });

      setLoading(false);
      setSuccessPopup({
        visible: true,
        title: i18n.t('common.success', { lng: language }),
        message: i18n.t('editProfile.alerts.profileUpdated', { lng: language }),
        type: 'success'
      });
      // Delay navigation slightly to let user see success? Or just navigate.
      // Register often waits or moves next. Here we might want to wait a sec or just close.
      // For now, let's keep navigation immediate but maybe after a small timeout if using popup?
      // Actually standard behavior: show success, user closes, then maybe nav?
      // Or auto-close.
      // Let's rely on user closing popup then manually nav? No, that's annoying.
      // Let's showing popup and then navigating after delay.
      setTimeout(() => {
        dispatch(updateUserData(res.data.user)); // Update redux before nav
        navigation.goBack();
      }, 1500);

    } catch (e) {
      setLoading(false);
      const status = e?.response?.status;
      const errorCode = e?.response?.data?.code;
      let message = e?.response?.data?.message || i18n.t('editProfile.alerts.saveFailed', { lng: language });
      if (errorCode === 'FILE_TOO_LARGE') {
        message = i18n.t('register.validationtext.imageTooLarge', {
          size: MAX_UPLOAD_SIZE_MB,
          lng: language
        });
      }
      if (!status || status >= 500) {
        message = i18n.t('register.validationtext.serverIssue', { lng: language });
      }
      setSuccessPopup({
        visible: true,
        title: i18n.t('common.error', { lng: language }),
        message,
        type: 'error'
      });
    }
  };

  const validateForm = () => {
    let missingFields = [];
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // --- Page 1 Checks ---
    if (!fullName) missingFields.push(i18n.t('register.labels.fullName', { lng: language }));
    if (email && !isValidEmail(email)) {
      missingFields.push(i18n.t('register.validationtext.validEmail', { lng: language }));
    }

    if (phoneNumber && phoneNumber.replace(/[^0-9]/g, '').length < 10) {
      missingFields.push(i18n.t('register.validationtext.validPhone', { lng: language }));
    }

    // --- Page 2 Checks ---
    if (!gender) missingFields.push(i18n.t('register.labels.gender', { lng: language }));
    if (!profileFor) missingFields.push(i18n.t('register.labels.profileFor', { lng: language }));
    if (!maritalStatus) missingFields.push(i18n.t('register.labels.maritalStatus', { lng: language }));
    if (!manglik) missingFields.push(i18n.t('register.labels.manglik', { lng: language }));
    if (!dateOfBirth) missingFields.push(i18n.t('register.labels.dob', { lng: language }));
    if (!height) missingFields.push(i18n.t('register.labels.height', { lng: language }));

    if (maritalStatus !== 'Never Married' && (!children || children === '0')) {
      missingFields.push(i18n.t('register.labels.children', { lng: language }));
    }

    // Age Check
    const today = new Date();
    const dob = new Date(dateOfBirth);
    const age = today.getFullYear() - dob.getFullYear();
    const month = today.getMonth() - dob.getMonth();
    const isUnder18 = age < 18 || (age === 18 && month < 0) || (age === 18 && month === 0 && today.getDate() < dob.getDate());

    if (isUnder18) {
      setSuccessPopup({
        visible: true,
        title: i18n.t('register.ageRequirement', { lng: language }),
        message: i18n.t('register.ageError', { lng: language }),
        type: 'error'
      });
      return false;
    }

    // --- Page 3 Checks ---
    if (!selectedReligion) missingFields.push(i18n.t('register.labels.religion', { lng: language }));
    if (!selectedCaste) missingFields.push(i18n.t('register.labels.caste', { lng: language }));
    if (!selectedMotherTongue) missingFields.push(i18n.t('register.labels.motherTongue', { lng: language }));
    if (!selectedProfession) missingFields.push(i18n.t('register.labels.profession', { lng: language }));
    if (!selectedLocation) missingFields.push(i18n.t('register.labels.location', { lng: language }));
    if (!selectedEducation || selectedEducation.length === 0) missingFields.push(i18n.t('register.labels.education', { lng: language }));

    // --- Photo Checks ---
    if (!profileImage) {
      setSuccessPopup({
        visible: true,
        title: i18n.t('register.validation', { lng: language }),
        message: i18n.t('register.validationtext.mainPhotoRequired', { lng: language }),
        type: 'error'
      });
      return false;
    }

    const totalPhotos = (profileImage ? 1 : 0) + featurePhotos.filter(Boolean).length;
    if (totalPhotos < 3) {
      setSuccessPopup({
        visible: true,
        title: i18n.t('register.validation', { lng: language }),
        message: i18n.t('register.validationtext.minPhotosRequired', { lng: language }),
        type: 'error'
      });
      return false;
    }

    // --- ID Checks ---
    if (!aadharFront || !aadharBack) {
      setSuccessPopup({
        visible: true,
        title: i18n.t('register.validation', { lng: language }),
        message: i18n.t('register.validationtext.aadharRequired', { lng: language }),
        type: 'error'
      });
      return false;
    }

    // --- Family & Lifestyle Checks ---
    if (!fatherStatus) missingFields.push(i18n.t('register.labels.fatherStatus', { lng: language }));
    if (!motherStatus) missingFields.push(i18n.t('register.labels.motherStatus', { lng: language }));
    if (!brothers) missingFields.push(i18n.t('register.labels.brothers', { lng: language }));
    if (!sisters) missingFields.push(i18n.t('register.labels.sisters', { lng: language }));
    if (!familyType) missingFields.push(i18n.t('register.labels.familyType', { lng: language }));
    if (!familyValues) missingFields.push(i18n.t('register.labels.familyValues', { lng: language }));
    if (!diet) missingFields.push(i18n.t('register.labels.diet', { lng: language }));
    if (!annualIncome) missingFields.push(i18n.t('register.labels.income', { lng: language }));
    if (!aboutMe) missingFields.push(i18n.t('register.labels.about', { lng: language }));

    if (missingFields.length > 0) {
      setSuccessPopup({
        visible: true,
        title: i18n.t('register.validation', { lng: language }),
        message: i18n.t('register.validationtext.requiredDetails', {
          fields: missingFields.join(', '),
          lng: language
        }),
        type: 'error'
      });
      return false;
    }
    return true;
  };

  const HEIGHT_OPTIONS = Array.from({ length: 94 }, (_, i) => {
    const cm = 120 + i;
    const feet = Math.floor(cm / 30.48);
    const inches = Math.round((cm % 30.48) / 2.54);
    return { name: `${cm} cm (${feet}ft ${inches}in)`, value: cm };
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>


      {loadingMeta ? (
        <ScrollView contentContainerStyle={styles.container}>
          <SkeletonEditProfile />
        </ScrollView>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">



            {/* --- PHOTOS SECTION (Register Style) --- */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>{i18n.t('register.photoSection.mainProfile', { lng: language })} <Text style={{ color: COLORS.primary }}>*</Text></Text>
              <Text style={styles.sectionSub}>{i18n.t('register.validationtext.mainPhotoRequired', { lng: language })}</Text>
              <Text style={styles.sectionSub}>{i18n.t('register.photoSection.imageSizeHint', { size: MAX_UPLOAD_SIZE_MB, lng: language })}</Text>

              <View style={styles.photoGrid}>
                <View style={styles.photoBox}>
                  {profileImage ? (
                    <>
                      <Image source={{ uri: getImageUrl(profileImage) }} style={styles.photoImg} resizeMode="cover" />
                      <TouchableOpacity style={styles.removeBtn} onPress={() => setProfileImage(null)}>
                        <Icon name="close" size={12} color="#fff" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity style={styles.addPhotoBtn} onPress={() => pickPhoto(setProfileImage)}>
                      <Icon name="add" size={30} color={COLORS.gray} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>{i18n.t('register.labels.datingCardPhoto', { lng: language })} <Text style={{ color: COLORS.primary }}>*</Text></Text>
              <Text style={styles.sectionSub}>{i18n.t('register.photoSection.requiredMin', { lng: language })}</Text>

              <View style={styles.photoGrid}>
                {[...Array(6)].map((_, index) => {
                  const photoUri = featurePhotos[index];
                  return (
                    <View key={index} style={styles.photoBox}>
                      {photoUri ? (
                        <>
                          <Image source={{ uri: getImageUrl(photoUri) }} style={styles.photoImg} resizeMode="cover" />
                          <TouchableOpacity style={styles.removeBtn} onPress={() => removeGalleryPhoto(index)}>
                            <Icon name="close" size={12} color="#fff" />
                          </TouchableOpacity>
                          {index === 0 && (
                            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 2 }}>
                              <Text style={{ color: '#fff', fontSize: 10, textAlign: 'center', fontWeight: 'bold' }}>
                                {i18n.t('register.photoSection.mainImage', { lng: language })}
                              </Text>
                            </View>
                          )}
                        </>
                      ) : (
                        <TouchableOpacity style={styles.addPhotoBtn} onPress={() => pickPhoto(setFeaturePhotos, true, index)}>
                          <Icon name="add" size={30} color={COLORS.gray} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* --- BASIC INFO --- */}
            <Text style={styles.sectionHeader}>{i18n.t('editProfile.sections.basic', { lng: language })}</Text>

            <FloatingLabelInput label={i18n.t('register.labels.fullName', { lng: language })} value={fullName} onChangeText={setFullName} required />
            <FloatingLabelInput label={i18n.t('register.labels.email', { lng: language })} value={email} onChangeText={setEmail} />
            <FloatingLabelInput
              label={i18n.t('auth.phone', { lng: language })}
              value={phoneNumber}
              onChangeText={text => setPhoneNumber(text.replace(/[^0-9]/g, '').slice(0, 10))}
              keyboardType="numeric"
            />

            <CustomPicker label={i18n.t('register.labels.profileFor', { lng: language })} selectedValue={profileFor} onValueChange={setProfileFor} items={PROFILE_FOR_OPTIONS} disabled disabledMessage={i18n.t('register.labels.profileFor', { lng: language })} onDisabledPress={() => setSuccessPopup({ visible: true, title: i18n.t('common.notice', { lng: language }), message: `${i18n.t('register.labels.profileFor', { lng: language })} cannot be changed.`, type: 'info' })} />
            <CustomPicker label={i18n.t('register.labels.gender', { lng: language })} selectedValue={gender} onValueChange={setGender} items={GENDER_OPTIONS} disabled disabledMessage={i18n.t('register.labels.gender', { lng: language })} onDisabledPress={() => setSuccessPopup({ visible: true, title: i18n.t('common.notice', { lng: language }), message: `${i18n.t('register.labels.gender', { lng: language })} cannot be changed.`, type: 'info' })} />



            {/* Date of Birth */}
            <View style={{ marginVertical: 10, minHeight: 55 }}>
              <TouchableOpacity
                onPress={() => setSuccessPopup({ visible: true, title: i18n.t('common.notice', { lng: language }), message: `${i18n.t('register.labels.dob', { lng: language })} cannot be changed.`, type: 'info' })}
                activeOpacity={1}
                style={[
                  {
                    width: '100%',
                    height: 55,
                    borderWidth: 1.5,
                    borderColor: COLORS.lightGray, // Disabled look
                    borderRadius: 8,
                    backgroundColor: '#f9f9f9', // Disabled bg
                  }
                ]}
              >
                <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                  {/* Label */}
                  <Text style={{
                    position: 'absolute',
                    left: 12,
                    top: -10,
                    fontSize: 12,
                    fontSize: 12,
                    color: COLORS.gray, // Disabled text color
                    backgroundColor: '#f9f9f9',
                    paddingHorizontal: 4,
                    fontFamily: FONTS.body3.fontFamily,
                    flexDirection: 'row',
                  }}>
                    {i18n.t('register.labels.dob', { lng: language })}
                  </Text>

                  {/* Value */}
                  <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 15 }}>
                    <Text style={{
                      fontSize: 16,
                      color: dateOfBirth ? COLORS.black : COLORS.gray,
                      fontFamily: FONTS.body3.fontFamily,
                    }} numberOfLines={1}>
                      {dateOfBirth ? dateOfBirth.toDateString() : i18n.t('register.placeholders.selectDate', { lng: language })}
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

            <CustomPicker label={i18n.t('register.labels.height', { lng: language })} selectedValue={height} onValueChange={setHeight} items={HEIGHT_OPTIONS} required searchable />

            {/* --- PERSONAL --- */}
            <CustomPicker
              label={i18n.t('register.labels.maritalStatus', { lng: language })}
              selectedValue={maritalStatus}
              onValueChange={setMaritalStatus}
              items={[
                { name: 'Never Married', value: 'Never Married' },
                { name: 'Divorced', value: 'Divorced' },
                { name: 'Widowed', value: 'Widowed' }
              ]}
              placeholder={i18n.t('register.placeholders.selectMaritalStatus', { lng: language })}
              required
            />

            {maritalStatus !== 'Never Married' && (
              <CustomPicker
                label={i18n.t('register.labels.children', { lng: language })}
                selectedValue={children}
                onValueChange={setChildren}
                items={[
                  { name: 'No Children', value: 'No Children' },
                  { name: '1 Child', value: '1 Child' },
                  { name: '2 Children', value: '2 Children' },
                  { name: '3+ Children', value: '3+ Children' },
                  { name: 'Prefer not to say', value: 'Prefer not to say' }
                ]}
                placeholder={i18n.t('register.placeholders.selectChildren', { lng: language })}
              />
            )}

            <FloatingLabelInput label={i18n.t('register.labels.about', { lng: language })} value={aboutMe} onChangeText={setAboutMe} multiline containerStyle={{ height: 100 }} required maxLength={ABOUT_ME_MAX} />

            {/* --- RELIGION --- */}
            <Text style={styles.sectionHeader}>{i18n.t('editProfile.sections.background', { lng: language })}</Text>
            <CustomPicker
              label={i18n.t('register.labels.religion', { lng: language })}
              selectedValue={selectedReligion}
              onValueChange={handleReligionChange}
              items={(allMetaData.religions || []).map(item => ({
                value: item._id,
                name: item.name,
              }))}
              searchable
              placeholder={i18n.t('register.placeholders.selectReligion', { lng: language })}
              required
            />
            <CustomPicker
              label={i18n.t('register.labels.caste', { lng: language })}
              selectedValue={selectedCaste}
              onValueChange={handleCasteChange}
              items={filteredCastes.map(item => ({
                value: item._id,
                name: item.name,
              }))}
              searchable
              placeholder={i18n.t('register.placeholders.selectCaste', { lng: language })}
              required
              onRequestAdd={requestAddCaste}
              disabled={!selectedReligion}
              onDisabledPress={() => setSuccessPopup({
                visible: true,
                title: i18n.t('register.attention', { lng: language }),
                message: i18n.t('register.validationtext.selectReligionFirst', { lng: language }),
                type: 'info'
              })}
            />
            <CustomPicker
              label={i18n.t('register.labels.subCaste', { lng: language })}
              selectedValue={selectedSubCaste}
              onValueChange={handleSubCasteChange}
              items={filteredSubCastes.map(item => ({
                value: item._id,
                name: item.name,
              }))}
              searchable
              placeholder={i18n.t('register.placeholders.selectSubCasteOptional', { lng: language })}
              onRequestAdd={requestAddSubCaste}
              disabled={!selectedCaste}
              onDisabledPress={() => setSuccessPopup({
                visible: true,
                title: i18n.t('register.attention', { lng: language }),
                message: i18n.t('register.validationtext.selectCasteFirst', { lng: language }),
                type: 'info'
              })}
            />
            <CustomPicker
              label={i18n.t('register.labels.gotra', { lng: language })}
              selectedValue={gotra}
              onValueChange={setGotra}
              items={filteredGotras.map(item => ({
                value: item._id,
                name: item.name,
              }))}
              searchable
              placeholder={i18n.t('register.placeholders.selectGotraOptional', { lng: language })}
              onRequestAdd={requestAddGotra}
              disabled={!selectedSubCaste}
              onDisabledPress={() => setSuccessPopup({
                visible: true,
                title: i18n.t('register.attention', { lng: language }),
                message: i18n.t('register.validationtext.selectSubCasteFirst', { lng: language }),
                type: 'info'
              })}
            />
            <CustomPicker label={i18n.t('register.labels.manglik', { lng: language })} selectedValue={manglik} onValueChange={setManglik} items={[{ name: 'Yes', value: 'Yes' }, { name: 'No', value: 'No' }, { name: 'Doesnt Matter', value: "Doesnt Matter" }]} placeholder={i18n.t('register.placeholders.manglikQuestion', { lng: language })} />

            <CustomPicker
              label={`${i18n.t('register.labels.motherTongue', { lng: language })} *`}
              selectedValue={selectedMotherTongue}
              onValueChange={setSelectedMotherTongue}
              items={(allMetaData.motherTongues || []).map(item => ({
                value: item._id,
                name: item.name
              }))}
              placeholder={i18n.t('register.placeholders.selectMotherTongue', { lng: language })}
            />
            <CustomPicker label={i18n.t('register.labels.raasi', { lng: language })} selectedValue={selectedRaasi} onValueChange={setSelectedRaasi} items={(allMetaData.raasis || []).map(item => ({ value: item._id, name: item.name }))} placeholder={i18n.t('register.placeholders.selectRaasiOptional', { lng: language })} searchable />

            {/* --- CAREER --- */}
            <Text style={styles.sectionHeader}>{i18n.t('register.labels.income&about', { lng: language })}</Text>
            <CustomPicker label={i18n.t('register.labels.education', { lng: language })} selectedValue={selectedEducation} onValueChange={setSelectedEducation} items={(allMetaData.educations || []).map(item => ({ value: item._id, name: `${item.degree || ''} ${item.field ? `(${item.field})` : ''}` }))} placeholder={i18n.t('register.placeholders.selectEducation', { lng: language })} searchable multiSelect />
            <CustomPicker label={i18n.t('register.labels.profession', { lng: language })} selectedValue={selectedProfession} onValueChange={setSelectedProfession} items={(allMetaData.professions || []).map(item => ({ value: item._id, name: `${item.occupation},${item.industry}` }))} placeholder={i18n.t('register.placeholders.selectProfession', { lng: language })} searchable required />
            <CustomPicker label={i18n.t('register.labels.location', { lng: language })} selectedValue={selectedLocation} onValueChange={setSelectedLocation} items={(allMetaData.locations || []).map(item => ({ value: item._id, name: `${item.city}, ${item.state}, ${item.country}` }))} placeholder={i18n.t('register.placeholders.selectCurrentLocation', { lng: language })} searchable required />
            <FloatingLabelInput label={i18n.t('register.labels.income', { lng: language })} value={annualIncome} onChangeText={setAnnualIncome} keyboardType="numeric" />

            {/* --- ID VERIFICATION (Register Style) --- */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>{i18n.t('register.idVerification.title', { lng: language })}</Text>
              <Text style={styles.sectionSub}>{i18n.t('register.idVerification.subtitle', { lng: language })}</Text>
              <Text style={styles.sectionSub}>{i18n.t('register.idVerification.imageSizeHint', { size: MAX_UPLOAD_SIZE_MB, lng: language })}</Text>

              {/* Aadhar */}
              <View style={{ marginBottom: 15 }}>
                <Text style={styles.idLabel}>{i18n.t('register.idVerification.aadharTitle', { lng: language })} <Text style={{ color: COLORS.primary }}>*</Text></Text>
                <View style={styles.idRow}>
                  {/* Front */}
                  <View style={styles.idBox}>
                    {aadharFront ? (
                      <>
                        <Image source={{ uri: getImageUrl(aadharFront) }} style={styles.idImg} resizeMode="cover" />
                        <TouchableOpacity style={styles.closeBadge} onPress={() => setAadharFront(null)}>
                          <Icon name="close" color="#fff" size={10} />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity style={styles.center} onPress={() => pickPhoto(setAadharFront)}>
                        <Icon name="camera-outline" size={24} color={COLORS.gray} />
                        <Text style={styles.uploadText}>{i18n.t('register.idVerification.frontSide', { lng: language })}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {/* Back (Visual placeholder if not supported by backend yet, or hook up if verified) */}
                  <View style={styles.idBox}>
                    {aadharBack ? (
                      <>
                        <Image source={{ uri: getImageUrl(aadharBack) }} style={styles.idImg} resizeMode="cover" />
                        <TouchableOpacity style={styles.closeBadge} onPress={() => setAadharBack(null)}>
                          <Icon name="close" color="#fff" size={10} />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity style={styles.center} onPress={() => pickPhoto(setAadharBack)}>
                        <Icon name="camera-outline" size={24} color={COLORS.gray} />
                        <Text style={styles.uploadText}>{i18n.t('register.idVerification.backSide', { lng: language })}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {/* PAN */}
              <View>
                <Text style={styles.idLabel}>{i18n.t('register.idVerification.panTitle', { lng: language })}</Text>
                <View style={styles.idRow}>
                  <View style={styles.idBox}>
                    {panFront ? (
                      <>
                        <Image source={{ uri: getImageUrl(panFront) }} style={styles.idImg} resizeMode="cover" />
                        <TouchableOpacity style={styles.closeBadge} onPress={() => setPanFront(null)}>
                          <Icon name="close" color="#fff" size={10} />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity style={styles.center} onPress={() => pickPhoto(setPanFront)}>
                        <Icon name="camera-outline" size={24} color={COLORS.gray} />
                        <Text style={styles.uploadText}>{i18n.t('register.idVerification.frontSide', { lng: language })}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.idBox}>
                    {panBack ? (
                      <>
                        <Image source={{ uri: getImageUrl(panBack) }} style={styles.idImg} resizeMode="cover" />
                        <TouchableOpacity style={styles.closeBadge} onPress={() => setPanBack(null)}>
                          <Icon name="close" color="#fff" size={10} />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity style={styles.center} onPress={() => pickPhoto(setPanBack)}>
                        <Icon name="camera-outline" size={24} color={COLORS.gray} />
                        <Text style={styles.uploadText}>{i18n.t('register.idVerification.backSide', { lng: language })}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* --- FAMILY & LIFESTYLE --- */}
            <Text style={styles.sectionHeader}>{i18n.t('register.labels.familyDetails', { lng: language })}</Text>
            <CustomPicker label={i18n.t('register.labels.fatherStatus', { lng: language })} selectedValue={fatherStatus} onValueChange={setFatherStatus} items={FATHER_STATUS_OPTIONS} placeholder={i18n.t('register.placeholders.selectFatherStatus', { lng: language })} required />
            <CustomPicker label={i18n.t('register.labels.motherStatus', { lng: language })} selectedValue={motherStatus} onValueChange={setMotherStatus} items={MOTHER_STATUS_OPTIONS} placeholder={i18n.t('register.placeholders.selectMotherStatus', { lng: language })} required />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><FloatingLabelInput label={i18n.t('register.labels.brothers', { lng: language })} value={brothers} onChangeText={setBrothers} required keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><FloatingLabelInput label={i18n.t('register.labels.sisters', { lng: language })} value={sisters} onChangeText={setSisters} required keyboardType="numeric" /></View>
            </View>
            <CustomPicker label={i18n.t('register.labels.familyType', { lng: language })} selectedValue={familyType} onValueChange={setFamilyType} items={[{ name: 'Nuclear', value: 'Nuclear' }, { name: 'Joint', value: 'Joint' }, { name: 'Other', value: 'Other' }]} placeholder={i18n.t('register.placeholders.selectFamilyType', { lng: language })} required />
            <CustomPicker label={i18n.t('register.labels.familyValues', { lng: language })} selectedValue={familyValues} onValueChange={setFamilyValues} items={FAMILY_VALUES_OPTIONS} placeholder={i18n.t('register.placeholders.selectFamilyValues', { lng: language })} required />
            <CustomPicker label={i18n.t('register.labels.familyLocation', { lng: language })} selectedValue={familyLocation} onValueChange={setFamilyLocation} items={(allMetaData.locations || []).map(item => ({ value: item._id, name: `${item.city}, ${item.state}, ${item.country}` }))} placeholder={i18n.t('register.placeholders.selectFamilyLocation', { lng: language })} searchable />

            <Text style={styles.sectionHeader}>{i18n.t('register.labels.lifestyle', { lng: language })}</Text>
            <CustomPicker label={i18n.t('register.labels.diet', { lng: language })} selectedValue={diet} onValueChange={setDiet} items={[{ name: 'Vegetarian', value: 'Vegetarian' }, { name: 'Non-Vegetarian', value: 'Non-Vegetarian' }, { name: 'Eggetarian', value: 'Eggetarian' }, { name: 'Vegan', value: 'Vegan' }, { name: 'Jain', value: 'Jain' }]} placeholder={i18n.t('register.placeholders.selectDiet', { lng: language })} required />
            <CustomPicker label={i18n.t('register.labels.smoking', { lng: language })} selectedValue={smoking} onValueChange={setSmoking} items={[{ name: 'No', value: 'No' }, { name: 'Yes', value: 'Yes' }, { name: 'Occasionally', value: 'Occasionally' }]} placeholder={i18n.t('register.placeholders.smokingHabit', { lng: language })} />
            <CustomPicker label={i18n.t('register.labels.drinking', { lng: language })} selectedValue={drinking} onValueChange={setDrinking} items={[{ name: 'No', value: 'No' }, { name: 'Yes', value: 'Yes' }, { name: 'Occasionally', value: 'Occasionally' }]} placeholder={i18n.t('register.placeholders.drinkingHabit', { lng: language })} />

            {/* Privacy Settings */}
            <Text style={styles.sectionHeader}>{i18n.t('register.labels.privacy', { lng: language })}</Text>
            {(() => {
              const PrivacyToggle = ({ label, value, onChange }) => (
                <View style={{ marginBottom: 15 }}>
                  <Text style={{ fontSize: 14, color: COLORS.black, marginBottom: 8, fontWeight: '600' }}>
                    {label}
                  </Text>
                  <View style={{ flexDirection: 'row', backgroundColor: '#f0f0f0ff', borderRadius: 12, padding: 4, height: 48 }}>
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
                      <Text style={{ fontSize: 14, color: value === 'public' ? COLORS.white : COLORS.darkGray, fontWeight: '500' }}>{i18n.t('privacy.public', { lng: language })}</Text>
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
                      <Text style={{ fontSize: 14, color: value === 'private' ? COLORS.white : COLORS.darkGray, fontWeight: '500' }}>{i18n.t('privacy.private', { lng: language })}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );

              return (
                <>
                  <PrivacyToggle
                    label={i18n.t('register.labels.profileVisibility', { lng: language })}
                    value={profileVisibility}
                    onChange={setProfileVisibility}
                  />
                  <PrivacyToggle
                    label={i18n.t('register.labels.photoVisibility', { lng: language })}
                    value={photoVisibility}
                    onChange={setPhotoVisibility}
                  />
                  <PrivacyToggle
                    label={i18n.t('register.labels.contactVisibility', { lng: language })}
                    value={contactVisibility}
                    onChange={setContactVisibility}
                  />
                </>
              );
            })()}



            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>{i18n.t('headers.editProfile', { lng: language })}</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      )}

      {/* --- PROGRESS MODAL --- */}
      <Modal
        visible={loading}
        transparent={true}
        animationType="fade"
        onRequestClose={() => { }} // Prevent closing by back button
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginBottom: 15 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 5 }}>{i18n.t('editProfileProgress.title', { lng: language })}</Text>

            {/* Progress Bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={{ fontWeight: 'bold', color: COLORS.primary, marginBottom: 10 }}>{uploadProgress}% {i18n.t('editProfileProgress.completed', { lng: language })}</Text>

            <Text style={styles.progressText}>
              {i18n.t('editProfileProgress.body', { lng: language })}
            </Text>
            <Text style={[styles.progressText, { fontSize: 12, marginTop: 10, color: '#888' }]}>
              {i18n.t('editProfileProgress.note', { lng: language })}
            </Text>
          </View>
        </View>
      </Modal>

      {/* --- ADD REQUEST MODAL --- */}
      {requestModalVisible && (
        <DataRequestModal
          visible={requestModalVisible}
          onClose={() => setRequestModalVisible(false)}
          onSubmit={handleDataRequestSubmit}
          initialType={requestInitialType}
        />
      )}

      {/* --- SUCCESS POPUP --- */}
      {successPopup.visible && (
        <SuccessPopup
          visible={successPopup.visible}
          title={successPopup.title}
          message={successPopup.message}
          type={successPopup.type}
          onClose={() => setSuccessPopup({ ...successPopup, visible: false })}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { padding: SIZES.padding, paddingBottom: 50 },
  sectionHeader: { ...FONTS.h3, fontWeight: '700', marginTop: 25, marginBottom: 15, color: COLORS.black },
  sectionBlock: { marginVertical: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black, marginBottom: 5 },
  sectionSub: { fontSize: 12, color: COLORS.gray, marginBottom: 15 },

  // Photo Grid
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  photoBox: { width: '31%', aspectRatio: 1, marginBottom: 10, borderRadius: 8, backgroundColor: '#F5F5F5', overflow: 'hidden' },
  photoImg: { width: '100%', height: '100%' },
  addPhotoBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.gray, borderRadius: 8 },
  removeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 3 },

  // ID Cards
  idLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: COLORS.black },
  idRow: { flexDirection: 'row', justifyContent: 'space-between' },
  idBox: { width: '48%', aspectRatio: 1.6, borderRadius: 8, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: COLORS.gray, borderStyle: 'dashed', overflow: 'hidden' },
  idImg: { width: '100%', height: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  uploadText: { fontSize: 11, color: COLORS.gray, marginTop: 4 },
  closeBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', padding: 3, borderRadius: 10 },

  saveBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: SIZES.radius, alignItems: 'center', marginTop: 30 },
  saveText: { color: COLORS.white, ...FONTS.h3, fontWeight: '600' },

  // Progress Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'
  },
  modalContent: {
    width: '85%', backgroundColor: COLORS.white, borderRadius: 15, padding: 20, alignItems: 'center', elevation: 5
  },
  progressTrack: {
    width: '100%', height: 10, backgroundColor: '#E0E0E0', borderRadius: 5, marginVertical: 15, overflow: 'hidden'
  },
  progressBar: {
    height: '100%', backgroundColor: COLORS.primary
  },
  progressText: {
    fontSize: 14, color: COLORS.darkGray, textAlign: 'center', marginTop: 5, lineHeight: 20
  }
});

export default EditProfileScreen;
