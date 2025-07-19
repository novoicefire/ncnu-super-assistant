// frontend/src/AuthContext.jsx (useCallback 修正版)

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

    // [核心修正 1] 使用 useCallback 包裹 handleGoogleLogin
    // 這確保了當 setUser 函數的實例改變時 (雖然很少見)，這個函數也會被重新建立
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
            setUser(fullUserData); // 觸發狀態更新
            localStorage.setItem('user', JSON.stringify(fullUserData));
        } catch (error) {
            console.error("Google login failed:", error);
        }
    }, []); // 依賴為空陣列，表示此函數在元件生命週期內是穩定的

    // [核心修正 2] 使用 useCallback 包裹 logout
    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('user');
        if (window.google) {
            window.google.accounts.id.disableAutoSelect();
        }
        // 重新整理頁面以確保所有狀態都被重置，這是最簡單可靠的方法
        window.location.reload();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, handleGoogleLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);