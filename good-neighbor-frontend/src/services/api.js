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

// Add a response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 (Unauthorized) or 403 (Forbidden) errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      const isInternalRoute = error.config?.url?.startsWith('/internal');
      
      if (isInternalRoute) {
        // Clear internal token and redirect to internal login
        localStorage.removeItem('internal_token');
        localStorage.removeItem('internal_user');
        
        // Only redirect if we're not already on the login page
        if (window.location.pathname !== '/internal/login') {
          window.location.href = '/internal/login';
        }
      } else {
        // Clear regular token and redirect to main login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
