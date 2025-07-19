// frontend/src/AuthContext.jsx (強制刷新版)

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
            
            const fullUserData = response.data;
            // 狀態更新和本地儲存依然保留
            setUser(fullUserData); 
            localStorage.setItem('user', JSON.stringify(fullUserData));
            
            // [核心修正] 在成功處理完所有邏輯後，強制重載頁面
            window.location.reload();

        } catch (error) {
            console.error("Google login failed:", error);
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('user');
        if (window.google) {
            window.google.accounts.id.disableAutoSelect();
        }
        // 登出時也重載頁面，以確保狀態乾淨
        window.location.reload();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, handleGoogleLogin, logout }}>
            {children}
        </Auth.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);