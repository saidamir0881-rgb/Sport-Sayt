// Backendsiz rejim: so'rovlar tarmoqqa chiqmaydi, brauzer ichidagi localApi.jsx bajaradi.
import { handle } from './localApi';

export const API_ORIGIN = '';
export const assetUrl = (p) => p || '';

export const getToken = () => (typeof window === 'undefined' ? null : localStorage.getItem('ts_token'));
export const setToken = (t) => {
  if (typeof window === 'undefined') return;
  if (t) localStorage.setItem('ts_token', t);
  else localStorage.removeItem('ts_token');
};

export async function api(path, { method = 'GET', body, query, formData } = {}) {
  try {
    return await handle({ path, method, body, query, formData, token: getToken() });
  } catch (err) {
    if (err.status === 401 && getToken()) { setToken(null); window.dispatchEvent(new Event('ts-logout')); }
    throw err;
  }
}

export async function uploadFile(file) {
  const r = await api('/uploads', { method: 'POST', formData: { file } });
  return r.data; // { url, type }
}
