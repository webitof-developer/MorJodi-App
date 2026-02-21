import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES } from '../constants/theme';

const { width } = Dimensions.get('window');

const SuccessPopup = ({ visible, title, message, onClose, type = 'success' }) => {
    // type can be 'success', 'error', 'info'

    const getIcon = () => {
        if (type === 'error') return 'alert-circle';
        if (type === 'info') return 'information-circle';
        return 'checkmark-circle';
    };

    // Use Theme Color (Primary) for a consistent branded look
    // Or allow semantic overrides if strictly needed, but request asked for "Theme Matched"
    const mainColor = COLORS.primary;

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.backdrop}>
                <View style={styles.container}>
                    {/* Header Icon */}
                    <View style={styles.iconContainer}>
                        <Icon name={getIcon()} size={60} color={mainColor} />
                    </View>

                    {/* Content */}
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    {/* Button */}
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: mainColor }]}
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>OK, Got It</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    container: {
        width: width - 60,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        paddingVertical: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    iconContainer: {
        marginBottom: 15,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.black,
        textAlign: 'center',
        marginBottom: 10,
        fontFamily: FONTS.h2?.fontFamily,
    },
    message: {
        fontSize: 15,
        color: COLORS.darkGray || '#666',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
        fontFamily: FONTS.body3?.fontFamily,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: SIZES.radius,
        elevation: 2,
    },
    buttonText: {
        letterSpacing: 1,
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
        textTransform: 'uppercase',
     
    },
});

export default SuccessPopup;
