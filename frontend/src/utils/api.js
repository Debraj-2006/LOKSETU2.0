import axios from 'axios';
import { auth } from './firebaseClient';

const api = axios.create({ baseURL: '/api' });

// Attach Firebase ID Token JWT to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Error getting Firebase token:', error);
    }
  }
  return config;
});

export default api;
