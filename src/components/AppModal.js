import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const AppModal = ({
  visible,
  title = 'Notice',
  message,
  primaryText = 'OK',
  onPrimaryPress,
  secondaryText,
  onSecondaryPress,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.buttons}>
            {secondaryText ? (
              <TouchableOpacity
                onPress={onSecondaryPress}
                style={[styles.button, styles.secondaryButton]}
              >
                <Text style={[styles.buttonText, { color: COLORS.black }]}>
                  {secondaryText}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={onPrimaryPress}
              style={[styles.button, styles.primaryButton]}
            >
              <Text style={styles.buttonText}>{primaryText}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <AntDesign name="close" size={20} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    width: '80%',
  },
  title: {
    ...FONTS.h3,
    color: COLORS.primary,
    marginBottom: SIZES.base / 2,
  },
  message: {
    ...FONTS.body3,
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  button: {
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.lightGray,
  },
  buttonText: {
    ...FONTS.body3,
    color: COLORS.white,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

export default AppModal;
