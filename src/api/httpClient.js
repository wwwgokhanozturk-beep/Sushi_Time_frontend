import axios from 'axios';

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Lazy token injection — avoids circular import
httpClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem('sushi_time_profile');
  if (raw) {
    try {
      const { token } = JSON.parse(raw);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
  }
  return config;
});

httpClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
        const raw = localStorage.getItem('sushi_time_profile');
      if (raw) {
        try {
          const data = JSON.parse(raw);
          if (data.token) {
            localStorage.removeItem('sushi_time_profile');
            window.location.href = '/login';
          }
        } catch {}
      }
    }
    return Promise.reject(err);
  }
);

export default httpClient;
