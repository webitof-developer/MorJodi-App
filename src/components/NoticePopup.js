import React, { useContext } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { COLORS } from '../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LanguageContext } from '../contexts/LanguageContext';
import i18n from '../localization/i18n';

const { width } = Dimensions.get('window');

const NoticePopup = ({ visible, notice, onAction, onRemind }) => {
    const { language } = useContext(LanguageContext);
    const t = (key) => i18n.t(key, { lng: language, locale: language });

    if (!notice) return null;

    const { title, description, actionLabel, remindLabel, isForced } = notice;
    const defaultActionEn = 'Take Action';
    const defaultRemindEn = 'Remind Later';
    const resolvedActionLabel =
        actionLabel && actionLabel !== defaultActionEn
            ? actionLabel
            : t('noticePopup.takeAction');
    const resolvedRemindLabel =
        remindLabel && remindLabel !== defaultRemindEn
            ? remindLabel
            : t('noticePopup.remindLater');

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={isForced ? () => { } : onRemind}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>

                    {/* ── Top accent strip ── */}
                    <View style={styles.accentStrip} />

                    {/* ── Icon Badge ── */}
                    <View style={styles.iconBadge}>
                        <Icon name="bell-ring-outline" size={26} color={COLORS.primary} />
                    </View>

                    {/* ── Body ── */}
                    <View style={styles.body}>
                        <Text style={styles.tag}>{t('common.notice')}</Text>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.description}>{description}</Text>

                        {/* ── Action Button ── */}
                        <TouchableOpacity
                            style={styles.btnAction}
                            onPress={onAction}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.btnActionText}>
                                {resolvedActionLabel}
                            </Text>
                            <Icon name="arrow-right" size={16} color="#fff" style={{ marginLeft: 6 }} />
                        </TouchableOpacity>

                        {/* ── Remind Later ── */}
                        {!isForced && (
                            <TouchableOpacity
                                style={styles.btnRemind}
                                onPress={onRemind}
                                activeOpacity={0.6}
                            >
                                <Icon name="clock-time-four-outline" size={13} color={COLORS.primary} style={{ marginRight: 4 }} />
                                <Text style={styles.btnRemindText}>
                                    {resolvedRemindLabel}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    /* ── Backdrop ── */
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15,15,30,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },

    /* ── Card ── */
    card: {
        width: width - 56,
        backgroundColor: '#FAFBFF',
        borderRadius: 22,
        overflow: 'hidden',
        elevation: 18,
        shadowColor: '#4a4aff',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
    },

    /* Thin primary accent at top */
    accentStrip: {
        height: 4,
        backgroundColor: COLORS.primary,
        width: '100%',
    },

    /* ── Floating icon badge ── */
    iconBadge: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: COLORS.primary + '18', // light tint
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 24,
        borderWidth: 1.5,
        borderColor: COLORS.primary + '30',
    },

    /* ── Content ── */
    body: {
        paddingHorizontal: 22,
        paddingTop: 16,
        paddingBottom: 26,
        alignItems: 'center',
    },

    tag: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.primary,
        letterSpacing: 2,
        marginBottom: 8,
        opacity: 0.7,
    },

    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a2e',
        textAlign: 'center',
        letterSpacing: 0.2,
        marginBottom: 10,
    },

    description: {
        fontSize: 13.5,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 22,
    },

    /* ── Primary button ── */
    btnAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        width: '100%',
        paddingVertical: 13,
        borderRadius: 13,
        marginBottom: 10,
        elevation: 5,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
    },
    btnActionText: {
        color: '#fff',
        fontSize: 14.5,
        fontWeight: '700',
        letterSpacing: 0.4,
    },

    /* ── Ghost remind button ── */
    btnRemind: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 9,
        paddingHorizontal: 18,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
        backgroundColor: COLORS.primary + '08',
        width: '100%',
    },
    btnRemindText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: '500',
    },
});

export default NoticePopup;
