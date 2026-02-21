export const COLORS = {
  primary: '#b5072a', // Tomato
  secondary: '#4682B4', // SteelBlue
  accent: '#FFD700', // Gold

  white: '#FFFFFF',
  orange: '#FFA500',
  blue: '#0000FF',
  yellow: '#FFFF00',
  green: '#00FF00',
  red: '#FF0000',
  black: '#000000',
  gray: '#CCCCCC',
  lightGray: '#EEEEEE',
  darkGray: '#333333',
  lightBlack: '#555555',
  success: '#28A745', // Green
  danger: '#DC3545', // Red
  warning: '#FFC107', // Yellow
  info: '#17A2B8', // Cyan
  redbg: '#fee2e2', // Red
  
  iconColor: '#6b7280', // Clean gray for inactive
};

export const SIZES = {
  base: 8,
  font: 14,
  radius: 12,
  padding: 24,

  h1: 30,
  h2: 22,
  h3: 16,
  h4: 14,
  body1: 30,
  body2: 22,
  body3: 16,
  body4: 14,
  body5: 12,
  body6: 10,
  small: 3,
};

export const FONTS = {
  h1: { fontFamily: 'Poppins-semiBold', fontSize: SIZES.h1, lineHeight: 36 },
  h2: { fontFamily: 'Poppins-SemiBold', fontSize: SIZES.h2, lineHeight: 30 },
  h3: { fontFamily: 'Poppins-Medium', fontSize: SIZES.h3, lineHeight: 24 },
  h4: { fontFamily: 'Poppins-Medium', fontSize: SIZES.h4, lineHeight: 22 },

  body1: { fontFamily: 'Poppins-Regular', fontSize: SIZES.body1, lineHeight: 36 },
  body2: { fontFamily: 'Poppins-Regular', fontSize: SIZES.body2, lineHeight: 30 },
  body3: { fontFamily: 'Poppins-Regular', fontSize: SIZES.body3, lineHeight: 22 },
  body4: { fontFamily: 'Poppins-Regular', fontSize: SIZES.body4, lineHeight: 22 },
  body5: { fontFamily: 'Poppins-Regular', fontSize: SIZES.body5, lineHeight: 20 },
  body6: { fontFamily: 'Poppins-Regular', fontSize: SIZES.body6, lineHeight: 18 },

  small: { fontFamily: 'Poppins-Regular', fontSize: SIZES.small, lineHeight: 18 },
  base: { fontFamily: 'Poppins-Regular', fontSize: SIZES.base, lineHeight: 24 },
};

const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;


