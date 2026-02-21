import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/actions/authActions';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const PendingApprovalScreen = () => {
    const dispatch = useDispatch();

    const handleLogout = () => {
        dispatch(logout());
    };

    const handleContactSupport = () => {
        Linking.openURL('mailto:support@morjodi.com');
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="account-clock" size={80} color={COLORS.warning} />
                </View>

                <Text style={styles.title}>Approval Pending</Text>

                <Text style={styles.message}>
                    Thank you for registering! Your profile is currently under review by our admin team.
                    You will be notified once your account is approved.
                </Text>

                <Text style={styles.note}>
                    This usually takes 24-48 hours.
                </Text>

                <TouchableOpacity style={styles.button} onPress={handleContactSupport}>
                    <Text style={styles.buttonText}>Contact Support</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 20,
        padding: 20,
        backgroundColor: '#FFF4E5',
        borderRadius: 50,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: COLORS.gray,
        textAlign: 'center',
        marginBottom: 10,
        lineHeight: 22,
    },
    note: {
        fontSize: 14,
        color: COLORS.gray,
        textAlign: 'center',
        marginBottom: 30,
        fontStyle: 'italic'
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        width: '100%',
        marginBottom: 15,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    logoutButton: {
        paddingVertical: 12,
    },
    logoutText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default PendingApprovalScreen;
