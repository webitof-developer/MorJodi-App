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

const { width } = Dimensions.get('window');

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const SkeletonCard = () => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.3, { duration: 500 }),
                withTiming(0.7, { duration: 800 }),
                withTiming(0.3, { duration: 500 })
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
            <AnimatedLinearGradient
                colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.imagePlaceholder, animatedStyle]}
            />
            <View style={styles.infoContainer}>
                <AnimatedLinearGradient
                    colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.textPlaceholder, { width: '80%', height: 18 }, animatedStyle]}
                />
                <AnimatedLinearGradient
                    colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.textPlaceholder, { width: '60%', height: 14, marginTop: 5 }, animatedStyle]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: 162,
        height: 230,
        borderRadius: SIZES.radius,
        backgroundColor: COLORS.white,
        marginRight: 15,
        overflow: 'hidden',
        elevation: 2,
        marginVertical: 10,
        borderColor: '#eee',
        borderWidth: 1,
    },
    imagePlaceholder: {
        width: '100%',
        height: '75%',
        backgroundColor: COLORS.lightGray,
    },
    infoContainer: {
        padding: 10,
        justifyContent: 'center',
    },
    textPlaceholder: {
        backgroundColor: COLORS.lightGray,
        borderRadius: 4,
    },
});

export default SkeletonCard;
