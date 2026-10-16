export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'plate_manager' | 'technician' | 'host';
  qrCode: string | null;
  emailVerified: boolean;
};

const AUTH_TOKEN_KEY = 'backoffice:token';
const AUTH_USER_KEY = 'backoffice:user';
const AUTH_LOGOUT_EVENT = 'backoffice:auth-logout';

export { AUTH_LOGOUT_EVENT, AUTH_TOKEN_KEY, AUTH_USER_KEY };

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function getStoredToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser() {
  return safeJsonParse<AuthUser>(window.localStorage.getItem(AUTH_USER_KEY));
}

export function setStoredAuth(token: string, user: AuthUser) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
  window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
}
