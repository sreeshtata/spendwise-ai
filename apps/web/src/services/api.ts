import { SpendWiseClient } from '@spendwise/contracts';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export function getActiveUserToken(): string {
  return localStorage.getItem('spendwise_active_user') || 'demo-user-1';
}

export const sdkClient = new SpendWiseClient({
  baseUrl: API_BASE_URL,
  authToken: getActiveUserToken(),
});

export function setAppUser(userToken: 'demo-user-1' | 'demo-user-2') {
  sdkClient.setAuthToken(userToken);
  localStorage.setItem('spendwise_active_user', userToken);
}
