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

const SkeletonEditProfile = () => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 800 }),
                withTiming(1, { duration: 800 }),
                withTiming(0.7, { duration: 800 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const SkeletonBox = ({ width: boxWidth, height, style }) => (
        <AnimatedLinearGradient
            colors={['#E8E8E8', '#F5F5F5', '#E8E8E8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[{ width: boxWidth, height, borderRadius: 8 }, animatedStyle, style]}
        />
    );

    return (
        <View style={styles.container}>
            {/* Section Title */}
            <SkeletonBox width="40%" height={20} style={{ marginBottom: 5 }} />
            <SkeletonBox width="60%" height={12} style={{ marginBottom: 15 }} />

            {/* Photo Grid (6 boxes) */}
            <View style={styles.photoGrid}>
                {[...Array(6)].map((_, i) => (
                    <SkeletonBox
                        key={i}
                        width="31%"
                        height={(width * 0.31) * 0.92}
                        style={{ marginBottom: 10 }}
                    />
                ))}
            </View>

            {/* Section Header */}
            <SkeletonBox width="30%" height={18} style={{ marginTop: 25, marginBottom: 15 }} />

            {/* Form Fields (8 rows) */}
            {[...Array(8)].map((_, index) => (
                <View key={index} style={styles.fieldWrapper}>
                    <SkeletonBox width="25%" height={12} style={{ marginBottom: 8 }} />
                    <SkeletonBox width="100%" height={50} />
                </View>
            ))}

            {/* ID Verification Section */}
            <SkeletonBox width="35%" height={18} style={{ marginTop: 25, marginBottom: 8 }} />
            <View style={styles.idRow}>
                <SkeletonBox width="48%" height={100} />
                <SkeletonBox width="48%" height={100} />
            </View>

            {/* Save Button */}
            <SkeletonBox width="100%" height={50} style={{ marginTop: 30, borderRadius: SIZES.radius }} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: SIZES.padding,
        paddingBottom: 50,
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    fieldWrapper: {
        marginBottom: 20,
    },
    idRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
});

export default SkeletonEditProfile;
