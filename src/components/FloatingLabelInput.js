import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, Animated, StyleSheet, Easing } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';

const FloatingLabelInput = ({
    label,
    value,
    onChangeText,
    required = false,
    containerStyle,
    multiline = false,
    error,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    // Initial animation value: 1 if value exists, 0 otherwise
    const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: (isFocused || (value && value.length > 0)) ? 1 : 0,
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
            outputRange: [multiline ? 18 : 16, -10], // Move up to break border
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
            <Animated.Text style={labelStyle} numberOfLines={1} pointerEvents="none">
                {label}
                {required && <Text style={{ color: COLORS.primary }}> *</Text>}
            </Animated.Text>
            <TextInput
                style={[
                    styles.input,
                    isFocused && styles.focusedInput,
                    error && { borderColor: COLORS.primary },
                    multiline && styles.textArea
                ]}
                value={value}
                onChangeText={onChangeText}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder=""
                multiline={multiline}
                placeholderTextColor="transparent" // Ensure native placeholder doesn't show
                selectionColor={COLORS.primary}
                {...props}
            />
            {props.rightIcon}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        backgroundColor: COLORS.white,
        width: '100%',
    },
    input: {
        borderWidth: 1.5,
        borderColor: COLORS.gray,
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 14,
        fontSize: 16,
        color: COLORS.black,
        fontFamily: FONTS.body3.fontFamily,
        backgroundColor: 'transparent',
    },
    textArea: {
        textAlignVertical: 'top',
        height: 100,
    },
    focusedInput: {
        borderColor: COLORS.primary,
        borderWidth: 2,
    },
});

export default FloatingLabelInput;
