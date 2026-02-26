import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Modal, TouchableOpacity, Linking, StyleSheet, Image, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkVersion, getCurrentVersion, trackUpdateEvent } from '../services/versionService';
import { COLORS } from '../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import i18n from '../localization/i18n';
import { LanguageContext } from '../contexts/LanguageContext';

const POPUP_COOLDOWN = 2 * 60 * 60 * 1000; // 2 hours in ms
const LAST_POPUP_KEY = 'last_update_popup_time';

const UpdateManager = () => {
    const { language } = useContext(LanguageContext);
    const t = (key, opts) => i18n.t(key, { locale: language, lng: language, ...opts });
    const [visible, setVisible] = useState(false);
    const [updateData, setUpdateData] = useState(null);
    const { user } = useSelector(state => state.auth);

    const [lastCheckedVersion, setLastCheckedVersion] = useState(null);

    // Initial check and "Success Update" tracking
    useEffect(() => {
        const checkStartupConfig = async () => {
            try {
                const currentVersion = getCurrentVersion();
                const storedVersion = await AsyncStorage.getItem('installed_app_version');

                if (storedVersion && storedVersion !== currentVersion) {
                    // Detect if we just upgraded
                    // Semantic check: if current > stored
                    // For simplicity, equality check fails implies change. 
                    // Assuming versions always go up.

                    // Trigger "Success" event
                    // We need the 'latestVersion' context to log it correctly.
                    // Ideally we track against the version we are NOW running.
                    trackUpdateEvent('app_updated_successfully', currentVersion, user?._id);
                    console.log(`App updated from ${storedVersion} to ${currentVersion}`);
                }

                // Update stored version to current
                if (storedVersion !== currentVersion) {
                    await AsyncStorage.setItem('installed_app_version', currentVersion);
                }

                performCheck();
            } catch (error) {
                console.error("Startup check failed", error);
            }
        };

        checkStartupConfig();

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                performCheck();
            }
        });

        return () => subscription.remove();
    }, [user]); // Add user dependency to ensure ID is sent

    const performCheck = async () => {
        try {
            const data = await checkVersion();

            if (data?.updateAvailable && data?.updateData) {
                const { isForceUpdate, version } = data.updateData;

                // Check cooldown if not forced
                if (!isForceUpdate) {
                    const lastTimeStr = await AsyncStorage.getItem(LAST_POPUP_KEY);
                    if (lastTimeStr) {
                        const lastTime = parseInt(lastTimeStr, 10);
                        const now = Date.now();
                        if (now - lastTime < POPUP_COOLDOWN) {
                            console.log("Update popup in cooldown");
                            return;
                        }
                    }
                }

                setUpdateData(data.updateData);
                setVisible(true);
                trackUpdateEvent('popup_shown', version, user?._id);
            } else {
                setVisible(false);
            }
        } catch (error) {
            console.error("Update check failed", error);
        }
    };

    const handleUpdateNow = async () => {
        if (!updateData) return;

        const { playStoreUrl, version } = updateData;
        trackUpdateEvent('update_now', version, user?._id);

        try {
            // Try to open via market:// scheme first for Android to ensure Play Store app opens
            const marketUrl = playStoreUrl.replace("https://play.google.com/store/apps", "market");
            const canOpenMarket = await Linking.canOpenURL(marketUrl);

            if (canOpenMarket) {
                await Linking.openURL(marketUrl);
            } else {
                // Fallback to standard web URL
                await Linking.openURL(playStoreUrl);
            }
        } catch (err) {
            console.error("Cannot open URL", err);
            // Last ditch effort
            Linking.openURL(playStoreUrl).catch(e => console.error("Final fallback failed", e));
        }
    };

    const handleUpdateLater = async () => {
        if (!updateData) return;

        trackUpdateEvent('update_later', updateData.version, user?._id);
        await AsyncStorage.setItem(LAST_POPUP_KEY, Date.now().toString());
        setVisible(false);
    };

    if (!visible || !updateData) return null;

    const { version, title, changelog, isForceUpdate } = updateData;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={() => {
                // Prevent hardware back button if force update
                if (!isForceUpdate) {
                    handleUpdateLater();
                }
            }}
        >
            <View style={styles.overlay}>
                <View style={styles.popup}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Icon name="rocket-launch" size={40} color={COLORS.white} />
                        </View>
                        <Text style={styles.title}>{t('updateManager.title')}</Text>
                        <Text style={styles.subTitle}>v{version}</Text>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.releaseTitle}>{title}</Text>

                        <View style={styles.notesContainer}>
                            <Text style={styles.notesHeader}>{t('updateManager.whatsNew')}</Text>
                            <Text style={styles.notesText}>{changelog}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.updateBtn}
                            onPress={handleUpdateNow}
                        >
                            <Text style={styles.updateBtnText}>{t('updateManager.updateNow')}</Text>
                        </TouchableOpacity>

                        {!isForceUpdate && (
                            <TouchableOpacity
                                style={styles.laterBtn}
                                onPress={handleUpdateLater}
                            >
                                <Text style={styles.laterBtnText}>{t('updateManager.updateLater')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20
    },
    popup: {
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 5
    },
    header: {
        backgroundColor: COLORS.primary,
        padding: 20,
        alignItems: 'center'
    },
    iconContainer: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 15,
        borderRadius: 50,
        marginBottom: 10
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white'
    },
    subTitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)'
    },
    content: {
        padding: 20
    },
    releaseTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center'
    },
    notesContainer: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        maxHeight: 150
    },
    notesHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 5
    },
    notesText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20
    },
    updateBtn: {
        backgroundColor: COLORS.primary,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10
    },
    updateBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    },
    laterBtn: {
        padding: 15,
        alignItems: 'center'
    },
    laterBtnText: {
        color: '#888',
        fontSize: 15
    }
});

export default UpdateManager;
