import axios from 'axios';
import { API_BASE_URL } from '../constants/config';

// Fetch notices targeted to the logged-in user
export const getMyNotices = async (token) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/notice/my-notices`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("Failed to fetch notices:", error);
        return [];
    }
};

// Track notice events (view, click, remind, complete)
export const trackNoticeEvent = async (noticeId, event, token) => {
    try {
        await axios.post(`${API_BASE_URL}/api/notice/${noticeId}/track`,
            { event },
            { headers: { Authorization: `Bearer ${token}` } }
        );
    } catch (error) {
        console.log("Failed to track notice event:", error);
    }
};
