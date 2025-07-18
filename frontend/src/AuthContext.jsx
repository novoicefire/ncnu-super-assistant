import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // 當組件初次加載時，嘗試從 localStorage 獲取使用者資料
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const handleGoogleLogin = async (credentialResponse) => {
        try {
            const decodedToken = jwtDecode(credentialResponse.credential);
            const userInfo = {
                google_id: decodedToken.sub,
                email: decodedToken.email,
                full_name: decodedToken.name,
                avatar_url: decodedToken.picture,
            };

            // 將使用者資訊發送到後端進行儲存或更新
            const response = await axios.post(`${API_URL}/api/auth/google`, userInfo);
            
            // 將從後端返回的完整使用者資料（包含資料庫 id）存起來
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
        // 如果 Google 使用 One Tap，也需要呼叫 Google 的登出
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