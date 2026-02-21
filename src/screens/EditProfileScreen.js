import React, { useState, useEffect, useMemo } from 'react';
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

import { API_BASE_URL } from '../constants/config';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import SkeletonEditProfile from '../components/SkeletonEditProfile';
import { updateUserData } from '../redux/actions/authActions';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = `${API_BASE_URL}/api/user`;
const META_API_BASE_URL = `${API_BASE_URL}/api/meta`;
const ABOUT_ME_MAX = 500;

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
        Alert.alert("Notice", disabledMessage); // Keeping fallback or refactor parent to pass handler.
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
  // Initialize with existing photos, ensuring user.image is first (Main Profile Pic)
  const [profilePhotos, setProfilePhotos] = useState(() => {
    const photos = [];
    if (user?.image) photos.push(user.image);
    if (user?.photos && Array.isArray(user.photos)) {
      // Filter out duplicates if needed, or just append
      const others = user.photos.filter(p => p !== user.image);
      photos.push(...others);
    }
    return photos.slice(0, 6);
  });
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
        const metaRes = await axios.get(`${META_API_BASE_URL}/profile-meta`);
        setAllMetaData(metaRes.data);

        // 2. Fetch User Profile (Fresh)
        const token = await AsyncStorage.getItem('token');
        const userRes = await axios.get(`${API_BASE_URL}/api/user/singleuser`, {
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
          const photos = new Array(6).fill(null);
          // Slot 0: Main Image
          if (u.image) photos[0] = u.image;

          let nextSlot = 1;
          if (u.photos && Array.isArray(u.photos)) {
            const others = u.photos.filter(p => p !== u.image);
            others.forEach(p => {
              if (nextSlot < 6) {
                photos[nextSlot] = p;
                nextSlot++;
              }
            });
          }
          setProfilePhotos(photos);


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

  const removeGalleryPhoto = (index) => {
    // Replace with null to keep grid structure if needed, 
    // BUT the user wants "jo remove karunga usi position ka remove ho".
    // If we want to maintain the "slot", we should set it to null.
    // However, the rendering logic iterates [0..5] and checks profilePhotos[index].
    // If profilePhotos is ["A", "B"], index 0 is A, index 1 is B.
    // If i remove A, array becomes ["B"]. Index 0 is now B.
    // The user likely wants to keep empty slots.

    const newPhotos = [...profilePhotos];
    // If array length is less than 6, we might not have 'slots'.
    // To support "fixed slots", profilePhotos should be length 6 with nulls.

    // Let's ensure profilePhotos behaves like fixed slots for the UI.
    // If we just restart the array with nulls, we can achieve this.
    // The current state might be just valid photos.

    // The previous logic was: newPhotos.splice(index, 1);
    // This shifts elements.

    // New Logic: 
    // IF the user wants valid photos to shift, then splice is correct.
    // BUT user says "usi position ka remove ho", implying they don't want others to shift?
    // OR they mean "I clicked X on the 2nd photo, but the 3rd one disappeared"?
    // The current mapping is map((_, index) => profilePhotos[index]).
    // If profilePhotos = [A, B, C] and we view 6 slots.
    // Slot 0 shows A. Slot 1 shows B. Slot 2 shows C.
    // User clicks X on Slot 1 (B).
    // splice(1, 1) -> [A, C].
    // Re-render: Slot 0 shows A. Slot 1 shows C. Slot 2 is empty.
    // It DOES shift C into Slot 1.
    // If the USER does NOT want shift, we must use nulls.
    // BUT our backend expects a list of photos.
    // We can handle nulls in UI and filter them out before save.

    // Let's changing state to strictly fixed 6-sized array?
    // Or just assign null/undefined at that index if we want it empty.
    if (index < newPhotos.length) {
      newPhotos[index] = null; // Mark as empty
      // We might need to filter 'null's out during SAVE, or keep them to maintain order?
      // Usually backend just takes a list.
      // Let's filter empties only on SAVE.

      // BUT wait, if we have [A, null, C].
      // The rendering loop uses `profilePhotos[index]`.
      // Index 0: A. Index 1: null -> shows (+) button. Index 2: C.
      // This matches "usi position ka remove ho".
      setProfilePhotos(newPhotos);

      // If removing the main profile image (index 0), update Redux immediately
      // so drawer sidebar syncs
      if (index === 0) {
        // Find the next available photo to use as main image
        const nextPhoto = newPhotos.find((p, i) => i > 0 && p !== null);
        const validPhotos = newPhotos.filter(p => p !== null);

        // Update Redux store with new image AND photos to prevent fallback to deleted image
        dispatch(updateUserData({
          ...user,
          image: nextPhoto || null, // Use next photo or null if none available
          photos: validPhotos // Update photos list so drawer helper doesn't find old photo
        }));
      }
    }
  };

  // --- SAVE HANDLER ---
  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const formData = new FormData();

      // Basic
      formData.append('fullName', fullName);
      formData.append('email', email);
      formData.append('phoneNumber', phoneNumber);
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
      profilePhotos.forEach((p, i) => {
        // Check if it is a new file (local URI)
        const isNewFile = p && (p.startsWith('file:') || p.startsWith('content:'));

        if (i === 0) {
          // Main Profile Picture
          if (isNewFile) {
            const name = `profile_${Date.now()}.jpg`;
            formData.append('image', { uri: p, name, type: 'image/jpeg' });
          } else if (p) {
            // Existing main image (string path)
            formData.append('mainImage', p);
          }
        } else {
          // Gallery Photos
          if (isNewFile) {
            const name = `photo_${i}_${Date.now()}.jpg`;
            formData.append('photos', { uri: p, name, type: 'image/jpeg' });
          } else if (p) {
            // Add to existing photos list
            existingPhotos.push(p);
          }
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
        title: "Success",
        message: "Profile updated successfully!",
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
      // console.error(e);
      setSuccessPopup({
        visible: true,
        title: i18n.t('common.error'),
        message: e.response?.data?.message || "Failed to update profile",
        type: 'error'
      });
    }
  };

  const validateForm = () => {
    let missingFields = [];
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // --- Page 1 Checks ---
    if (!fullName) missingFields.push("Full Name");
    if (!email) missingFields.push("Email");
    else if (!isValidEmail(email)) missingFields.push("Valid Email");

    if (!phoneNumber) missingFields.push("Phone Number");
    else if (phoneNumber.replace(/[^0-9]/g, '').length < 10) missingFields.push("Valid Phone Number (10 digits)");

    // --- Page 2 Checks ---
    if (!gender) missingFields.push("Gender");
    if (!profileFor) missingFields.push("Profile For");
    if (!maritalStatus) missingFields.push("Marital Status");
    if (!manglik) missingFields.push("Manglik");
    if (!dateOfBirth) missingFields.push("Date of Birth");
    if (!height) missingFields.push("Height");

    if (maritalStatus !== 'Never Married' && (!children || children === '0')) {
      missingFields.push("Children");
    }

    // Age Check
    const today = new Date();
    const dob = new Date(dateOfBirth);
    const age = today.getFullYear() - dob.getFullYear();
    const month = today.getMonth() - dob.getMonth();
    const isUnder18 = age < 18 || (age === 18 && month < 0) || (age === 18 && month === 0 && today.getDate() < dob.getDate());

    if (isUnder18) {
      Alert.alert("Age Restriction", "You must be at least 18 years old to register.");
      return false;
    }

    // --- Page 3 Checks ---
    if (!selectedReligion) missingFields.push("Religion");
    if (!selectedCaste) missingFields.push("Caste");
    if (!selectedMotherTongue) missingFields.push("Mother Tongue");
    if (!selectedProfession) missingFields.push("Profession");
    if (!selectedLocation) missingFields.push("Location");
    if (!selectedEducation || selectedEducation.length === 0) missingFields.push("Education");

    // --- Photo Checks ---
    if (profilePhotos.length < 3) {
      Alert.alert("Validation Error", "Please upload at least 3 profile photos.");
      return false;
    }

    // --- ID Checks ---
    if (!aadharFront || !aadharBack) {
      Alert.alert("Validation Error", "Please upload both front and back sides of Aadhar Card.");
      return false;
    }

    // --- Family & Lifestyle Checks ---
    if (!fatherStatus) missingFields.push("Father Status");
    if (!motherStatus) missingFields.push("Mother Status");
    if (!brothers) missingFields.push("Brothers");
    if (!sisters) missingFields.push("Sisters");
    if (!familyType) missingFields.push("Family Type");
    if (!familyValues) missingFields.push("Family Values");
    if (!diet) missingFields.push("Diet");
    if (!annualIncome) missingFields.push("Annual Income");
    if (!aboutMe) missingFields.push("About Me");

    if (missingFields.length > 0) {
      setSuccessPopup({
        visible: true,
        title: "Missing Details",
        message: `Please fill the following required details:\n\n${missingFields.join(', ')}`,
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
              <Text style={styles.sectionTitle}>Profile Photos <Text style={{ color: COLORS.primary }}>*</Text></Text>
              <Text style={styles.sectionSub}>Required minimum 3 images with clear face.</Text>

              <View style={styles.photoGrid}>
                {[...Array(6)].map((_, index) => {
                  const photoUri = profilePhotos[index];
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
                              <Text style={{ color: '#fff', fontSize: 10, textAlign: 'center', fontWeight: 'bold' }}>Main Profile</Text>
                            </View>
                          )}
                        </>
                      ) : (
                        <TouchableOpacity style={styles.addPhotoBtn} onPress={() => pickPhoto(setProfilePhotos, true, index)}>
                          <Icon name="add" size={30} color={COLORS.gray} />
                          {index === 0 && <Text style={{ fontSize: 10, color: COLORS.gray, marginTop: 4 }}>Main Pic</Text>}
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* --- BASIC INFO --- */}
            <Text style={styles.sectionHeader}>Basic Info</Text>

            <FloatingLabelInput label="Full Name" value={fullName} onChangeText={setFullName} required />
            <FloatingLabelInput label="Email" value={email} onChangeText={setEmail} required />
            <FloatingLabelInput
              label="Phone"
              value={phoneNumber}
              onChangeText={text => setPhoneNumber(text.replace(/[^0-9]/g, '').slice(0, 10))}
              required
              keyboardType="numeric"
            />

            <CustomPicker label="Profile For" selectedValue={profileFor} onValueChange={setProfileFor} items={PROFILE_FOR_OPTIONS} disabled disabledMessage="Profile For cannot be changed." onDisabledPress={() => setSuccessPopup({ visible: true, title: "Notice", message: "Profile For cannot be changed.", type: 'info' })} />
            <CustomPicker label="Gender" selectedValue={gender} onValueChange={setGender} items={GENDER_OPTIONS} disabled disabledMessage="Gender cannot be changed." onDisabledPress={() => setSuccessPopup({ visible: true, title: "Notice", message: "Gender cannot be changed.", type: 'info' })} />



            {/* Date of Birth */}
            <View style={{ marginVertical: 10, minHeight: 55 }}>
              <TouchableOpacity
                onPress={() => setSuccessPopup({ visible: true, title: "Notice", message: "Date of Birth cannot be changed.", type: 'info' })}
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
                    Date of Birth
                  </Text>

                  {/* Value */}
                  <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 15 }}>
                    <Text style={{
                      fontSize: 16,
                      color: dateOfBirth ? COLORS.black : COLORS.gray,
                      fontFamily: FONTS.body3.fontFamily,
                    }} numberOfLines={1}>
                      {dateOfBirth ? dateOfBirth.toDateString() : "Select Date"}
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

            <CustomPicker label="Height" selectedValue={height} onValueChange={setHeight} items={HEIGHT_OPTIONS} required searchable />

            {/* --- PERSONAL --- */}
            <CustomPicker
              label="Marital Status"
              selectedValue={maritalStatus}
              onValueChange={setMaritalStatus}
              items={[
                { name: 'Never Married', value: 'Never Married' },
                { name: 'Divorced', value: 'Divorced' },
                { name: 'Widowed', value: 'Widowed' }
              ]}
              required
            />

            {maritalStatus !== 'Never Married' && (
              <CustomPicker
                label="Children"
                selectedValue={children}
                onValueChange={setChildren}
                items={[
                  { name: 'No Children', value: 'No Children' },
                  { name: '1 Child', value: '1 Child' },
                  { name: '2 Children', value: '2 Children' },
                  { name: '3+ Children', value: '3+ Children' },
                  { name: 'Prefer not to say', value: 'Prefer not to say' }
                ]}
              />
            )}

            <FloatingLabelInput label="About Me" value={aboutMe} onChangeText={setAboutMe} multiline containerStyle={{ height: 100 }} required maxLength={ABOUT_ME_MAX} />

            {/* --- RELIGION --- */}
            <Text style={styles.sectionHeader}>Religious & Social</Text>
            <CustomPicker
              label="Religion"
              selectedValue={selectedReligion}
              onValueChange={handleReligionChange}
              items={(allMetaData.religions || []).map(item => ({
                value: item._id,
                name: item.name,
              }))}
              searchable
              required
            />
            <CustomPicker
              label="Caste"
              selectedValue={selectedCaste}
              onValueChange={handleCasteChange}
              items={filteredCastes.map(item => ({
                value: item._id,
                name: item.name,
              }))}
              searchable
              required
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
              label="Sub Caste"
              selectedValue={selectedSubCaste}
              onValueChange={handleSubCasteChange}
              items={filteredSubCastes.map(item => ({
                value: item._id,
                name: item.name,
              }))}
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
              label="Gotra"
              selectedValue={gotra}
              onValueChange={setGotra}
              items={filteredGotras.map(item => ({
                value: item._id,
                name: item.name,
              }))}
              searchable
              onRequestAdd={requestAddGotra}
              disabled={!selectedSubCaste}
              onDisabledPress={() => setSuccessPopup({
                visible: true,
                title: "Attention",
                message: "Please select a Sub Caste first.",
                type: 'info'
              })}
            />
            <CustomPicker label="Manglik" selectedValue={manglik} onValueChange={setManglik} items={[{ name: 'Yes', value: 'Yes' }, { name: 'No', value: 'No' }, { name: 'Doesnt Matter', value: "Doesnt Matter" }]} />

            <CustomPicker label="Mother Tongue" selectedValue={selectedMotherTongue} onValueChange={setSelectedMotherTongue} items={(allMetaData.motherTongues || []).map(item => ({ value: item._id, name: item.name }))} searchable required />
            <CustomPicker label="Raasi" selectedValue={selectedRaasi} onValueChange={setSelectedRaasi} items={(allMetaData.raasis || []).map(item => ({ value: item._id, name: item.name }))} searchable />

            {/* --- CAREER --- */}
            <Text style={styles.sectionHeader}>Education & Career</Text>
            <CustomPicker label="Education" selectedValue={selectedEducation} onValueChange={setSelectedEducation} items={(allMetaData.educations || []).map(item => ({ value: item._id, name: `${item.degree || ''} ${item.field ? `(${item.field})` : ''}` }))} searchable multiSelect />
            <CustomPicker label="Profession" selectedValue={selectedProfession} onValueChange={setSelectedProfession} items={(allMetaData.professions || []).map(item => ({ value: item._id, name: `${item.occupation},${item.industry}` }))} searchable required />
            <CustomPicker label="Location" selectedValue={selectedLocation} onValueChange={setSelectedLocation} items={(allMetaData.locations || []).map(item => ({ value: item._id, name: `${item.city}, ${item.state}, ${item.country}` }))} searchable required />
            <FloatingLabelInput label="Annual Income" value={annualIncome} onChangeText={setAnnualIncome} keyboardType="numeric" />

            {/* --- ID VERIFICATION (Register Style) --- */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>ID Verification</Text>
              <Text style={styles.sectionSub}>Secure your profile with government ID.</Text>

              {/* Aadhar */}
              <View style={{ marginBottom: 15 }}>
                <Text style={styles.idLabel}>Aadhar Card <Text style={{ color: COLORS.primary }}>*</Text></Text>
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
                        <Text style={styles.uploadText}>Front</Text>
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
                        <Text style={styles.uploadText}>Back</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {/* PAN */}
              <View>
                <Text style={styles.idLabel}>PAN Card (Optional)</Text>
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
                        <Text style={styles.uploadText}>Front</Text>
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
                        <Text style={styles.uploadText}>Back</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* --- FAMILY & LIFESTYLE --- */}
            <Text style={styles.sectionHeader}>Family Details</Text>
            <CustomPicker label="Father Status" selectedValue={fatherStatus} onValueChange={setFatherStatus} items={FATHER_STATUS_OPTIONS} required />
            <CustomPicker label="Mother Status" selectedValue={motherStatus} onValueChange={setMotherStatus} items={MOTHER_STATUS_OPTIONS} required />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><FloatingLabelInput label="Brothers" value={brothers} onChangeText={setBrothers} required keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><FloatingLabelInput label="Sisters" value={sisters} onChangeText={setSisters} required keyboardType="numeric" /></View>
            </View>
            <CustomPicker label="Family Type" selectedValue={familyType} onValueChange={setFamilyType} items={[{ name: 'Nuclear', value: 'Nuclear' }, { name: 'Joint', value: 'Joint' }, { name: 'Other', value: 'Other' }]} required />
            <CustomPicker label="Family Values" selectedValue={familyValues} onValueChange={setFamilyValues} items={FAMILY_VALUES_OPTIONS} required />
            <CustomPicker label="Family Location" selectedValue={familyLocation} onValueChange={setFamilyLocation} items={(allMetaData.locations || []).map(item => ({ value: item._id, name: `${item.city}, ${item.state}, ${item.country}` }))} searchable />

            <Text style={styles.sectionHeader}>Lifestyle</Text>
            <CustomPicker label="Diet" selectedValue={diet} onValueChange={setDiet} items={[{ name: 'Vegetarian', value: 'Vegetarian' }, { name: 'Non-Vegetarian', value: 'Non-Vegetarian' }, { name: 'Eggetarian', value: 'Eggetarian' }, { name: 'Vegan', value: 'Vegan' }, { name: 'Jain', value: 'Jain' }]} required />
            <CustomPicker label="Smoking" selectedValue={smoking} onValueChange={setSmoking} items={[{ name: 'No', value: 'No' }, { name: 'Yes', value: 'Yes' }, { name: 'Occasionally', value: 'Occasionally' }]} />
            <CustomPicker label="Drinking" selectedValue={drinking} onValueChange={setDrinking} items={[{ name: 'No', value: 'No' }, { name: 'Yes', value: 'Yes' }, { name: 'Occasionally', value: 'Occasionally' }]} />

            {/* Privacy Settings */}
            <Text style={styles.sectionHeader}>Privacy Settings</Text>
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
                      <Text style={{ fontSize: 14, color: value === 'public' ? COLORS.white : COLORS.darkGray, fontWeight: '500' }}>Public</Text>
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
                      <Text style={{ fontSize: 14, color: value === 'private' ? COLORS.white : COLORS.darkGray, fontWeight: '500' }}>Private</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );

              return (
                <>
                  <PrivacyToggle
                    label="Profile Visibility"
                    value={profileVisibility}
                    onChange={setProfileVisibility}
                  />
                  <PrivacyToggle
                    label="Photo Visibility"
                    value={photoVisibility}
                    onChange={setPhotoVisibility}
                  />
                  <PrivacyToggle
                    label="Contact Visibility"
                    value={contactVisibility}
                    onChange={setContactVisibility}
                  />
                </>
              );
            })()}



            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Save Changes</Text>
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
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 5 }}>Updating Profile</Text>

            {/* Progress Bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={{ fontWeight: 'bold', color: COLORS.primary, marginBottom: 10 }}>{uploadProgress}% Completed</Text>

            <Text style={styles.progressText}>
              Your data is updating and your images are uploading.{'\n'}Please wait for it to complete.
            </Text>
            <Text style={[styles.progressText, { fontSize: 12, marginTop: 10, color: '#888' }]}>
              Note: Time taken depends on your internet connection speed.
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
