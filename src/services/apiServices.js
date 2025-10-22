import api from './api';

// Auth API
export const authAPI = {
  // Register user
  register: (userData) => api.post('/auth/register', userData),
  
  // Login user
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Logout user
  logout: () => api.post('/auth/logout'),
  
  // Get user profile
  getProfile: () => api.get('/auth/profile'),
  
  // Update user profile
  updateProfile: (userData) => api.put('/auth/profile', userData),
  
  // Change password
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  
  // Forgot password
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  // Reset password
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  
  // Verify email
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  
  // Resend verification
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  
  // Upload avatar
  uploadAvatar: (formData) => api.put('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// Products API
export const productsAPI = {
  // Get all products
  getProducts: (params) => api.get('/products', { params }),
  
  // Get single product
  getProduct: (id) => api.get(`/products/${id}`),
  
  // Get featured products
  getFeaturedProducts: () => api.get('/products/featured'),
  
  // Get new arrivals
  getNewArrivals: () => api.get('/products/new-arrivals'),
  
  // Search products
  searchProducts: (params) => api.get('/products/search', { params }),
  
  // Get product reviews
  getProductReviews: (id, params) => api.get(`/products/${id}/reviews`, { params }),
  
  // Get product rating distribution
  getProductRatingDistribution: (id) => api.get(`/products/${id}/rating-distribution`),
  
  // Admin: Create product
  createProduct: (productData) => api.post('/products', productData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Admin: Update product
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Admin: Delete product
  deleteProduct: (id) => api.delete(`/products/${id}`)
};

// Orders API
export const ordersAPI = {
  // Get user orders
  getUserOrders: (params) => api.get('/orders/my-orders', { params }),
  
  // Get single order
  getOrder: (id) => api.get(`/orders/${id}`),
  
  // Create order
  createOrder: (orderData) => api.post('/orders', orderData),
  
  // Cancel order
  cancelOrder: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
  
  // Get order stats
  getOrderStats: () => api.get('/orders/stats'),
  
  // Admin: Get all orders
  getAllOrders: (params) => api.get('/orders', { params }),
  
  // Admin: Update order
  updateOrder: (id, orderData) => api.put(`/orders/${id}`, orderData)
};

// Reviews API
export const reviewsAPI = {
  // Get all reviews
  getReviews: (params) => api.get('/reviews', { params }),
  
  // Get single review
  getReview: (id) => api.get(`/reviews/${id}`),
  
  // Create review
  createReview: (reviewData) => api.post('/reviews', reviewData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Update review
  updateReview: (id, reviewData) => api.put(`/reviews/${id}`, reviewData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Delete review
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  
  // Get user reviews
  getUserReviews: (params) => api.get('/reviews/my-reviews', { params }),
  
  // Mark review as helpful
  markReviewHelpful: (id) => api.post(`/reviews/${id}/helpful`),
  
  // Get review stats
  getReviewStats: () => api.get('/reviews/stats')
};

// Users API (Admin)
export const usersAPI = {
  // Get all users
  getUsers: (params) => api.get('/users', { params }),
  
  // Get single user
  getUser: (id) => api.get(`/users/${id}`),
  
  // Update user
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  
  // Delete user
  deleteUser: (id) => api.delete(`/users/${id}`),
  
  // Get admin stats
  getAdminStats: () => api.get('/users/stats')
};
