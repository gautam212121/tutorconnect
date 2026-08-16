import axios from 'axios';

export const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || ' ') + '/api/v1/',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('verifiedtutor-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Admin API
export const adminApi = {
  getSettings: () => api.get('admin-new/settings').then(res => res.data),
  updateSettings: (data) => api.put('admin-new/settings', data).then(res => res.data),
  updateSettingsMultipart: (formData) => api.put('admin-new/settings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data),
  
  getCategories: () => api.get('admin-new/categories').then(res => res.data),
  createCategory: (data) => api.post('admin-new/categories', data).then(res => res.data),
  createCategoryMultipart: (formData) => api.post('admin-new/categories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data),
  updateCategory: (id, data) => api.put(`admin-new/categories/${id}`, data).then(res => res.data),
  updateCategoryMultipart: (id, formData) => api.put(`admin-new/categories/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data),
  deleteCategory: (id) => api.delete(`admin-new/categories/${id}`).then(res => res.data),
  
  getUsers: (role) => api.get(`admin-new/users${role ? `?role=${role}` : ''}`).then(res => res.data),
  createUser: (data) => api.post('admin-new/users', data).then(res => res.data),
  createUserMultipart: (formData) => api.post('admin-new/users', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data),
  updateUser: (id, data) => api.put(`admin-new/users/${id}`, data).then(res => res.data),
  updateUserMultipart: (id, formData) => api.put(`admin-new/users/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data),
  deleteUser: (id) => api.delete(`admin-new/users/${id}`).then(res => res.data),
  
  getCourses: () => api.get('admin-new/courses').then(res => res.data),
  createCourse: (data) => api.post('admin-new/courses', data).then(res => res.data),
  updateCourse: (id, data) => api.put(`admin-new/courses/${id}`, data).then(res => res.data),
  deleteCourse: (id) => api.delete(`admin-new/courses/${id}`).then(res => res.data),
  
  getBookings: () => api.get('admin-new/bookings').then(res => res.data),
  updateBooking: (id, data) => api.put(`admin-new/bookings/${id}`, data).then(res => res.data),
  assignTutor: (bookingId, tutorId, scheduledAt) => api.patch(`bookings/${bookingId}/assign-tutor`, { tutorId, scheduledAt }).then(res => res.data),
  rejectBooking: (bookingId, reason) => api.patch(`bookings/${bookingId}/reject`, { reason }).then(res => res.data),
  confirmQrPayment: (bookingId) => api.post(`bookings/${bookingId}/payment/qr-confirm`).then(res => res.data),
};

// Student API
export const studentApi = {
  getMyBookings: () => api.get('bookings/student/me').then(res => res.data).catch(() => []),
  createBooking: (data) => api.post('bookings', data).then(res => res.data),
  claimQrPayment: (bookingId) => api.post(`bookings/${bookingId}/payment/qr-claim`).then(res => res.data),
};

// Config API
export const configApi = {
  getPublicSettings: () => api.get('config/settings/public').then(res => res.data).catch(() => ({})),
};
