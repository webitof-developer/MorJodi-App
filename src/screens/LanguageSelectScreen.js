import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { LanguageContext } from '../contexts/LanguageContext';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n, { setI18nConfig } from '../localization/i18n';

const LANGUAGES = [
  { code: 'en', key: 'languageSetting.english' },
  { code: 'hi', key: 'languageSetting.hindi' },
  { code: 'cg', key: 'languageSetting.chhattisgarhi' },
];

const LanguageSelectScreen = ({ navigation }) => {
  const { language, changeLanguage } = useContext(LanguageContext);
  const [selected, setSelected] = useState(language || 'en');


  const onSelectLanguage = (code) => {
    setSelected(code);
    // Preview language instantly on this screen before persisting on Continue
    setI18nConfig(code);
  };
  const onContinue = async () => {
    await changeLanguage(selected);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Background Blobs matching LoginScreen */}
      <View style={styles.bgLayer} pointerEvents="none">
        <View style={styles.blobPrimary} />
        <View style={styles.blobSecondary} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.brand}>{i18n.t('languageSelect.brand')}</Text>
          <Text style={styles.tagline}>{i18n.t('languageSelect.tagline')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{i18n.t('languageSelect.title')}</Text>
          <Text style={styles.subtitle}>{i18n.t('languageSelect.subtitle')}</Text>

          <View style={styles.toggleRow}>
            {LANGUAGES.map((item) => (
              <Pressable
                key={item.code}
                onPress={() => onSelectLanguage(item.code)}
                style={[
                  styles.togglePill,
                  selected === item.code && styles.togglePillActive,
                ]}
              >
                <View style={styles.toggleLeft}>
                  <Icon
                    name="globe"
                    size={16}
                    color={selected === item.code ? COLORS.primary : COLORS.darkGray}
                    style={styles.toggleIcon}
                  />
                  <Text
                    style={[
                      styles.toggleText,
                      selected === item.code && styles.toggleTextActive,
                    ]}
                  >
                    {i18n.t(item.key)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    selected === item.code && styles.radioOuterActive,
                  ]}
                >
                  {selected === item.code ? <View style={styles.radioInner} /> : null}
                </View>
              </Pressable>
            ))}
          </View>

          <TouchableOpacity
            style={styles.otpButton}
            onPress={onContinue}
          >
            <Text style={styles.otpButtonText}>{i18n.t('languageSelect.continue')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LanguageSelectScreen;

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
    justifyContent: 'center',
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
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    gap: 10,
    width: '100%',
    marginBottom: 24,
  },

  togglePill: {
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#f7f7fb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e8e8ef',
  },

  togglePillActive: {
    backgroundColor: 'rgba(181, 7, 42, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(181, 7, 42, 0.35)',
  },

  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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

  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.8,
    borderColor: '#b9b9c4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioOuterActive: {
    borderColor: COLORS.primary,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  otpButton: {
    width: '100%',
    paddingVertical: 15,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },

  otpButtonText: {
    color: COLORS.white,
    ...FONTS.h4,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});


