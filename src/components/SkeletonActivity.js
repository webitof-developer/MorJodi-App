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

const SkeletonActivity = ({ count = 6 }) => {
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
            {/* Stats Row Skeleton */}
            <View style={styles.statsRow}>
                {[1, 2, 3, 4].map((_, i) => (
                    <View key={`stat-${i}`} style={styles.statsCard}>
                        <AnimatedLinearGradient
                            colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.statNumber, animatedStyle]}
                        />
                        <AnimatedLinearGradient
                            colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.statLabel, animatedStyle]}
                        />
                    </View>
                ))}
            </View>

            {/* Filters Skeleton */}
            <View style={styles.filterRow}>
                {[1, 2, 3].map((_, i) => (
                    <AnimatedLinearGradient
                        key={`filter-${i}`}
                        colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.filterChip, animatedStyle]}
                    />
                ))}
            </View>

            {/* List Skeleton */}
            <View style={styles.listContainer}>
                {Array.from({ length: count }).map((_, index) => (
                    <View key={index} style={styles.notificationCard}>
                        {/* Icon Skeleton */}
                        <AnimatedLinearGradient
                            colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.iconPlaceholder, animatedStyle]}
                        />
                        {/* Content Skeleton */}
                        <View style={styles.contentPlaceholder}>
                            <AnimatedLinearGradient
                                colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.textLine, { width: '80%', marginBottom: 8 }, animatedStyle]}
                            />
                            <AnimatedLinearGradient
                                colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.textLine, { width: '40%' }, animatedStyle]}
                            />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.padding,
        marginTop: SIZES.base * 2,
        marginBottom: SIZES.base,
        gap: 8,
    },
    statsCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        height: 70,
    },
    statNumber: {
        width: 20,
        height: 14,
        borderRadius: 4,
        marginBottom: 6,
        backgroundColor: COLORS.lightGray,
    },
    statLabel: {
        width: 40,
        height: 10,
        borderRadius: 4,
        backgroundColor: COLORS.lightGray,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: SIZES.padding,
        marginTop: SIZES.base,
        marginBottom: SIZES.base * 2,
        gap: 10,
    },
    filterChip: {
        width: 60,
        height: 28,
        borderRadius: 12,
        backgroundColor: COLORS.lightGray,
    },
    listContainer: {
        paddingTop: 10,
    },
    notificationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: 14,
        paddingHorizontal: SIZES.padding,
        marginHorizontal: SIZES.padding,
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    iconPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 14,
        backgroundColor: COLORS.lightGray,
    },
    contentPlaceholder: {
        flex: 1,
    },
    textLine: {
        height: 14,
        borderRadius: 4,
        backgroundColor: COLORS.lightGray,
    },
});

export default SkeletonActivity;
