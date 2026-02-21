import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../localization/i18n';
const { width, height } = Dimensions.get('window');



const OnboardingScreen = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const navigation = useNavigation();

  const onboardingData = [
    {
      title: i18n.t('onboarding.slide1_title'),
      desc: i18n.t('onboarding.slide1_desc'),
      image: require('../assets/onboarding1.jpg'),
    },
    {
      title: i18n.t('onboarding.slide2_title'),
      desc: i18n.t('onboarding.slide2_desc'),
      image: require('../assets/onboarding2.jpg'),
    },
    {
      title: i18n.t('onboarding.slide3_title'),
      desc: i18n.t('onboarding.slide3_desc'),
      image: require('../assets/onboarding3.jpg'),
    },
  ];
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <ScrollView
          horizontal
          pagingEnabled
          onScroll={e => {
            const contentOffsetX = e.nativeEvent.contentOffset.x;
            setCurrentPage(Math.floor(contentOffsetX / width));
          }}
          showsHorizontalScrollIndicator={false}
          style={styles.scrollContainer}
        >
          {onboardingData.map((data, index) => (
            <View style={styles.page} key={index}>
              <Image source={data.image} style={styles.image} />
              {/* Gradient Overlay */}
              <LinearGradient
                colors={['transparent', COLORS.white]}
                style={styles.bottomGradient}
              />

              <View style={styles.textAndDotsContainer}>
                <Text
                  style={styles.title}


                >
                  {data.title}
                </Text>
                <Text style={styles.desc}>{data.desc}</Text>
                <View style={styles.dotContainer}>
                  {onboardingData.map((_, dotIndex) => (
                    <View
                      key={dotIndex}
                      style={[
                        styles.dot,
                        currentPage === dotIndex && styles.activeDot,
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.buttonText}>{i18n.t('onboarding.register')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>{i18n.t('onboarding.login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContainer: {
    flex: 1,
  },
  page: {
    width,
    height: height * 0.8, // Allocate 80% of height for image and text
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%', // Gradient from bottom to mid
  },
  textAndDotsContainer: {
    position: 'absolute',
    bottom: SIZES.padding,
    left: SIZES.base,
    right: SIZES.base,
    alignItems: 'center',
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    margin: SIZES.base * 2,
  },
  dot: {
    width: SIZES.base,
    height: SIZES.base,
    marginHorizontal: SIZES.base / 2,
    borderRadius: SIZES.base / 2,
    backgroundColor: COLORS.gray,
  },
  activeDot: {
    width: SIZES.base * 3,
    backgroundColor: COLORS.primary,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: SIZES.base,
    width: '100%',
    paddingHorizontal: 10,
  },
  desc: {
    ...FONTS.body3,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.padding,
    backgroundColor: COLORS.white, // Ensure buttons have a white background
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base * 2,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.base,
    alignItems: 'center',
  },
  loginButton: {
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingVertical: SIZES.base * 2,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  buttonText: {
    ...FONTS.h3,
    color: COLORS.white,
  },
  loginButtonText: {
    ...FONTS.h3,
    color: COLORS.primary,
  },
});

export default OnboardingScreen;
