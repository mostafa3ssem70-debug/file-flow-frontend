import axios from 'axios';

const API = axios.create({
    baseURL: 'https://file-flow-backend.vercel.app/api',
});

// إرفاق التوكن تلقائياً مع كل طلب إذا كان متوفراً في localStorage
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;