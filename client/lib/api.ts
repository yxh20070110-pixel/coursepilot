export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
export const SERVER_BASE = API_BASE.replace(/\/api$/, '');

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
