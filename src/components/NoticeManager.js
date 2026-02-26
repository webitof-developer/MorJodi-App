import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyNotices, trackNoticeEvent } from '../services/noticeService';
import NoticePopup from './NoticePopup';
import { navigate } from '../navigation/navigationRef';

const NoticeManager = () => {
    const { token, user } = useSelector(state => state.auth);
    const [currentNotice, setCurrentNotice] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (token && user) {
            checkNotices();
        }
    }, [token, user]);

    const checkNotices = async () => {
        try {
            const notices = await getMyNotices(token);

            // Find the first notice that isn't Snoozed
            for (const notice of notices) {
                const snoozeKey = `notice_snooze_${notice._id}`;
                const snoozedUntil = await AsyncStorage.getItem(snoozeKey);

                if (snoozedUntil) {
                    const now = new Date().getTime();
                    if (now < parseInt(snoozedUntil)) {
                        continue; // Still snoozed
                    }
                }

                // If we pass checks, show this notice
                setCurrentNotice(notice);
                setIsVisible(true);

                // Track 'view' event
                // Only track view once? Or every time?
                // Let's track every time for now, or use local storage to track 'viewed' for analytics.
                trackNoticeEvent(notice._id, 'view', token);

                break; // Show only one notice at a time
            }
        } catch (error) {
            console.log("Error checking notices:", error);
        }
    };

    const handleAction = async () => {
        if (!currentNotice) return;

        // Track Click
        trackNoticeEvent(currentNotice._id, 'click', token);

        // Snooze it for a bit (e.g., 2 hours) or hide until next refresh?
        // If they click action, they are trying to do it. 
        // We shouldn't nag them immediately if they come back to home screen.
        // BUT if it's FORCED, we do NOT snooze, so it checks again on next launch.
        if (!currentNotice.isForced) {
            await snoozeNotice(currentNotice._id, 2 * 60 * 60 * 1000); // 2 hours
        }

        setIsVisible(false);
        setCurrentNotice(null);

        const normalizeParams = (value) => {
            if (!value) return {};
            if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    return parsed && typeof parsed === 'object' ? parsed : {};
                } catch {
                    return {};
                }
            }
            return typeof value === 'object' ? value : {};
        };

        const navigateToHomeTab = (tabName, tabParams = {}) => {
            navigate('App', {
                screen: 'HomeTabs',
                params: {
                    screen: tabName,
                    ...(Object.keys(tabParams).length > 0 ? { params: tabParams } : {}),
                },
            });
        };

        const navigateFromNotice = (screenName, rawParams) => {
            const params = normalizeParams(rawParams);
            const screen = String(screenName || '').trim();
            if (!screen) return;

            // Legacy names sent from admin panel.
            if (screen === 'Plans') {
                navigateToHomeTab('Upgrade');
                return;
            }
            if (screen === 'UploadDocuments') {
                navigate('EditProfile', params);
                return;
            }

            // Bottom tabs are nested under App -> HomeTabs.
            const bottomTabScreens = ['Home', 'Matches', 'Messenger', 'Activity', 'Upgrade'];
            if (bottomTabScreens.includes(screen)) {
                navigateToHomeTab(screen, params);
                return;
            }

            // Normal stack screen.
            navigate(screen, params);
        };

        try {
            navigateFromNotice(currentNotice?.actionLink?.screen, currentNotice?.actionLink?.params);
        } catch (e) {
            console.error("Navigation failed", e);
        }
    };

    const handleRemind = async () => {
        if (!currentNotice) return;

        // Track Remind
        trackNoticeEvent(currentNotice._id, 'remind', token);

        // Snooze for 2 hours
        await snoozeNotice(currentNotice._id, 2 * 60 * 60 * 1000);

        setIsVisible(false);
        setCurrentNotice(null);
    };

    const snoozeNotice = async (id, durationMs) => {
        try {
            const until = new Date().getTime() + durationMs;
            await AsyncStorage.setItem(`notice_snooze_${id}`, until.toString());
        } catch (e) {
            console.log("Failed to snooze notice", e);
        }
    };

    if (!currentNotice) return null;

    return (
        <NoticePopup
            visible={isVisible}
            notice={currentNotice}
            onAction={handleAction}
            onRemind={handleRemind}
        />
    );
};

export default NoticeManager;
