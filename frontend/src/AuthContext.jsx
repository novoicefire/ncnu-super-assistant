// frontend/src/AuthContext.jsx (新增管理員功能)
import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL;

// 🔐 管理員白名單 - 請替換為您的實際 email
const ADMIN_EMAILS = [
  'ncnustudenthelper@gmail.com',  // 替換為您的管理員 email
  //'@gmail.com',  // 替換為新增的管理員 email
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🎯 新增：管理員權限檢查
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleGoogleLogin = async (credentialResponse) => {
    console.log("Google Login Succeeded, handling credentials...");
    try {
      const decodedToken = jwtDecode(credentialResponse.credential);
      const userInfo = {
        google_id: decodedToken.sub,
        email: decodedToken.email,
        full_name: decodedToken.name,
        avatar_url: decodedToken.picture,
      };

      const response = await axios.post(`${API_URL}/api/auth/google`, userInfo);
      const fullUserData = response.data;

      localStorage.setItem('user', JSON.stringify(fullUserData));
      setUser(fullUserData);

      // 🎯 管理員登入提示
      if (ADMIN_EMAILS.includes(userInfo.email)) {
        console.log('🔐 管理員登入成功');
      }
    } catch (error) {
      console.error("Google login failed inside handleGoogleLogin:", error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isLoggedIn: !!user,
      isAdmin,  // 🎯 新增管理員狀態
      handleGoogleLogin,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
