import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';

const MainApp = () => {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Main App</Text>
      </View>
    </SafeAreaView>
  );
};

export default MainApp;
