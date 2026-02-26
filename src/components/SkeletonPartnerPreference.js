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
import { COLORS, SIZES, FONTS } from '../constants/theme';

const { width } = Dimensions.get('window');
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const SkeletonPartnerPreference = () => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.4, { duration: 600 }),
                withTiming(0.8, { duration: 800 }),
                withTiming(0.4, { duration: 600 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const SkeletonBox = ({ width: boxWidth, height, borderRadius = 8, style }) => (
        <AnimatedLinearGradient
            colors={['#E8E8E8', '#F5F5F5', '#E8E8E8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[{ width: boxWidth, height, borderRadius }, animatedStyle, style]}
        />
    );

    const SectionHeader = () => (
        <View style={styles.sectionHeader}>
            <SkeletonBox width="60%" height={24} style={{ marginBottom: 15 }} />
            <View style={styles.separator} />
        </View>
    );

    const InputSkeleton = () => (
        <View style={styles.inputWrapper}>
            <SkeletonBox width="100%" height={55} />
        </View>
    );

    const PickerSkeleton = () => (
        <View style={styles.pickerWrapper}>
            <SkeletonBox width="100%" height={55} />
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Age Section */}
                <View style={styles.section}>
                    <SectionHeader />
                    <View style={styles.row}>
                        <View style={styles.half}>
                            <InputSkeleton />
                        </View>
                        <View style={styles.half}>
                            <InputSkeleton />
                        </View>
                    </View>
                </View>

                {/* Height Section */}
                <View style={styles.section}>
                    <SectionHeader />
                    <SkeletonBox width="50%" height={16} style={{ marginBottom: 15 }} />
                    <SkeletonBox width="100%" height={40} style={{ marginBottom: 20 }} />
                    <SkeletonBox width="50%" height={16} style={{ marginBottom: 15 }} />
                    <SkeletonBox width="100%" height={40} />
                </View>

                {/* Basic Preferences */}
                <View style={styles.section}>
                    <SectionHeader />
                    <PickerSkeleton />
                    <PickerSkeleton />
                    <PickerSkeleton />
                </View>

                {/* Background Preferences */}
                <View style={styles.section}>
                    <SectionHeader />
                    <PickerSkeleton />
                    <PickerSkeleton />
                    <PickerSkeleton />
                    <PickerSkeleton />
                    <PickerSkeleton />
                </View>

                {/* Save Button */}
                <SkeletonBox width="100%" height={55} style={{ marginTop: 10, borderRadius: 12 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 25,
    },
    sectionHeader: {
        marginBottom: 5,
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginBottom: 15,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    half: {
        width: '48%',
    },
    inputWrapper: {
        marginBottom: 10,
    },
    pickerWrapper: {
        marginVertical: 10,
    },
});

export default SkeletonPartnerPreference;
