import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('civicchain_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
      return response;
    }
    return {
      ...response,
      data: {
        success: true,
        data: response.data,
        message: 'Success',
      }
    };
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('civicchain_token');
      localStorage.removeItem('civicchain_wallet');
      window.location.href = '/login';
    }
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    toast.error(message);
    return Promise.reject(error);
  }
);

export default api;
