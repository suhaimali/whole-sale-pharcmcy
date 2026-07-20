import { useState } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  // Start not logged in, but check localStorage for persistence
  const initialToken = localStorage.getItem('token');
  const [user, setUser] = useState(initialToken ? {
    _id: 'mock-id-12345',
    username: 'admin',
    role: 'Administrator',
    email: 'admin@pharmacy.com'
  } : null);
  const [token, setToken] = useState(initialToken);
  const loading = false;

  // Set default axios header & write to localStorage
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }

  const login = async (identifier, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        identifier,
        password
      });
      
      const { token: userToken, ...userData } = response.data;
      setUser(userData);
      setToken(userToken);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please check your connection and credentials.' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
export default AuthProvider;
