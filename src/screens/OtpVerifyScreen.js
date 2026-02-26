import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import ModalAlert from '../components/ModalAlert';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { API_BASE_URL } from '../constants/config';
import {
  loginSuccess,
  setUserData,
  setLoading,
} from '../redux/actions/authActions';
import i18n from '../localization/i18n';

const API_URL = `${API_BASE_URL}/api/user`;
const OTP_LENGTH = 6;

const OtpVerifyScreen = ({ route, navigation }) => {
  const { email, phoneNumber, type, otpExpires: initialOtpExpires } = route.params;
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(0);
  const [resendEnabled, setResendEnabled] = useState(false);
  const { loading } = useSelector(state => state.auth);
  const [submitting, setSubmitting] = useState(false);
  const [alertState, setAlertState] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const inputRefs = useRef([]);
  const autoSubmitRef = useRef(null);
  const dispatch = useDispatch();
  const showAlert = (title, message) =>
    setAlertState({ visible: true, title, message });
  const hideAlert = () => setAlertState(prev => ({ ...prev, visible: false }));

  useEffect(() => {
    let interval;
    const startTimer = expiresAt => {
      const now = Date.now();
      const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimer(remainingSeconds);
      setResendEnabled(remainingSeconds === 0);

      if (remainingSeconds > 0) {
        interval = setInterval(() => {
          setTimer(prev => {
            if (prev === 1) {
              clearInterval(interval);
              setResendEnabled(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    };

    if (initialOtpExpires && initialOtpExpires > Date.now()) {
      startTimer(initialOtpExpires);
    } else {
      const newExpiry = Date.now() + 2 * 60 * 1000;
      startTimer(newExpiry);
    }

    return () => clearInterval(interval);
  }, [initialOtpExpires]);

  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  const focusNext = index => {
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const focusPrev = index => {
    if (index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const tryClipboardFill = async firstChar => {
    try {
      const clip = await Clipboard.getString();
      const digits = (clip || '').replace(/\D/g, '');
      if (digits.length === OTP_LENGTH && digits.startsWith(firstChar)) {
        setOtp(digits.slice(0, OTP_LENGTH).split(''));
        return true;
      }
    } catch (err) {
      // ignore clipboard errors
    }
    return false;
  };

  const handleOtpChange = async (text, index) => {
    const sanitized = text.replace(/\D/g, '');
    const prevValue = otp[index];

    // Bulk paste directly into any box
    if (sanitized.length > 1) {
      const chars = sanitized.slice(0, OTP_LENGTH).split('');
      const filled = Array(OTP_LENGTH)
        .fill('')
        .map((_, i) => chars[i] || '');
      setOtp(filled);
      return;
    }

    // Deletion: if clearing a box, move focus back
    if (!sanitized) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      if (prevValue && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }

    // Single char entry
    const newOtp = [...otp];
    newOtp[index] = sanitized;
    setOtp(newOtp);

    // If the user pasted a full code but maxLength trimmed it, try clipboard
    if (sanitized && index === 0 && otp.every(d => d === '')) {
      const filled = await tryClipboardFill(sanitized);
      if (filled) return;
    }

    focusNext(index);
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    if (autoSubmitRef.current) clearTimeout(autoSubmitRef.current);
    const joined = otp.join('');
    if (joined.length === OTP_LENGTH && !submitting && !loading) {
      autoSubmitRef.current = setTimeout(() => handleVerifyOtp(joined), 250);
    }
    return () => {
      if (autoSubmitRef.current) clearTimeout(autoSubmitRef.current);
    };
  }, [otp, submitting, loading]);

  const isMounted = useRef(true);
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const handleVerifyOtp = async forcedOtp => {
    const fullOtp = forcedOtp || otp.join('');
    if (fullOtp.length !== OTP_LENGTH) {
      showAlert('Invalid OTP', i18n.t('otp.enterOtpError'));
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      if (isMounted.current) dispatch(setLoading(true));

      const payload = {
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
        otp: fullOtp,
      };

      let response;
      if (type === 'register') {
        response = await axios.post(`${API_URL}/register/verify-otp`, payload);
      } else if (type === 'login') {
        response = await axios.post(`${API_URL}/login/verify-otp`, payload);
      }

      const { token, user } = response.data.data;
      await AsyncStorage.setItem('token', token);

      // Dispatch both token and user immediately. 
      // This ensures authReducer updates isApproved/isPremium correctly.
      dispatch(loginSuccess({ token, user }));

      // We don't need to call singleuser again as verify-otp returns the full user profile.
      if (isMounted.current) dispatch(setLoading(false));
    } catch (error) {
      if (isMounted.current) {
        dispatch(setLoading(false));
        showAlert('Invalid OTP', error.response?.data?.message || i18n.t('otp.somethingWrong'));
      }
    } finally {
      if (isMounted.current) setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!resendEnabled || submitting || loading) return;

    try {
      const payload = { email: email || undefined, phoneNumber: phoneNumber || undefined };
      let response;

      if (type === 'register') {
        response = await axios.post(`${API_URL}/register/request-otp`, payload);
      } else if (type === 'login') {
        response = await axios.post(`${API_URL}/login/request-otp`, payload);
      }

      showAlert('OTP Sent', response.data.message || i18n.t('otp.otpResent'));

      const filled = Array(OTP_LENGTH).fill('');
      setOtp(filled);
      inputRefs.current[0]?.focus();

      const newOtpExpires = response.data.otpExpires || Date.now() + 2 * 60 * 1000;
      const now = Date.now();
      const remainingSeconds = Math.max(0, Math.floor((newOtpExpires - now) / 1000));
      setTimer(remainingSeconds);
      setResendEnabled(false);
    } catch (error) {
      showAlert('OTP Error', error.response?.data?.message || i18n.t('otp.resendFailed'));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ModalAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        onClose={hideAlert}
      />

      <View style={styles.bgLayer} pointerEvents="none">
        <View style={styles.blobPrimary} />
        <View style={styles.blobSecondary} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.heading}>{i18n.t('otp.verify')}</Text>
          <Text style={styles.subtitle}>
            {i18n.t('otp.sentTo', { value: email || phoneNumber })}
          </Text>

          <Text style={styles.timerText}>
            {i18n.t('otp.expiresIn')} {formatTime(timer)}
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                style={[
                  styles.otpInput,
                  { borderColor: digit !== '' ? COLORS.primary : '#e1e1e1' },
                ]}
                ref={ref => (inputRefs.current[index] = ref)}
                value={digit}
                onChangeText={text => handleOtpChange(text, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                returnKeyType="done"
                textAlign="center"
                allowFontScaling={false}
                autoFocus={index === 0}
              />
            ))}
          </View>

          <Pressable
            style={[styles.verifyBtn, (loading || submitting) && { opacity: 0.7 }]}
            onPress={() => handleVerifyOtp()}
            disabled={loading || submitting}
          >
            {loading || submitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.verifyBtnText}>{i18n.t('otp.verify')}</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleResendOtp}
            disabled={!resendEnabled}
            style={{ alignItems: 'center', marginTop: SIZES.base }}
          >
            <Text
              style={[
                styles.resendText,
                { color: resendEnabled ? COLORS.primary : COLORS.gray },
              ]}
            >
              {i18n.t('otp.resend')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fdf6f7',
  },

  bgLayer: {
    position: 'absolute',
    inset: 0,
  },

  blobPrimary: {
    position: 'absolute',
    top: -140,
    right: -100,
    height: 280,
    width: 280,
    borderRadius: 240,
    backgroundColor: 'rgba(181, 7, 42, 0.12)',
  },

  blobSecondary: {
    position: 'absolute',
    bottom: -120,
    left: -100,
    height: 240,
    width: 240,
    borderRadius: 220,
    backgroundColor: 'rgba(70, 130, 180, 0.08)',
  },

  scroll: {
    flexGrow: 1,
    padding: SIZES.padding,
    justifyContent: 'center',
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius * 1.5,
    padding: 20, // Reduced from 24 for more horizontal room
    shadowColor: '#eaeaeaff',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  heading: {
    ...FONTS.h2,
    color: COLORS.black,
    marginBottom: 6,
  },

  subtitle: {
    ...FONTS.body3,
    color: COLORS.darkGray,
    marginBottom: SIZES.base,
  },

  timerText: {
    ...FONTS.body4,
    color: COLORS.darkGray,
    marginBottom: SIZES.padding,
  },

  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Center group to avoid overlap with edges
    marginBottom: SIZES.padding,
    width: '100%',
  },

  otpInput: {
    flex: 1,
    height: 48,
    marginHorizontal: 2,
    borderWidth: 1.5,
    borderRadius: SIZES.radius,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    backgroundColor: '#fafafa',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },

  verifyBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },

  verifyBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },

  resendText: {
    ...FONTS.body3,
    textDecorationLine: 'underline',
  },
});

export default OtpVerifyScreen;
