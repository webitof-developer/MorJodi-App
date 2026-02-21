import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { COLORS, FONTS } from '../constants/theme';

const FloatingLabelDropdown = ({
    label,
    value,
    data,
    onChange,
    required = false,
    containerStyle,
    placeholder = "",
    search = false,
    labelField = "label",
    valueField = "value",
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: (isFocused || value) ? 1 : 0,
            duration: 200,
            easing: Easing.ease,
            useNativeDriver: false,
        }).start();
    }, [isFocused, value]);

    const labelStyle = {
        position: 'absolute',
        left: 12,
        top: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [16, -10],
        }),
        fontSize: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 12],
        }),
        color: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [COLORS.gray, COLORS.primary],
        }),
        backgroundColor: COLORS.white,
        paddingHorizontal: 4,
        zIndex: 1,
        fontFamily: FONTS.body3.fontFamily,
    };

    return (
        <View style={[styles.container, containerStyle]}>
            <Animated.Text style={labelStyle} pointerEvents="none">
                {label}
                {required && <Text style={{ color: COLORS.danger }}> *</Text>}
            </Animated.Text>
            <Dropdown
                style={[styles.dropdown, isFocused && styles.focusedDropdown]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={data}
                search={search}
                maxHeight={300}
                labelField={labelField}
                valueField={valueField}
                placeholder={""}
                searchPlaceholder="Search..."
                value={value}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={item => {
                    onChange(item[valueField]);
                    setIsFocused(false);
                }}
                {...props}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        backgroundColor: COLORS.white,
        width: '100%',
    },
    dropdown: {
        height: 55,
        borderColor: COLORS.gray,
        borderWidth: 1.5,
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: 'transparent',
    },
    focusedDropdown: {
        borderColor: COLORS.primary,
        borderWidth: 2,
    },
    placeholderStyle: {
        fontSize: 16,
        color: COLORS.gray,
    },
    selectedTextStyle: {
        fontSize: 16,
        color: COLORS.black,
        fontFamily: FONTS.body3.fontFamily,
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
        color: COLORS.black,
    },
});

export default FloatingLabelDropdown;
