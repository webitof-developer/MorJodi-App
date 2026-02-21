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

const SkeletonMatchCard = () => {
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
        <View style={styles.card}>
            {/* Image Placeholder */}
            <AnimatedLinearGradient
                colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.imagePlaceholder, animatedStyle]}
            />

            {/* Content Overlay Placeholder */}
            <View style={styles.overlay}>
                <AnimatedLinearGradient
                    colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.textLine, { width: '60%', height: 20, marginBottom: 10 }, animatedStyle]}
                />
                <AnimatedLinearGradient
                    colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.textLine, { width: '40%', height: 16, marginBottom: 8 }, animatedStyle]}
                />
                <AnimatedLinearGradient
                    colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.textLine, { width: '80%', height: 16, marginBottom: 15 }, animatedStyle]}
                />

                {/* Buttons Row */}
                <View style={styles.buttonRow}>
                    {[1, 2, 3, 4].map((_, i) => (
                        <AnimatedLinearGradient
                            key={i}
                            colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.circleButton, animatedStyle]}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
};

const SkeletonMatch = ({ count = 2 }) => {
    return (
        <View style={styles.container}>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonMatchCard key={index} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: SIZES.padding / 1.5,
    },
    card: {
        marginVertical: SIZES.base,
        height: 470,
        borderRadius: SIZES.radius,
        backgroundColor: COLORS.white,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SIZES.padding,
        backgroundColor: 'rgba(255,255,255,0.9)', // Slight overlay so text blocks are visible against gray bg
        borderBottomLeftRadius: SIZES.radius,
        borderBottomRightRadius: SIZES.radius,
    },
    textLine: {
        backgroundColor: COLORS.lightGray,
        borderRadius: 4,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    circleButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.lightGray,
    }
});

export default SkeletonMatch;
