import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LanguageContext } from '../contexts/LanguageContext';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
 
];

const LanguageSelectScreen = () => {
  const { changeLanguage } = useContext(LanguageContext);
  const [selected, setSelected] = useState('en');

  const onContinue = async () => {
    await changeLanguage(selected);
    // Once the language is saved, AppNavigator switches stacks and shows Onboarding.
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Language</Text>

      {LANGUAGES.map(item => {
        const active = selected === item.code;

        return (
          <TouchableOpacity
            key={item.code}
            style={[styles.option, active && styles.optionActive]}
            onPress={() => setSelected(item.code)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={active ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={active ? COLORS.primary : COLORS.gray}
              style={styles.icon}
            />

            <Text style={[styles.label, active && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity style={styles.cta} onPress={onContinue}>
        <Text style={styles.ctaText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LanguageSelectScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
  },

  title: {
    ...FONTS.h2,
    color: COLORS.black,
    marginBottom: SIZES.padding,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.base * 1.75,
    paddingHorizontal: SIZES.base * 2,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    marginBottom: SIZES.base * 1.5,
    backgroundColor: COLORS.white,
  },

  optionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10', // subtle tint
  },

  icon: {
    marginRight: SIZES.base * 1.5,
  },

  label: {
    ...FONTS.body3,
    color: COLORS.darkGray,
  },

  labelActive: {
    color: COLORS.black,
    fontFamily: 'Poppins-Medium',
  },

  cta: {
    marginTop: 'auto',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base * 2,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },

  ctaText: {
    ...FONTS.h3,
    color: COLORS.white,
  },
});
