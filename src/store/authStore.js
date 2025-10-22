import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { authAPI } from '../services/apiServices';
import toast from 'react-hot-toast';

// Auth Store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.login(credentials);
          const { user, token } = response.data.data;
          
          // Set token in cookie
          Cookies.set('token', token, { expires: 7 });
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
          
          toast.success('Login successful!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.response?.data?.message || 'Login failed' };
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.register(userData);
          const { user, token } = response.data.data;
          
          // Set token in cookie
          Cookies.set('token', token, { expires: 7 });
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
          
          toast.success('Registration successful!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.response?.data?.message || 'Registration failed' };
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear state and cookies
          Cookies.remove('token');
          Cookies.remove('user');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
          toast.success('Logged out successfully!');
        }
      },

      updateProfile: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.updateProfile(userData);
          const { user } = response.data.data;
          
          set({
            user,
            isLoading: false
          });
          
          toast.success('Profile updated successfully!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.response?.data?.message || 'Update failed' };
        }
      },

      changePassword: async (passwordData) => {
        set({ isLoading: true });
        try {
          await authAPI.changePassword(passwordData);
          set({ isLoading: false });
          toast.success('Password changed successfully!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.response?.data?.message || 'Password change failed' };
        }
      },

      // Initialize auth state from cookies
      initializeAuth: () => {
        const token = Cookies.get('token');
        const user = Cookies.get('user');
        
        if (token && user) {
          try {
            const parsedUser = JSON.parse(user);
            set({
              user: parsedUser,
              token,
              isAuthenticated: true
            });
          } catch (error) {
            console.error('Error parsing user data:', error);
            Cookies.remove('token');
            Cookies.remove('user');
          }
        }
      },

      // Clear auth state
      clearAuth: () => {
        Cookies.remove('token');
        Cookies.remove('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
