module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|react-native-|react-native-image-picker|@react-native-picker|react-native-element-dropdown|@react-navigation|react-redux|@reduxjs/toolkit|immer|@react-native-firebase)/)',
  ],
  setupFiles: ['./jest.setup.js'],
};
