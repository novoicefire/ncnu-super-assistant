// frontend/src/AuthContext.jsx (解耦最終版)

import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios'; // 只依賴 axios

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try { setUser(JSON.parse(storedUser)); } 
            catch (e) { localStorage.removeItem('user'); }
        }
        setIsLoading(false);
    }, []);

    const handleGoogleLogin = async (credentialResponse) => {
        console.log("Google Login Succeeded, handling credentials...");
        try {
            const decodedToken = jwtDecode(credentialResponse.credential);
            const userInfo = {
                google_id: decodedToken.sub, email: decodedToken.email,
                full_name: decodedToken.name, avatar_url: decodedToken.picture,
            };
            
            // [核心修正] 使用最基礎的 axios.post，不再依賴 apiHelper
            const response = await axios.post(`${API_URL}/api/auth/google`, userInfo);
            
            const fullUserData = response.data;
            localStorage.setItem('user', JSON.stringify(fullUserData));
            setUser(fullUserData); 
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
        <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, handleGoogleLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);