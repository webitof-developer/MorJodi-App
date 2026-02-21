import analytics from '@react-native-firebase/analytics';
import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';

/**
 * Analytics Service
 * Handles Google Analytics and Facebook Pixel tracking
 * Only initializes if the respective tracking IDs exist in settings
 */

class AnalyticsService {
    constructor() {
        this.initialized = false;
        this.gaEnabled = false;
        this.fbEnabled = false;
    }

    /**
     * Initialize analytics services
     * Call this once on app startup after settings are loaded
     */
    async initialize(settings) {
        if (this.initialized) return;

        try {
            // Initialize Google Analytics if ID exists
            // Note: Firebase Analytics automatically initializes if generated via google-services.json
            // But we can programmatically enable/disable or set user properties.
            // The settings.gaTrackingId is less critical for Firebase (which uses the json file),
            // but if we were using GTM or a specific tracker, we might need it.
            // Here we mostly check if enabled in backend.

            if (settings.gaTrackingId) {
                console.log('📊 Google Analytics Enabled via settings');
                await analytics().setAnalyticsCollectionEnabled(true);
                this.gaEnabled = true;
            } else {
                // Optional: Disable if not present?
                // await analytics().setAnalyticsCollectionEnabled(false);
            }

            // Initialize Facebook Pixel / App Events if ID exists
            if (settings.fbAppId) {
                console.log('📊 Initializing Facebook SDK with App ID:', settings.fbAppId);
                Settings.setAppID(settings.fbAppId);
                Settings.initializeSDK();
                this.fbEnabled = true;
            }

            this.initialized = true;
            console.log('✅ Analytics initialized successfully');
        } catch (error) {
            console.error('❌ Analytics initialization failed:', error);
        }
    }

    /**
     * Track screen view
     */
    async trackScreenView(screenName) {
        // We allow tracking even if "initialized" check allows us to be flexible,
        // but usually better to gate it.

        try {
            if (this.gaEnabled) {
                // Firebase Analytics screen tracking
                await analytics().logScreenView({
                    screen_name: screenName,
                    screen_class: screenName,
                });
                console.log('📊 GA Screen View Logged:', screenName);
            }

            if (this.fbEnabled) {
                // FB App Events specific for screen, or generic logEvent
                // There isn't a direct "logScreenView" in basic AppEventsLogger, usually custom event or 'fb_mobile_content_view'
                AppEventsLogger.logEvent('fb_mobile_content_view', {
                    content_type: 'screen',
                    content_id: screenName
                });
                console.log('📊 FB Screen View Logged:', screenName);
            }
        } catch (error) {
            console.error('Error tracking screen view:', error);
        }
    }

    /**
     * Track custom event
     */
    async trackEvent(eventName, params = {}) {
        try {
            if (this.gaEnabled) {
                await analytics().logEvent(eventName, params);
                console.log('📊 GA Event Logged:', eventName);
            }

            if (this.fbEnabled) {
                // FB event names often have standard formats, but custom are allowed.
                AppEventsLogger.logEvent(eventName, params);
                console.log('📊 FB Event Logged:', eventName);
            }
        } catch (error) {
            console.error('Error tracking event:', error);
        }
    }

}

export default new AnalyticsService();
