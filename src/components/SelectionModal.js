import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    TextInput,
    Dimensions,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES } from '../constants/theme';

const { height } = Dimensions.get('window');

const SelectionModal = ({
    visible,
    onClose,
    title,
    options = [],
    onSelect,
    selectedValue,
    searchable = false,
    onRequestAdd,
    multiSelect = false
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);

    useEffect(() => {
        if (searchable) {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const filtered = options.filter(item =>
                    item.name && item.name.toLowerCase().includes(query)
                );
                setFilteredOptions(filtered);
            } else {
                setFilteredOptions(options);
            }
        } else {
            setFilteredOptions(options);
        }
    }, [searchQuery, options, searchable]);

    // Reset search when modal opens
    useEffect(() => {
        if (visible) {
            setSearchQuery('');
        }
    }, [visible]);

    // Helper to handle both object and string arrays if needed, currently RegisterScreen sends objects
    const isString = options.length > 0 && typeof options[0] === 'string';

    const handleSelect = (item) => {
        const value = isString ? item : (item.value || item._id);

        if (multiSelect) {
            // Ensure selectedValue is an array
            const currentSelected = Array.isArray(selectedValue) ? selectedValue : [];
            const exists = currentSelected.includes(value);

            let newSelection;
            if (exists) {
                newSelection = currentSelected.filter(v => v !== value);
            } else {
                newSelection = [...currentSelected, value];
            }
            onSelect(newSelection);
        } else {
            onSelect(value);
            onClose();
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={styles.modalContainer}>
                    <View style={styles.dragHandle} />

                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {onRequestAdd && (
                                <TouchableOpacity
                                    onPress={() => {
                                        onRequestAdd();
                                        onClose();
                                    }}
                                    style={{
                                        marginRight: 10,
                                        backgroundColor: COLORS.primary + '20', // Light primary
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        borderRadius: 20,
                                    }}
                                >
                                    <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '600' }}>
                                        + Request New
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Icon name="close" size={24} color={COLORS.gray} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {searchable && (
                        <View style={styles.searchContainer}>
                            <Icon name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search..."
                                placeholderTextColor={COLORS.gray}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                    )}

                    <FlatList
                        data={filteredOptions}
                        keyExtractor={(item, index) => (item.value || item._id || item).toString()}
                        renderItem={({ item }) => {
                            const value = isString ? item : (item.value || item._id);
                            const isSelected = multiSelect
                                ? (Array.isArray(selectedValue) && selectedValue.includes(value))
                                : selectedValue === value;

                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.optionItem,
                                        isSelected && styles.selectedOptionItem,
                                    ]}
                                    onPress={() => handleSelect(item)}
                                >
                                    <View style={{ flex: 1, paddingRight: 10 }}>
                                        <Text
                                            style={[
                                                styles.optionText,
                                                isSelected && styles.selectedOptionText,
                                            ]}
                                        >
                                            {isString ? item : item.name}
                                        </Text>
                                    </View>

                                    {/* Icon: Checkbox for Multi, Radio for Single */}
                                    {multiSelect ? (
                                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                            {isSelected && <Icon name="checkmark" size={14} color={COLORS.white} />}
                                        </View>
                                    ) : (
                                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                                            {isSelected && <Icon name="checkmark" size={14} color={COLORS.white} />}
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={() => (
                            <View style={{ alignItems: 'center', marginTop: 20 }}>
                                <Text style={{ color: COLORS.gray }}>No options available</Text>
                            </View>
                        )}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)', // Darker backdrop for better focus
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 30, // More rounded
        borderTopRightRadius: 30,
        maxHeight: height * 0.8,
        minHeight: height * 0.4,
        paddingHorizontal: SIZES.padding,
        paddingBottom: 30,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -5,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#E0E0E0',
        borderRadius: 10,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: '400',
        color: COLORS.black,
        fontFamily: FONTS.h3.fontFamily,
    },
    closeButton: {
        padding: 5,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 20,
        height: 50,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.black,
        height: '100%',
    },
    listContent: {
        paddingBottom: 20,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginTop: 5,
        marginBottom: 5,
        //    backgroundColor:'rgba(246, 245, 245, 0.46)',
    },
    selectedOptionItem: {
        backgroundColor: 'rgba(181, 7, 42, 0.04)',
    },
    optionText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '400',
    },
    selectedOptionText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    separator: {
        height: 1,
        backgroundColor: '#F5F5F5',
    },
    radioCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
        borderWidth: 0,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
        borderWidth: 0,
    },
    doneButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    doneButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default SelectionModal;
