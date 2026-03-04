import { API_BASE_URL } from '../utils/constants';

export async function apiRequest(endpoint, options = {}) {
    const requestConfig = {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        ...options
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