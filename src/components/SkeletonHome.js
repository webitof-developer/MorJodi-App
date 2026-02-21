import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';
import { COLORS, SIZES } from '../constants/theme';
import SkeletonCard from './SkeletonCard';

const { width } = Dimensions.get('window');

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const SkeletonHome = () => {
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
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            scrollEnabled={false}
        >
            {/* Banner Placeholder */}
            <View style={styles.bannerContainer}>
                <AnimatedLinearGradient
                    colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.bannerPlaceholder, animatedStyle]}
                />
            </View>

            {/* Premium Matches Section Placeholder */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <AnimatedLinearGradient
                        colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.titlePlaceholder, animatedStyle]}
                    />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardList}>
                    {[1, 2, 3].map((item) => (
                        <SkeletonCard key={`prem-${item}`} />
                    ))}
                </ScrollView>
            </View>

            {/* Nearby Matches Section Placeholder */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <AnimatedLinearGradient
                        colors={[COLORS.lightGray, '#E0E0E0', COLORS.lightGray]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.titlePlaceholder, animatedStyle]}
                    />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardList}>
                    {[1, 2, 3].map((item) => (
                        <SkeletonCard key={`near-${item}`} />
                    ))}
                </ScrollView>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    bannerContainer: {
        width: width,
        height: 200, // Approximate height of the banner
        marginBottom: 20,
        paddingHorizontal: 0,
    },
    bannerPlaceholder: {
        width: '100%',
        height: '100%',
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    titlePlaceholder: {
        width: 150,
        height: 20,
        borderRadius: 4,
        backgroundColor: COLORS.lightGray,
    },
    cardList: {
        paddingHorizontal: 10,
    },
});

export default SkeletonHome;
