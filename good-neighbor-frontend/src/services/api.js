import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    // Check if this is an internal route, use internal_token if available
    const isInternalRoute = config.url?.startsWith('/internal');
    const token = isInternalRoute 
      ? localStorage.getItem('internal_token') || localStorage.getItem('token')
      : localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
