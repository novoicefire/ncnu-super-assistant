// frontend/src/AuthContext.jsx (GIS API 版本)

import React, { createContext, useState, useEffect, useContext } from 'react';
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
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const handleGoogleLogin = async (credentialResponse) => {
        try {
            // 這部分的邏輯完全不變
            const decodedToken = jwtDecode(credentialResponse.credential);
            const userInfo = {
                google_id: decodedToken.sub,
                email: decodedToken.email,
                full_name: decodedToken.name,
                avatar_url: decodedToken.picture,
            };
            
            const response = await axios.post(`${API_URL}/api/auth/google`, userInfo);
            
            const fullUserData = response.data;
            setUser(fullUserData);
            localStorage.setItem('user', JSON.stringify(fullUserData));
        } catch (error) {
            console.error("Google login failed:", error);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        // 直接調用 Google 的 API 來處理登出
        if (window.google) {
            window.google.accounts.id.disableAutoSelect();
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, handleGoogleLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);