import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Dimensions,
    Alert
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import Icon from 'react-native-vector-icons/Ionicons';

// We could reuse CustomPicker but it might cause circular dependencies or complexity.
// Let's make a simple dropdown for Type.

const { height } = Dimensions.get('window');

const DataRequestModal = ({ visible, onClose, onSubmit, initialType = 'caste' }) => {
    const [name, setName] = useState('');

    const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

    const displayType = capitalize(initialType);

    useEffect(() => {
        if (visible) {
            setName('');
        }
    }, [visible]);

    const handleSubmit = () => {
        if (!name.trim()) {
            Alert.alert("Required", "Please enter the name.");
            return;
        }
        onSubmit(initialType, name);
        onClose();
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Request New {displayType}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Icon name="close" size={24} color={COLORS.gray} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {/* Type Display (Read Only) */}
                        <Text style={styles.label}>Type</Text>
                        <View style={styles.disabledInput}>
                            <Text style={{ color: COLORS.darkGray, textTransform: 'capitalize' }}>
                                {displayType}
                            </Text>
                            <Icon name="lock-closed-outline" size={16} color={COLORS.gray} />
                        </View>

                        {/* Name Input */}
                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder={`Enter name (e.g. My ${displayType})`}
                            placeholderTextColor={COLORS.gray}
                        />

                        {/* Note about Parent */}
                        <Text style={styles.note}>
                            Note: The request will be linked to your currently selected Religion/Caste/Subcaste in the form.
                        </Text>

                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <Text style={styles.submitButtonText}>Submit Request</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        elevation: 10
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.black,
        fontFamily: FONTS.h3.fontFamily
    },
    content: {

    },
    label: {
        fontSize: 14,
        color: COLORS.gray,
        marginBottom: 5,
        marginTop: 10
    },
    disabledInput: {
        borderWidth: 1,
        borderColor: '#eee',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    dropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: COLORS.black
    },
    note: {
        fontSize: 12,
        color: COLORS.gray,
        fontStyle: 'italic',
        marginTop: 10,
        marginBottom: 20
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center'
    },
    submitButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16
    },
    closeButton: {
        padding: 5
    }
});

export default DataRequestModal;
