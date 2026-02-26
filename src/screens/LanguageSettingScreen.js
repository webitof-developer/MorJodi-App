import React, { useContext } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LanguageContext } from '../contexts/LanguageContext';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import i18n from '../localization/i18n';

const LanguageSettingScreen = () => {
  const { language, changeLanguage } = useContext(LanguageContext);

  const renderOption = (code, label) => {
    const selected = language === code;

    return (
      <Pressable
        key={code}
        onPress={() => changeLanguage(code)}
        style={styles.radioOption}
      >
        {/* Label */}
        <Text
          style={[
            styles.toggleText,
            selected && styles.activeText,
          ]}
        >
          {label}
        </Text>

        {/* Radio Button (RIGHT SIDE) */}
        <View
          style={[
            styles.outerCircle,
            selected && styles.selectedOuterCircle,
          ]}
        >
          {selected && <View style={styles.selectedInnerCircle} />}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {renderOption('en', i18n.t('languageSetting.english'))}
      {renderOption('hi', i18n.t('languageSetting.hindi'))}
      {renderOption('cg', i18n.t('languageSetting.chhattisgarhi'))}
    </View>
  );
};

export default LanguageSettingScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
  },

  radioOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: COLORS.lightGray,
  },

  toggleText: {
    ...FONTS.body3,
    color: COLORS.gray,
  },

  activeText: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  outerCircle: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedOuterCircle: {
    borderColor: COLORS.primary,
  },

  selectedInnerCircle: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
});

