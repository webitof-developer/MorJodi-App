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
import { COLORS, SIZES } from '../constants/theme';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const { width } = Dimensions.get('window');

const SkeletonUpgrade = () => {
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

    return (
        <View style={styles.container}>
            {/* Header Help Btn Placeholder */}
            <View style={{ alignItems: 'flex-end', marginBottom: 20 }}>
                <AnimatedLinearGradient
                    colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.helpBtn, animatedStyle]}
                />
            </View>

            {/* Duration Row */}
            <AnimatedLinearGradient
                colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.sectionTitle, animatedStyle]}
            />
            <View style={styles.durationRow}>
                {[1, 2, 3].map((_, i) => (
                    <AnimatedLinearGradient
                        key={i}
                        colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.durationBox, animatedStyle]}
                    />
                ))}
            </View>

            {/* Billing Summary Skeleton */}
            <View style={styles.card}>
                <AnimatedLinearGradient
                    colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.textLine, { width: '40%', marginBottom: 15 }, animatedStyle]}
                />
                <AnimatedLinearGradient
                    colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.textLine, { width: '90%', marginBottom: 10 }, animatedStyle]}
                />
                <AnimatedLinearGradient
                    colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.textLine, { width: '90%', marginBottom: 10 }, animatedStyle]}
                />
                <AnimatedLinearGradient
                    colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.textLine, { width: '100%', height: 40, marginTop: 10 }, animatedStyle]}
                />
            </View>

            {/* Coupon Skeleton */}
            <View style={styles.card}>
                <AnimatedLinearGradient
                    colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.textLine, { width: '30%', marginBottom: 10 }, animatedStyle]}
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <AnimatedLinearGradient
                        colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.inputPlaceholder, animatedStyle]}
                    />
                    <AnimatedLinearGradient
                        colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.btnPlaceholder, animatedStyle]}
                    />
                </View>
            </View>

            {/* Features List Skeleton */}
            <View style={{ marginTop: 20 }}>
                <AnimatedLinearGradient
                    colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.sectionTitle, animatedStyle]}
                />
                <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <View style={{ flex: 1, gap: 15 }}>
                        {[1, 2, 3, 4, 5].map((_, i) => (
                            <AnimatedLinearGradient
                                key={i}
                                colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.textLine, { width: '80%' }, animatedStyle]}
                            />
                        ))}
                    </View>
                    <View style={{ width: 100, gap: 15 }}>
                        {[1, 2, 3, 4, 5].map((_, i) => (
                            <AnimatedLinearGradient
                                key={i}
                                colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.textLine, { width: '100%' }, animatedStyle]}
                            />
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: SIZES.padding,
        backgroundColor: '#f8f8f8', // Matching upgrade screen bg usually
    },
    helpBtn: {
        width: 80,
        height: 20,
        borderRadius: 4,
        backgroundColor: COLORS.lightGray,
    },
    sectionTitle: {
        width: 150,
        height: 20,
        borderRadius: 4,
        marginBottom: 10,
        backgroundColor: COLORS.lightGray,
    },
    durationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 10,
    },
    durationBox: {
        flex: 1,
        height: 80,
        borderRadius: 8,
        backgroundColor: COLORS.lightGray,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#eee',
    },
    textLine: {
        height: 14,
        borderRadius: 4,
        backgroundColor: COLORS.lightGray,
    },
    inputPlaceholder: {
        flex: 1,
        height: 45,
        borderRadius: 8,
        backgroundColor: COLORS.lightGray,
    },
    btnPlaceholder: {
        width: 80,
        height: 45,
        borderRadius: 8,
        backgroundColor: COLORS.lightGray,
    }
});

export default SkeletonUpgrade;
