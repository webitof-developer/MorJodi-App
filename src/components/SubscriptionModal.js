import React,{useContext} from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { LanguageContext } from '../contexts/LanguageContext';
import i18n from '../localization/i18n';
const SubscriptionModal = ({
  visible,
  profileName,
  messageKey,
  message,
  onClose,
  onUpgradePress,
}) => {
   const { language } = useContext(LanguageContext);
  const displayName = profileName || 'this profile';
 const displayMessage =
    message ??
    (messageKey
      ? i18n.t(messageKey, { name: displayName, locale: language })
      : i18n.t('subscriptionModel.subscription_default', {
          name: displayName,
          locale: language,
        }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{i18n.t('subscriptionModel.upgrade_required', { locale: language })}</Text>

          <Text style={styles.message}>{displayMessage}</Text>

          <TouchableOpacity
            onPress={onUpgradePress}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryText}>{i18n.t('subscriptionModel.view_plans', { locale: language })}</Text>
          </TouchableOpacity>

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
    marginBottom: SIZES.base,
    textAlign: 'center',
  },
  message: {
    ...FONTS.body3,
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    marginTop: SIZES.base / 2,
  },
  primaryText: {
    ...FONTS.body3,
    color: COLORS.white,
  },
  closeButton: {
    position: 'absolute',
    top: 6,
    right: 8,
  },
});

export default SubscriptionModal;
