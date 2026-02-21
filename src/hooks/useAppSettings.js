/**
 * useAppSettings Hook
 * Provides access to dynamic app settings loaded from the backend
 * Fallback to defaults if settings haven't been loaded yet
 */
import { useMemo } from 'react';

const useAppSettings = () => {
    const settings = useMemo(() => {
        // Get from global environment (loaded in App.js)
        const env = typeof global !== 'undefined' ? global.__APP_ENV__ : {};

        return {
            appName: env.APP_NAME || 'MorJodi',
            supportEmail: env.SUPPORT_EMAIL || 'support@morjodi.com',
            supportPhone: env.SUPPORT_PHONE || '+91 1234567890',

            // Analytics
            gaTrackingId: env.GA_MEASUREMENT_ID || env.GA_TRACKING_ID || null,
            fbAppId: env.META_APP_ID || env.FACEBOOK_APP_ID || null,
            fbPixelId: env.META_PIXEL_ID || env.FACEBOOK_PIXEL_ID || null,

            // OAuth
            googleClientId: env.GOOGLE_CLIENT_ID || null,
        };
    }, []);

    return settings;
};

export default useAppSettings;
