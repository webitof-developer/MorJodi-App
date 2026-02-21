import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';
import { COLORS } from '../constants/theme';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const { width } = Dimensions.get('window');

const SkeletonForm = ({ rows = 6 }) => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.5, { duration: 600 }),
                withTiming(1, { duration: 600 }),
                withTiming(0.5, { duration: 600 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    // Create an array of size `rows` to map over
    const rowItems = Array.from({ length: rows });

    return (
        <View style={styles.container}>
            {rowItems.map((_, index) => (
                <View key={index} style={styles.inputWrapper}>
                    {/* Label Placeholder */}
                    <AnimatedLinearGradient
                        colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.labelPlaceholder, animatedStyle]}
                    />
                    {/* Input Box Placeholder */}
                    <AnimatedLinearGradient
                        colors={[COLORS.lightGray, '#F5F5F5', COLORS.lightGray]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.inputPlaceholder, animatedStyle]}
                    />
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingVertical: 10,
    },
    inputWrapper: {
        marginBottom: 20,
    },
    labelPlaceholder: {
        width: '30%',
        height: 14,
        borderRadius: 4,
        marginBottom: 8,
        backgroundColor: COLORS.lightGray,
    },
    inputPlaceholder: {
        width: '100%',
        height: 50,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
    },
});

export default SkeletonForm;
