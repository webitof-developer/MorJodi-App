/**
 * useProfileActions — Unified hook for profile interaction logic.
 *
 * Centralises all shared logic that was previously duplicated across:
 *   • MatchCard.js
 *   • HomeProfileCard.js
 *   • ProfileDetailScreen.js
 *
 * Usage:
 *   const {
 *     openProfile,
 *     handleImagePress,
 *     handleInterestPress,
 *     handleContactInfoPress,
 *     handleCreateChat,
 *     interestStatus,           // { type, status, interestId }
 *     isInterestSent,
 *     isInterestReceived,
 *     isInterestAccepted,
 *     isUnlocked,
 *     contactData,
 *     contactLoading,
 *     contactModalVisible,
 *     setContactModalVisible,
 *     subscriptionModalVisible,
 *     subscriptionModalMessage,
 *     setSubscriptionModalVisible,
 *     handleSubscriptionUpgrade,
 *   } = useProfileActions(item);
 */

import { useState, useEffect, useContext, useRef } from 'react';
import { Alert, Share } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { useInterest } from './InterestContext';
import { useLike } from './LikeContext';
import { LanguageContext } from './LanguageContext';
import i18n from '../localization/i18n';

export const useProfileActions = (item) => {
    const navigation = useNavigation();
    const { token } = useSelector((state) => state.auth);
    const { subscription } = useSelector((state) => state.subscription);
    const { language } = useContext(LanguageContext);

    // ── Interest context ──────────────────────────────────────────
    const {
        sentInterests,
        receivedInterests,
        getInterestStatus,
        hasAcceptedInterest,
        sendInterest,
        acceptInterest,
        unsendInterest,
        removeAcceptedInterest,
    } = useInterest();

    // ── Like context ──────────────────────────────────────────────
    const { isLiked, likeProfile, unlikeProfile } = useLike();

    // ── Subscription / plan helpers ───────────────────────────────
    const isSubscribed = subscription?.status === 'active';
    const activePlan = subscription?.subscription?.plan;
    const planName = activePlan?.name?.toLowerCase?.();
    const planIsFree =
        activePlan?.isFree ??
        (typeof activePlan?.price === 'number' && activePlan.price === 0) ??
        (planName ? planName.includes('free') : false);
    const isPaidActive =
        subscription?.status === 'active' &&
        ((activePlan && (planIsFree === false || planIsFree === undefined)) ||
            !activePlan);

    // ── Local reactive interest state ──────────────────────────────
    const [interestStatus, setInterestStatus] = useState(
        getInterestStatus(item?._id),
    );

    useEffect(() => {
        if (item?._id) {
            setInterestStatus(getInterestStatus(item._id));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sentInterests, receivedInterests, item?._id]);

    // Convenience booleans
    const isInterestSent =
        interestStatus.type === 'sent' && interestStatus.status === 'pending';
    const isInterestReceived =
        interestStatus.type === 'received' && interestStatus.status === 'pending';
    const isInterestAccepted = interestStatus.status === 'accepted';
    const isUnlocked = hasAcceptedInterest(item?._id);

    // ── Subscription modal state ───────────────────────────────────
    const [subscriptionModalVisible, setSubscriptionModalVisible] =
        useState(false);
    const [subscriptionModalMessage, setSubscriptionModalMessage] = useState('');
    const profileOpenInFlightRef = useRef(false);

    const showSubscriptionModal = (message, force = false) => {
        if (isPaidActive && !force) return;
        setSubscriptionModalMessage(message);
        setSubscriptionModalVisible(true);
    };

    const handleSubscriptionUpgrade = () => {
        setSubscriptionModalVisible(false);
        navigation.navigate('HomeTabs', { screen: 'Upgrade' });
    };

    // ── Contact state (used mainly in ProfileDetailScreen) ─────────
    const [contactData, setContactData] = useState(null);
    const [contactLoading, setContactLoading] = useState(false);
    const [contactModalVisible, setContactModalVisible] = useState(false);

    // ── Interest alert state (custom modal, replaces native Alert) ─
    /**
     * Consumers must render:
     *   <AwesomeAlert
     *     show={interestAlertState.show}
     *     title={interestAlertState.title}
     *     message={interestAlertState.message}
     *     confirmText={interestAlertState.confirmText}
     *     cancelText={interestAlertState.cancelText}
     *     showCancelButton showConfirmButton
     *     confirmButtonColor={COLORS.primary}
     *     onConfirmPressed={interestAlertState.onConfirm}
     *     onCancelPressed={dismissInterestAlert}
     *     closeOnTouchOutside closeOnHardwareBackPress={false}
     *   />
     */
    const [interestAlertState, setInterestAlertState] = useState({
        show: false,
        title: '',
        message: '',
        confirmText: '',
        cancelText: '',
        onConfirm: () => { },
    });

    const dismissInterestAlert = () =>
        setInterestAlertState(prev => ({ ...prev, show: false }));

    const showInterestAlert = ({ title, message, confirmText, cancelText, onConfirm }) =>
        setInterestAlertState({ show: true, title, message, confirmText, cancelText, onConfirm });

    // ── Handlers ───────────────────────────────────────────────────

    /**
     * Open a profile detail screen.
     * Calls the view-count API first; handles PRIVATE_PROFILE / LIMIT_REACHED.
     */
    const openProfile = async () => {
        if (!item?._id || !token) return;
        if (profileOpenInFlightRef.current) return;

        profileOpenInFlightRef.current = true;
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/user/view/${item._id}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } },
            );

            if (response.data.success) {
                navigation.navigate('ProfileDetailScreen', {
                    profileId: item._id,
                    item,
                });
            }
        } catch (error) {
            const res = error.response;

            if (res?.data?.code === 'PRIVATE_PROFILE') {
                showSubscriptionModal(

                    i18n.t('profile.private', {
                        name: item?.fullName || 'this profile',
                        lng: language,
                    }),
                    true,
                );
                return;
            }

            if (res?.data?.code === 'LIMIT_REACHED') {
                showSubscriptionModal(

                    i18n.t('profile.limitReached', { lng: language }) ||
                    'You\u2019ve reached your daily profile view limit. Upgrade to continue exploring more matches.',
                    true,
                );
                return;
            }

            if (res?.data?.message) {
                Alert.alert('Notice', res.data.message);
            } else {
                Alert.alert('Notice', 'Unable to open profile. Please try again.');
            }
        } finally {
            profileOpenInFlightRef.current = false;
        }
    };

    /**
     * View profile photos.
     * Calls the photos API (handles privacy / limit codes) then opens PhotoPreview.
     */
    const handleImagePress = async (photos = [], index = 0) => {
        if (!item?._id || !token) return;
        try {
            const res = await axios.get(
                `${API_BASE_URL}/api/user/profile/${item._id}/photos`,
                { headers: { Authorization: `Bearer ${token}` } },
            );

            if (res.data?.success) {
                const imageList = res.data.photos?.length ? res.data.photos : photos;
                navigation.navigate('PhotoPreview', {
                    photos: imageList,
                    startIndex: index,
                });
            }
        } catch (error) {
            const res = error.response;

            if (res?.data?.code === 'PRIVATE_PHOTOS') {
                if (!isPaidActive) {
                    showSubscriptionModal(
                        i18n.t('subscriptionModel.subscription_default', {
                            name:
                                i18n.t('register.labels.profilePhotos', { lng: language }) ||
                                'profile photos',
                            lng: language,
                        }),
                    );
                } else {
                    Alert.alert(
                        i18n.t('common.notice', { lng: language }) || 'Notice',
                        `${i18n.t('register.labels.profilePhotos', { lng: language }) ||
                        'Profile photos'
                        } ${i18n.t('private_profile', { lng: language }) || 'are private'
                        }`,
                    );
                }
                return;
            }

            if (res?.data?.code === 'LIMIT_REACHED') {
                showSubscriptionModal(
                    i18n.t('profile.photoLimitReached', { lng: language }) ||
                    'You have reached your daily photo view limit. Upgrade your plan to continue viewing photos.',
                    true,
                );
                return;
            }

            if (res?.data?.code === 'FEATURE_NOT_AVAILABLE') {
                showSubscriptionModal(
                    i18n.t('profile.photoFeatureNotAvailable', { lng: language }) ||
                    'This feature is not available on your current plan.',
                    true,
                );
                return;
            }

            if (res?.status === 403) {
                if (!isPaidActive) {
                    showSubscriptionModal(
                        i18n.t('subscriptionModel.subscription_default', {
                            name: item?.fullName || 'profile',
                            lng: language,
                        }),
                    );
                } else {
                    Alert.alert(
                        i18n.t('common.error', { lng: language }) || 'Error',
                        'Unable to load photos.',
                    );
                }
                return;
            }

            Alert.alert('Error', 'Unable to load photos.');
        }
    };

    /**
     * Interest press — handles all states:
     * none → send, sent+pending → unsend, received+pending → accept, accepted → remove.
     * Confirmation dialogs use interestAlertState (custom AwesomeAlert), not native Alert.
     */
    const handleInterestPress = async () => {
        const { type, status: st, interestId } = interestStatus;

        if (type === 'none') {
            const result = await sendInterest(item._id);

            if (result?.subscriptionRequired) {
                const isInterestLimitReached =
                    typeof result?.message === 'string' &&
                    result.message.toLowerCase().includes('interest limit');

                // Prefer backend message; fall back to i18n translation
                const msg = isInterestLimitReached
                    ? (i18n.t('interest.alerts.limitReached', { lng: language }))
                    : (i18n.t('profile.limitReached', { lng: language }));

                showSubscriptionModal(msg, true);
            }
            return;
        }

        if (type === 'sent' && st === 'pending') {
            showInterestAlert({
                title: i18n.t('interest.alerts.unsendTitle', { lng: language }),
                message: i18n.t('interest.alerts.unsendMsg', { lng: language }),
                confirmText: i18n.t('interest.actions.unsend', { lng: language }),
                cancelText: i18n.t('interest.actions.cancel', { lng: language }),
                onConfirm: () => {
                    unsendInterest(interestId);
                    dismissInterestAlert();
                },
            });
            return;
        }

        if (type === 'received' && st === 'pending') {
            showInterestAlert({
                title: i18n.t('interest.actions.accept', { lng: language }),
                message: i18n.t('interest.alerts.acceptConfirm', { lng: language }),
                confirmText: i18n.t('interest.actions.accept', { lng: language }),
                cancelText: i18n.t('interest.actions.cancel', { lng: language }),
                onConfirm: () => {
                    acceptInterest(interestId);
                    dismissInterestAlert();
                },
            });
            return;
        }

        if (st === 'accepted') {
            showInterestAlert({
                title: i18n.t('interest.alerts.removeTitle', { lng: language }),
                message: i18n.t('interest.alerts.removeMsg', { lng: language }),
                confirmText: i18n.t('interest.actions.remove', { lng: language }),
                cancelText: i18n.t('interest.actions.cancel', { lng: language }),
                onConfirm: () => {
                    removeAcceptedInterest(interestId);
                    dismissInterestAlert();
                },
            });
        }
    };

    /**
     * Fetch and reveal contact details.
     * Handles privacy / limit codes and updates contactData / contactModalVisible.
     */
    const handleContactInfoPress = async () => {
        if (!item?._id || !token) return;
        try {
            setContactLoading(true);
            const { data } = await axios.get(
                `${API_BASE_URL}/api/user/profile/${item._id}/contact`,
                { headers: { Authorization: `Bearer ${token}` } },
            );

            const deniedByPayload =
                data?.success === false ||
                data?.code === 'PRIVATE_PROFILE' ||
                data?.code === 'LIMIT_REACHED' ||
                data?.code === 'FEATURE_NOT_AVAILABLE';

            if (deniedByPayload) {
                if (data?.code === 'PRIVATE_PROFILE') {
                    if (!isPaidActive) {
                        showSubscriptionModal(
                            i18n.t('subscriptionModel.subscription_default', {
                                name:
                                    i18n.t('profileDetail.contact', { lng: language }) ||
                                    'contact details',
                                lng: language,
                            }),
                        );
                    } else {
                        Alert.alert(
                            i18n.t('common.notice', { lng: language }) || 'Notice',
                            `${i18n.t('profileDetail.contact', { lng: language }) ||
                            'Contact details'
                            } ${i18n.t('private_profile', { lng: language }) || 'are private'
                            }`,
                        );
                    }
                    return;
                }

                if (data?.code === 'LIMIT_REACHED') {
                    showSubscriptionModal(
                        i18n.t('contact.limitReached', { lng: language }) ||
                        'You have reached your contact view limit.',
                        true,
                    );
                    return;
                }

                if (data?.code === 'FEATURE_NOT_AVAILABLE') {
                    showSubscriptionModal(
                        i18n.t('profile.limitReached', { lng: language }) ||
                        'This feature is not available on your current plan.',
                        true,
                    );
                    return;
                }
            }

            if (!data?.phoneNumber && !data?.email) {
                Alert.alert(
                    i18n.t('common.notice', { lng: language }) || 'Notice',
                    i18n.t('contact.errorLoad', { lng: language }) ||
                    'Contact details are not available.',
                );
                return;
            }

            setContactData(data);
            setContactModalVisible(true);
        } catch (error) {
            const res = error.response;

            if (res?.data?.code === 'PRIVATE_PROFILE') {
                if (!isPaidActive) {
                    showSubscriptionModal(
                        i18n.t('subscriptionModel.subscription_default', {
                            name:
                                i18n.t('profileDetail.contact', { lng: language }) ||
                                'contact details',
                            lng: language,
                        }),
                    );
                } else {
                    Alert.alert(
                        i18n.t('common.notice', { lng: language }) || 'Notice',
                        `${i18n.t('profileDetail.contact', { lng: language }) ||
                        'Contact details'
                        } ${i18n.t('private_profile', { lng: language }) || 'are private'
                        }`,
                    );
                }
                return;
            }

            if (res?.data?.code === 'LIMIT_REACHED') {
                showSubscriptionModal(
                    i18n.t('contact.limitReached', { lng: language }) ||
                    'You have reached your contact view limit.',
                    true,
                );
                return;
            }

            if (res?.data?.code === 'FEATURE_NOT_AVAILABLE') {
                showSubscriptionModal(
                    i18n.t('profile.limitReached', { lng: language }) ||
                    'This feature is not available on your current plan.',
                    true,
                );
                return;
            }

            if (res?.status === 403) {
                if (!isPaidActive) {
                    showSubscriptionModal(
                        i18n.t('subscriptionModel.subscription_default', {
                            name: item?.fullName || 'profile',
                            lng: language,
                        }),
                    );
                } else {
                    Alert.alert(
                        i18n.t('common.error', { lng: language }) || 'Error',
                        i18n.t('contact.errorLoad', { lng: language }) ||
                        'Failed to load contact details.',
                    );
                }
                return;
            }

            Alert.alert('Error', 'Failed to load contact details.');
        } finally {
            setContactLoading(false);
        }
    };

    /**
     * Create or open a chat with a recipient.
     */
    const handleCreateChat = async (recipientId) => {
        if (!recipientId || !token) return;
        try {
            const { data } = await axios.post(
                `${API_BASE_URL}/api/chat/create`,
                { recipientId },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            navigation.navigate('MessageScreen', { chatId: data.chat._id });
        } catch (error) {
            // Silently ignore — matches original behaviour
        }
    };

    /**
     * Like / unlike a profile — thin wrapper kept here for convenience.
     */
    const handleLikeUnlike = async (profileId) => {
        if (!profileId) return;
        if (isLiked(profileId)) {
            await unlikeProfile(profileId);
        } else {
            await likeProfile(profileId);
        }
    };

    /**
     * Share a profile.
     */
    const handleShareProfile = async () => {
        try {
            await Share.share({
                message: `Check out this profile on MorJodi: ${item?.fullName || 'this profile'}`,
            });
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    /**
     * Open any profile by passing in a profileItem object directly.
     * Same gate logic as openProfile but not bound to the hook's item.
     * Use this from screens that open dynamic profiles (e.g. MessageScreen, ActivityScreen).
     */
    const openProfileById = async (profileItem) => {
        if (!profileItem?._id || !token) return;
        if (profileOpenInFlightRef.current) return;
        profileOpenInFlightRef.current = true;
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/user/view/${profileItem._id}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } },
            );
            if (response.data.success) {
                navigation.navigate('ProfileDetailScreen', {
                    profileId: profileItem._id,
                    item: profileItem,
                });
            }
        } catch (error) {
            const res = error.response;
            if (res?.data?.code === 'PRIVATE_PROFILE') {
                showSubscriptionModal(
                    i18n.t('profile.private', {
                        name: profileItem?.fullName || 'this profile',
                        lng: language,
                    }),
                    true,
                );
                return;
            }
            if (res?.data?.code === 'LIMIT_REACHED') {
                showSubscriptionModal(
                    i18n.t('profile.limitReached', { lng: language }) ||
                    'You\u2019ve reached your daily profile view limit. Upgrade to continue exploring more matches.',
                    true,
                );
                return;
            }
            if (res?.data?.message) {
                Alert.alert('Notice', res.data.message);
            } else {
                Alert.alert('Notice', 'Unable to open profile. Please try again.');
            }
        } finally {
            profileOpenInFlightRef.current = false;
        }
    };

    /**
     * See who viewed your profile — access gate check.
     * Calls POST /api/user/visitors/access to validate the user's plan feature.
     *
     * Returns:
     *   true  → access granted (caller may navigate / switch tab)
     *   false → access denied (SubscriptionModal already shown by this fn)
     *
     * This is designed to be called WITHOUT an `item` (pass null to the hook).
     * Usage: const { handleViewVisitors, subscriptionModalVisible, ... } = useProfileActions(null);
     */
    const handleViewVisitors = async () => {
        try {
            const { data } = await axios.post(
                `${API_BASE_URL}/api/user/visitors/access`,
                {},
                { headers: { Authorization: `Bearer ${token}` } },
            );

            if (data?.success) {
                return true; // caller handles navigation / tab switch
            }

            return false;
        } catch (error) {
            const res = error.response;
            const code = res?.data?.code;
            const msg = res?.data?.message;

            if (code === 'NO_ACCESS') {
                showSubscriptionModal(

                    i18n.t('visitors.noAccess', { lng: language }) ||
                    i18n.t('visitors.subscription_default', { lng: language }),
                    true,
                );
                return false;
            }

            if (code === 'LIMIT_REACHED') {
                showSubscriptionModal(

                    i18n.t('visitors.limitReached', { lng: language }) ||
                    i18n.t('visitors.limitReached', { lng: language }),
                    true,
                );
                return false;
            }

            // Unexpected error — still deny navigation
            Alert.alert('Error', msg || 'Unable to load visitors. Please try again.');
            return false;
        }
    };

    return {
        // Interest state
        interestStatus,
        isInterestSent,
        isInterestReceived,
        isInterestAccepted,
        isUnlocked,
        isPaidActive,
        isSubscribed,

        // Interest custom alert (replaces native Alert — consumers render <AwesomeAlert>)
        interestAlertState,
        dismissInterestAlert,

        // Contact state
        contactData,
        contactLoading,
        contactModalVisible,
        setContactModalVisible,

        // Subscription modal state
        subscriptionModalVisible,
        subscriptionModalMessage,
        setSubscriptionModalMessage,
        setSubscriptionModalVisible,

        // Handlers
        openProfile,
        openProfileById,
        handleImagePress,
        handleInterestPress,
        handleContactInfoPress,
        handleCreateChat,
        handleLikeUnlike,
        handleShareProfile,
        handleViewVisitors,
        handleSubscriptionUpgrade,
    };
};
