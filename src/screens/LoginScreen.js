import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import axios from 'axios';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { API_BASE_URL } from '../constants/config';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../localization/i18n';
import ModalAlert from '../components/ModalAlert';

const API_URL = `${API_BASE_URL}/api/user`;

const LoginScreen = ({ navigation }) => {
  const [alertState, setAlertState] = useState({ visible: false, title: '', message: '' });
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loginType, setLoginType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countryCode] = useState('+91');

  const [envConfig, setEnvConfig] = useState({
    emailFound: false,
    mobileFound: false,
  });

  const [loadingEnv, setLoadingEnv] = useState(true);
  const showAlert = (title, message) =>
    setAlertState({ visible: true, title, message });
  const hideAlert = () => setAlertState(prev => ({ ...prev, visible: false }));

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

      setEnvConfig({
        emailFound: emailEnabled,
        mobileFound: phoneEnabled,
      });

      // SET DEFAULT LOGIN TYPE SMARTLY
      if (emailEnabled && !phoneEnabled) setLoginType('email');
      else if (!emailEnabled && phoneEnabled) setLoginType('phone');
      else if (emailEnabled && phoneEnabled) setLoginType('phone');
      else setLoginType(null); // Nothing available; login disabled
    } catch (err) {
      console.log('Env Fetch Error', err);
    } finally {
      setLoadingEnv(false);
    }
  };

  // LOGIN - SEND OTP
  const handleLogin = async () => {
    if (!loginType) {
      showAlert('Invalid method', i18n.t('auth.loginModeUnavailable'));
      return;
    }

    if (loginType === 'email' && !email.trim()) {
      return showAlert('Invalid email', i18n.t('auth.enterEmail'));
    }
    if (loginType === 'phone') {
      const digits = phoneNumber.replace(/[^0-9]/g, '');
      if (!digits || digits.length < 10) {
        return showAlert('Invalid number', i18n.t('auth.enterPhone'));
      }
    }

    try {
      setLoading(true);
      const payload = {
        email: loginType === 'email' ? email : undefined,
        phoneNumber: loginType === 'phone' ? phoneNumber : undefined,
      };

      await axios.post(`${API_URL}/login/request-otp`, payload);

      navigation.navigate('OtpVerify', {
        email,
        phoneNumber,
        type: 'login',
      });
    } catch (error) {
      showAlert('Invalid request', i18n.t('auth.somethingWentWrong'));
    } finally {
      setLoading(false);
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

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.brand}>Mor Jodi</Text>
          <Text style={styles.tagline}>Find your match without friction.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{i18n.t('auth.login')}</Text>
          <Text style={styles.subtitle}>
            Choose how you want to sign in and we will send you a one-time code.
          </Text>

          <View style={styles.toggleRow}>
            {loadingEnv ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <>
                {envConfig.emailFound && (
                  <Pressable
                    onPress={() => setLoginType('email')}
                    style={[
                      styles.togglePill,
                      loginType === 'email' && styles.togglePillActive,
                    ]}
                  >
                    <Icon
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
                      {i18n.t('auth.email')}
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
                    <Icon
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
                      {i18n.t('auth.mobile')}
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </View>

          {loginType && (
            <View style={styles.fieldBlock}>
             
              <View style={styles.inputWrapper}>
                <Icon
                  name={loginType === 'email' ? 'mail' : 'smartphone'}
                  size={16}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                {loginType === 'phone' && (
                  <Text style={styles.inlinePrefix}>{countryCode}</Text>
                )}
                <TextInput
                  style={[styles.input, loginType === 'phone' && styles.inputPhone]}
                  placeholder={
                    loginType === 'email' ? i18n.t('auth.enterEmail') : i18n.t('auth.enterMobile')
                  }
                  placeholderTextColor={COLORS.darkGray}
                  value={loginType === 'email' ? email : phoneNumber}
                  onChangeText={text =>
                    loginType === 'email'
                      ? setEmail(text)
                      : setPhoneNumber(text.replace(/[^0-9]/g, '').slice(0, 10))
                  }
                  keyboardType={loginType === 'phone' ? 'number-pad' : 'email-address'}
                />
              </View>
              <Text style={styles.helper}>
                We will text you a one-time code to keep your account secure.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.otpButton, loading && { opacity: 0.8 }]}
            disabled={!loginType || loading}
            onPress={handleLogin}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.otpButtonText}>{i18n.t('auth.sendOtp')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.registerLink}
          >
            <Text style={styles.registerLinkText}>{i18n.t('auth.noAccount')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// -------------------- STYLES --------------------

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
    top: -120,
    right: -80,
    height: 260,
    width: 260,
    borderRadius: 200,
    backgroundColor: 'rgba(181, 7, 42, 0.12)',
  },

  blobSecondary: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    height: 220,
    width: 220,
    borderRadius: 180,
    backgroundColor: 'rgba(70, 130, 180, 0.08)',
  },

  scroll: {
    flexGrow: 1,
    padding: SIZES.padding,
  },

  hero: {
    backgroundColor: 'rgba(181, 7, 42, 0.08)',
    borderRadius: SIZES.radius * 1.5,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
  },

  brand: {
    ...FONTS.h1,
    color: COLORS.primary,
  },

  tagline: {
    ...FONTS.body3,
    color: COLORS.darkGray,
    marginTop: 6,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius * 1.25,
    padding: SIZES.padding,
  shadowColor: '#eaeaeaff',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  title: {
    ...FONTS.h2,
    color: COLORS.black,
  },

  subtitle: {
    ...FONTS.body3,
    color: COLORS.darkGray,
    marginTop: 6,
    marginBottom: 18,
  },

  toggleRow: {
  flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  gap: 15,
    width: '100%',
    marginBottom: 15,
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

  toggleText: {
    ...FONTS.body3,
    color: COLORS.darkGray,
    fontWeight: '600',
  },

  toggleTextActive: {
    color: COLORS.primary,
  },

  fieldBlock: {
    marginBottom: 18,
  },

  inputLabel: {
    ...FONTS.body4,
    color: COLORS.darkGray,
    marginBottom: 6,
  },

  input: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
    ...FONTS.body3,
    color: COLORS.black,
    lineHeight: 24,
    height: 24,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },

  inputPhone: {
    letterSpacing: 0,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    backgroundColor: '#ffffff',
    borderRadius: SIZES.radius * 1.3,
    paddingHorizontal: SIZES.base * 1.5,
    paddingVertical: 0,
    height: 56,
    shadowColor: '#eaeaeaff',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  inputIcon: {
    marginRight: SIZES.base * 1.25,
    alignSelf: 'center',
  },

  inlinePrefix: {
    ...FONTS.body3,
    color: COLORS.darkGray,
    marginRight: SIZES.base * 0.5,
  },

  ccWrapper: {
    paddingHorizontal: SIZES.base * 1.25,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: '#e6e6e6',
    marginRight: SIZES.base * 1.25,
  },

  ccText: {
    ...FONTS.body3,
    color: COLORS.darkGray,
  },

  helper: {
    ...FONTS.body4,
    color: COLORS.darkGray,
    marginTop: 6,
  },

  otpButton: {
    width: '100%',
    paddingVertical: 15,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  otpButtonText: {
    color: COLORS.white,
    ...FONTS.h4,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  registerLink: {
    alignItems: 'center',
    marginTop: 8,
  },

  registerLinkText: {
    ...FONTS.body3,
    color: COLORS.darkGray,
  },
});

export default LoginScreen;
