import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import AwesomeAlert from './AwesomeAlert';
import { COLORS, FONTS } from '../constants/theme'; // Ensure these exist
import i18n from '../localization/i18n';

/**
 * Universal ActionGuard
 * 
 * Usage:
 * <ActionGuard onAction={() => doSomething()} restrict="approval">
 *   <Button />
 * </ActionGuard>
 * 
 * Props:
 * - onAction: Function to call if checks pass
 * - restrict: 'approval' | 'premium' | 'both' (default 'approval')
 * - children: The wrapped UI element
 */
const ActionGuard = ({ children, onAction, restrict = 'approval' }) => {
    const { isApproved, isPremium } = useSelector(state => state.auth);
    const navigation = useNavigation();
    const [showAlert, setShowAlert] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});

    const handlePress = () => {
        // 1. Check Approval
        if ((restrict === 'approval' || restrict === 'both') && !isApproved) {
            setAlertConfig({
                title: i18n.t('actionGuard.accountPendingTitle'),
                message: i18n.t('actionGuard.accountPendingMessage'),
                confirmText: i18n.t('actionGuard.ok'),
                onConfirm: () => setShowAlert(false)
            });
            setShowAlert(true);
            return;
        }

        // 2. Check Premium
        if ((restrict === 'premium' || restrict === 'both') && !isPremium) {
            setAlertConfig({
                title: i18n.t('actionGuard.premiumFeatureTitle'),
                message: i18n.t('actionGuard.premiumFeatureMessage'),
                confirmText: i18n.t('actionGuard.upgrade'),
                showCancel: true,
                cancelText: i18n.t('actionGuard.cancel'),
                onConfirm: () => {
                    setShowAlert(false);
                    navigation.navigate('Upgrade'); // Ensure 'Upgrade' route exists
                },
                onCancel: () => setShowAlert(false)
            });
            setShowAlert(true);
            return;
        }

        // Pass
        if (onAction) onAction();
    };

    return (
        <>
            <View onTouchEnd={handlePress} style={{ flex: 1 }}>
                {children}
            </View>

            <AwesomeAlert
                show={showAlert}
                showProgress={false}
                title={alertConfig.title}
                message={alertConfig.message}
                closeOnTouchOutside={true}
                closeOnHardwareBackPress={false}
                showCancelButton={!!alertConfig.showCancel}
                showConfirmButton={true}
                cancelText={alertConfig.cancelText}
                confirmText={alertConfig.confirmText}
                confirmButtonColor={COLORS.primary}
                onCancelPressed={alertConfig.onCancel}
                onConfirmPressed={alertConfig.onConfirm}
                titleStyle={{ fontSize: 18, fontWeight: 'bold' }}
                messageStyle={{ fontSize: 14, textAlign: 'center' }}
            />
        </>
    );
};

export default ActionGuard;
