import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android emulators to connect to localhost. 
// If using a physical device, change this to your computer's local IP address (e.g., http://192.168.x.x:8000)
export const BASE_URL = Platform.OS === 'android' ? 'http://10.66.89.175:8000' : 'http://localhost:8000';

const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('Cureconnect_token');
    console.log('Token:', token ? '✅ Found' : '❌ Missing');
    return token;
  } catch (e) {
    return null;
  }
};

const getUserIdFromToken = async () => {
  try {
    const token = await AsyncStorage.getItem('Cureconnect_token');
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
    const payload = JSON.parse(jsonPayload);
    return payload.user_id;
  } catch (e) {
    console.warn('Token decode error:', e);
    return null;
  }
};

const fetchWithTimeout = async (url, options, timeout = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    if (e.name === 'AbortError') {
      throw new Error('Connection timeout. Check your WiFi.');
    }
    throw new Error('Cannot connect to server. Make sure backend is running.');
  }
};

const headers = async (auth = true) => {
  const h = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
  }
  return h;
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Something went wrong');
  return data;
};

// ─── Auth ─────────────────────────────────────────────
export const authAPI = {
  register: async (name, email, password) => {
    const res = await fetchWithTimeout(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: await headers(false),
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(res);
  },

  login: async (email, password) => {
    const res = await fetchWithTimeout(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: await headers(false),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  forgotPassword: async (email) => {
    const res = await fetchWithTimeout(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: await headers(false),
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  resetPassword: async (email, otp, new_password) => {
    const res = await fetchWithTimeout(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: await headers(false),
      body: JSON.stringify({ email, otp, new_password }),
    });
    return handleResponse(res);
  },
};

// ─── Users ────────────────────────────────────────────
export const userAPI = {
  getProfile: async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: await headers(),
    });
    return handleResponse(res);
  },

  updateProfile: async (data) => {
    const res = await fetchWithTimeout(`${BASE_URL}/api/auth/me`, {
      method: 'PUT',
      headers: await headers(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteAccount: async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/api/auth/me`, {
      method: 'DELETE',
      headers: await headers(),
    });
    return handleResponse(res);
  },
};

// ─── Medicines ────────────────────────────────────────
export const medicineAPI = {
  getAll: async () => {
    const userId = await getUserIdFromToken();
    if (!userId) throw new Error('Not logged in');
    const res = await fetchWithTimeout(`${BASE_URL}/api/medicines/${userId}`, {
      method: 'GET',
      headers: await headers(),
    });
    return handleResponse(res);
  },

  add: async (data) => {
    const userId = await getUserIdFromToken();
    if (!userId) throw new Error('Not logged in');
    const res = await fetchWithTimeout(`${BASE_URL}/api/medicines/save`, {
      method: 'POST',
      headers: await headers(),
      body: JSON.stringify({ ...data, userId }),
    });
    return handleResponse(res);
  },

  delete: async (id) => {
    const res = await fetchWithTimeout(`${BASE_URL}/api/medicines/${id}`, {
      method: 'DELETE',
      headers: await headers(),
    });
    return handleResponse(res);
  },
};

// ─── Family ───────────────────────────────────────────
export const familyAPI = {
  getAll: async () => {
    const userId = await getUserIdFromToken();
    if (!userId) throw new Error('Not logged in');
    const res = await fetchWithTimeout(`${BASE_URL}/api/family/${userId}`, {
      method: 'GET',
      headers: await headers(),
    });
    return handleResponse(res);
  },

  add: async (data) => {
    const userId = await getUserIdFromToken();
    if (!userId) throw new Error('Not logged in');
    const res = await fetchWithTimeout(`${BASE_URL}/api/family/`, {
      method: 'POST',
      headers: await headers(),
      body: JSON.stringify({ ...data, userId }),
    });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await fetchWithTimeout(`${BASE_URL}/api/family/${id}`, {
      method: 'PUT',
      headers: await headers(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  checkIn: async (id, note) => {
    const res = await fetchWithTimeout(
      `${BASE_URL}/api/family/${id}/checkin?note=${encodeURIComponent(note)}`, {
      method: 'POST',
      headers: await headers(),
    });
    return handleResponse(res);
  },

  delete: async (id) => {
    const res = await fetchWithTimeout(`${BASE_URL}/api/family/${id}`, {
      method: 'DELETE',
      headers: await headers(),
    });
    return handleResponse(res);
  },
};
// ─── Symptoms ─────────────────────────────────────────
export const symptomsAPI = {
  analyze: async (symptoms) => {
    const res = await fetchWithTimeout(`${BASE_URL}/api/symptoms/analyze`, {
      method: 'POST',
      headers: await headers(),
      body: JSON.stringify({ symptoms }),
    });
    return handleResponse(res);
  },
};

// ─── Doctors ─────────────────────────────────────────

export const doctorsAPI = {
  getNearby: async (
    lat,
    lng,
    specialization = 'All',
    radius = 500000
  ) => {
    const res = await fetchWithTimeout(
      `${BASE_URL}/api/doctors/nearby?lat=${lat}&lng=${lng}&specialization=${specialization}&radius=${radius}`,
      {
        method: 'GET',
        headers: await headers(),
      }
    );

    return handleResponse(res);
  },

  getStates: async () => {
    const res = await fetchWithTimeout(
      `${BASE_URL}/api/doctors/states`,
      {
        method: 'GET',
        headers: await headers(),
      }
    );

    return handleResponse(res);
  },

  getCities: async () => {
    const res = await fetchWithTimeout(
      `${BASE_URL}/api/doctors/cities`,
      {
        method: 'GET',
        headers: await headers(),
      }
    );

    return handleResponse(res);
  },
};