import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const NoticePopup = ({ visible, notice, onAction, onRemind }) => {
    if (!notice) return null;

    const { title, description, actionLabel, remindLabel, isForced } = notice;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={isForced ? () => { } : onRemind} // If forced, disable back dismissal
        >
            <View style={styles.overlay}>
                <View style={styles.popup}>
                    {/* Header with Icon */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Icon name="bell-ring-outline" size={32} color={COLORS.white} />
                        </View>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.description}>{description}</Text>

                        {/* Action Button */}
                        <TouchableOpacity style={styles.btnAction} onPress={onAction}>
                            <Text style={styles.btnActionText}>{actionLabel || "Take Action"}</Text>
                        </TouchableOpacity>

                        {/* Remind Later - Only if NOT forced */}
                        {!isForced && (
                            <TouchableOpacity style={styles.btnRemind} onPress={onRemind}>
                                <Text style={styles.btnRemindText}>{remindLabel || "Remind Me Later"}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)', // Semi-transparent black
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    popup: {
        width: width - 40,
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
    header: {
        backgroundColor: COLORS.primary,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25 // Make space for the icon which overlaps
    },
    iconContainer: {
        width: 60,
        height: 60,
        backgroundColor: COLORS.primary,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: -30, // Half overlap
        borderWidth: 4,
        borderColor: 'white'
    },
    content: {
        paddingHorizontal: 25,
        paddingBottom: 25,
        alignItems: 'center'
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 10
    },
    description: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25
    },
    btnAction: {
        backgroundColor: COLORS.primary,
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12
    },
    btnActionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    },
    btnRemind: {
        paddingVertical: 10,
        width: '100%',
        alignItems: 'center'
    },
    btnRemindText: {
        color: '#999',
        fontSize: 15,
        fontWeight: '500'
    }
});

export default NoticePopup;
