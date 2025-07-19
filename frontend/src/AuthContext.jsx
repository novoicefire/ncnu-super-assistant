// frontend/src/AuthContext.jsx (恢復強制刷新的最終版)

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

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

    const handleGoogleLogin = useCallback(async (credentialResponse) => {
        try {
            const decodedToken = jwtDecode(credentialResponse.credential);
            const userInfo = {
                google_id: decodedToken.sub,
                email: decodedToken.email,
                full_name: decodedToken.name,
                avatar_url: decodedToken.picture,
            };
            
            const response = await axios.post(`${API_URL}/api/auth/google`, userInfo);
            
            // 將使用者資料存入 localStorage
            localStorage.setItem('user', JSON.stringify(response.data));
            
            // [核心修正] 強制重載頁面，讓應用程式以全新的、已登入的狀態啟動
            window.location.reload();

        } catch (error) {
            console.error("Google login failed:", error);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('user');
        if (window.google) {
            window.google.accounts.id.disableAutoSelect();
        }
        // [核心修正] 登出時也重載頁面，確保狀態被完全清除
        window.location.reload();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, handleGoogleLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);