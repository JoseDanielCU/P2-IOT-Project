import { apiRequest } from './api';
import { AUTH_REGISTER_ENDPOINT, AUTH_LOGIN_ENDPOINT } from '../utils/constants';

export async function registerUser(userData) {
    return apiRequest(AUTH_REGISTER_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(userData),
    });
}

export async function loginUser(credentials) {
    return apiRequest(AUTH_LOGIN_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(credentials),
    });
}
