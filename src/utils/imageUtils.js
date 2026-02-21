import { API_BASE_URL } from '../constants/config';

/**
 * Resolves the image URL.
 * If the path is absolute (starts with http), returns it as is.
 * If the path is relative, prepends the API_BASE_URL.
 * If path is null/undefined, returns null (caller should handle placeholder).
 * 
 * @param {string} path - The image path from the backend
 * @returns {string|null} - The resolved full URL
 */
export const getImageUrl = (path) => {
    if (!path) return null;
    if (path.includes('storage.googleapis.com')) {
        return `${API_BASE_URL}/api/user/image-proxy?url=${encodeURIComponent(path)}`;
    }
    if (path.startsWith('http') || path.startsWith('https') || path.startsWith('file://') || path.startsWith('content://')) {
        return path;
    }
    // Trim leading slash if present to avoid double slashes if API_BASE_URL has one (though usually it doesn't)
    // But standard practice: relative paths from backend might differ. 
    // API_BASE_URL usually doesn't have trailing slash.
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
};
