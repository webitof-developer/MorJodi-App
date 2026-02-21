import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';

const ModalAlert = ({ visible, title, message, onClose, primaryLabel = 'OK' }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>{primaryLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius * 1.2,
    padding: SIZES.padding,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.black,
    marginBottom: 8,
  },
  message: {
    ...FONTS.body3,
    color: COLORS.darkGray,
    marginBottom: SIZES.base * 2,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  buttonText: {
    ...FONTS.h4,
    color: COLORS.white,
    fontWeight: '700',
  },
});

export default ModalAlert;
