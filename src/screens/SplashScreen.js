import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

const SplashScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  logo: {
    width: 400,
    height: 400,
    resizeMode: 'cover',
    marginBottom: 20,
  },
  text: {
    ...FONTS.h1,
    color: COLORS.primary,
  },
});

export default SplashScreen;
