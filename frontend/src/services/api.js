const API_URL = 'http://localhost:5000/api';

import axios from 'axios';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const productService = {
  getProducts: (search = '', category = '') => 
    api.get(`/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

export const saleService = {
  getSales: () => api.get('/sales'),
  createSale: (data) => api.post('/sales', data),
  collectPayment: (id, paymentMethod) => api.put(`/sales/${id}/pay`, { paymentMethod }),
  deleteSale: (id) => api.delete(`/sales/${id}`),
  updateSale: (id, saleData) => api.put(`/sales/${id}`, saleData),
};

export const purchaseService = {
  getPurchases: () => api.get('/purchases'),
  createPurchase: (data) => api.post('/purchases', data),
  collectPayment: (id, paymentMethod) => api.put(`/purchases/${id}/pay`, { paymentMethod }),
  deletePurchase: (id) => api.delete(`/purchases/${id}`),
  updatePurchase: (id, purchaseData) => api.put(`/purchases/${id}`, purchaseData),
};

export const userService = {
  getUsers: () => api.get('/users'),
  createUser: (data) => api.post('/users', data),
  toggleUser: (id) => api.put(`/users/${id}/toggle`),
};

export const expenseService = {
  getExpenses: () => api.get('/expenses'),
  createExpense: (data) => api.post('/expenses', data),
  updateExpense: (id, data) => api.put(`/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
};

export const cashService = {
  getCashTransactions: () => api.get('/cash'),
  createCashTransaction: (data) => api.post('/cash', data),
  updateCashTransaction: (id, data) => api.put(`/cash/${id}`, data),
  deleteCashTransaction: (id) => api.delete(`/cash/${id}`),
};

export default api;
