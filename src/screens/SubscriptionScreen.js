import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const SubscriptionScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Text style={styles.title}>Upgrade to Premium</Text>
        <Text style={styles.description}>
          Unlock all features, view private profiles, and get unlimited likes!
        </Text>
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={() => {
            // Handle subscription logic here
            alert('Navigating to payment gateway...');
            // After successful subscription, you might want to navigate back or to a confirmation screen
            // navigation.goBack();
          }}
        >
          <Text style={styles.subscribeButtonText}>Choose a Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>No Thanks</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.dark,
    marginBottom: SIZES.base,
  },
  description: {
    ...FONTS.body3,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  subscribeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding * 2,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.base,
  },
  subscribeButtonText: {
    color: COLORS.white,
    ...FONTS.h2,
  },
  backButton: {
    padding: SIZES.base,
  },
  backButtonText: {
    color: COLORS.gray,
    ...FONTS.body4,
  },
});

export default SubscriptionScreen;
