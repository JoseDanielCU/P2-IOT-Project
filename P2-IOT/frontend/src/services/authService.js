import { apiRequest } from './api';
import { AUTH_REGISTER_ENDPOINT } from '../utils/constants';

export async function registerUser(userData) {
    return apiRequest(AUTH_REGISTER_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}
