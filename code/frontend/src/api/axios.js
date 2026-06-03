import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// к запросам всегда будут добавляться заголовок с токеном
// на клиенте токен хранится в localstorage
// promise.reject возвращает отклоненный промис, чтобы клиент обработал ее в блоке catch
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;