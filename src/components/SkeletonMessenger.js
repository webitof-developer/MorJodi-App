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

const SkeletonChatCard = () => {
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
            {/* Avatar Placeholder */}
            <AnimatedLinearGradient
                colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.avatar, animatedStyle]}
            />

            {/* Content Placeholder */}
            <View style={styles.content}>
                <View style={styles.topRow}>
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
                        style={[styles.time, animatedStyle]}
                    />
                </View>

                <AnimatedLinearGradient
                    colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.message, animatedStyle]}
                />
            </View>
        </View>
    );
};

const SkeletonMessenger = ({ count = 6 }) => {
    return (
        <View style={styles.container}>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonChatCard key={index} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingTop: 6,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0'
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        marginRight: 12,
        backgroundColor: COLORS.lightGray,
    },
    content: {
        flex: 1,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    name: {
        width: '50%',
        height: 16,
        borderRadius: 4,
        backgroundColor: COLORS.lightGray,
    },
    time: {
        width: '15%',
        height: 12,
        borderRadius: 4,
        backgroundColor: COLORS.lightGray,
    },
    message: {
        width: '80%',
        height: 14,
        borderRadius: 4,
        backgroundColor: COLORS.lightGray,
    }
});

export default SkeletonMessenger;
