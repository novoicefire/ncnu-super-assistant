import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { robustRequest } from './apiHelper'; // [核心修正] 引入新函數

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { /* ... (此處不變) ... */ }, []);

    const handleGoogleLogin = async (credentialResponse) => {
        console.log("Google Login Succeeded, handling credentials...");
        try {
            const decodedToken = jwtDecode(credentialResponse.credential);
            const userInfo = {
                google_id: decodedToken.sub, email: decodedToken.email,
                full_name: decodedToken.name, avatar_url: decodedToken.picture,
            };
            
            // [核心修正] 使用 robustRequest
            const fullUserData = await robustRequest('post', '/api/auth/google', { data: userInfo });

            localStorage.setItem('user', JSON.stringify(fullUserData));
            setUser(fullUserData);
        } catch (error) {
            console.error("Google login failed inside handleGoogleLogin:", error);
        }
    };

    const logout = () => { /* ... (此處不變) ... */ };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, handleGoogleLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);