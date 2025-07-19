// frontend/src/AuthContext.jsx (移除 useCallback 的最終版)

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
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    // [核心修正 1] 移除 useCallback，改為普通的 async function
    const handleGoogleLogin = async (credentialResponse) => {
        // 加入一個 console.log 來確保這個函數被觸發了
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
            
            // 直接設定 user 狀態，讓 React 自己決定何時重新渲染
            setUser(fullUserData); 

        } catch (error) {
            console.error("Google login failed inside handleGoogleLogin:", error);
        }
    };

    // [核心修正 2] 移除 useCallback，改為普通的 function
    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
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