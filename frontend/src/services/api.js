import { API_BASE_URL } from '../utils/constants';

export async function uploadFile(endpoint, file) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
    });

    const responseText = await response.text();
    let responseData = {};
    if (responseText) {
        try {
            responseData = JSON.parse(responseText);
        } catch {
            responseData = { detail: responseText };
        }
    }

    if (!response.ok) {
        const detail = responseData?.detail || 'Error de comunicación con el servidor';
        throw new Error(detail);
    }

    return responseData;
}

export async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    // Add authorization token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const requestConfig = {
        headers,
        ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestConfig);
    const responseText = await response.text();

    let responseData = {};
    if (responseText) {
        try {
            responseData = JSON.parse(responseText);
        } catch {
            responseData = { detail: responseText };
        }
    }

    if (!response.ok) {
        const detail = responseData?.detail || 'Error de comunicación con el servidor';
        throw new Error(detail);
    }

    return responseData;
}
