import axios from 'axios';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { API_BASE_URL } from '../constants/config';

// Get current app version
export const getCurrentVersion = () => {
    return DeviceInfo.getVersion();
};

// Check for updates
export const checkVersion = async () => {
    try {
        const currentVersion = getCurrentVersion();
        const response = await axios.get(`${API_BASE_URL}/api/app-version/check?currentVersion=${currentVersion}`);
        return response.data;
    } catch (error) {
        console.error("Version check error:", error);
        return { updateAvailable: false };
    }
};

// Track events
export const trackUpdateEvent = async (actionType, latestVersion, userId = null) => {
    try {
        const deviceId = await DeviceInfo.getUniqueId();
        const payload = {
            deviceId,
            currentVersion: getCurrentVersion(),
            latestVersion: latestVersion || 'unknown',
            actionType,
        };

        if (userId) {
            payload.userId = userId;
        }

        await axios.post(`${API_BASE_URL}/api/analytics/app-update`, payload);
    } catch (error) {
        console.log("Failed to track event:", error);
    }
};
