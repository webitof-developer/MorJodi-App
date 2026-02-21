import React, { createContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { setI18nConfig } from '../localization/i18n';

const LANGUAGE_KEY = 'APP_LANGUAGE';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(null);
  const [isLanguageSelected, setIsLanguageSelected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);

      if (savedLang) {
        setI18nConfig(savedLang);
        setLanguage(savedLang);
        setIsLanguageSelected(true);
      }

      setLoading(false);
    })();
  }, []);

  const changeLanguage = async (lang) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    setI18nConfig(lang);
    setLanguage(lang);
    setIsLanguageSelected(true); // 🔥 THIS IS THE KEY
  };

  const value = useMemo(
    () => ({
      language,
      changeLanguage,
      isLanguageSelected,
      loading,
    }),
    [language, isLanguageSelected, loading],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
