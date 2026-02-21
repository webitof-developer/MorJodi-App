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

const SkeletonList = ({ count = 8 }) => {
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
            {Array.from({ length: count }).map((_, index) => (
                <View key={index} style={styles.card}>
                    {/* Avatar Skeleton */}
                    <AnimatedLinearGradient
                        colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.avatar, animatedStyle]}
                    />

                    {/* Content Skeleton */}
                    <View style={styles.infoContainer}>
                        <AnimatedLinearGradient
                            colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.name, animatedStyle]}
                        />
                        <AnimatedLinearGradient
                            colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.details, animatedStyle]}
                        />
                        <AnimatedLinearGradient
                            colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.subDetails, animatedStyle]}
                        />
                    </View>

                    {/* Action Button Skeleton */}
                    <AnimatedLinearGradient
                        colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.actionButton, animatedStyle]}
                    />
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingVertical: 10,
    },
    card: {
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
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 14,
        backgroundColor: COLORS.lightGray,
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        width: '50%',
        height: 14,
        marginBottom: 6,
        borderRadius: 4,
        backgroundColor: COLORS.lightGray,
    },
    details: {
        width: '80%',
        height: 10,
        marginBottom: 4,
        borderRadius: 4,
        backgroundColor: COLORS.lightGray,
    },
    subDetails: {
        width: '60%',
        height: 10,
        borderRadius: 4,
        backgroundColor: COLORS.lightGray,
    },
    actionButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginLeft: 10,
        backgroundColor: COLORS.lightGray,
    },
});

export default SkeletonList;
