// frontend/src/AuthContext.jsx (最終完整版 + 推播訂閱整合)

import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// 推播訂閱工具函數
const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

// 檢查並訂閱推播通知
const checkAndSubscribeToNotifications = async (googleId) => {
    // 檢查瀏覽器支援
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.log('Push notifications not supported');
        return;
    }

    try {
        // 先檢查 Service Worker 是否已註冊
        let registration = await navigator.serviceWorker.getRegistration('/service-worker.js');

        if (!registration) {
            // 尚未註冊，嘗試註冊
            registration = await navigator.serviceWorker.register('/service-worker.js');
        }
        await navigator.serviceWorker.ready;

        // 檢查是否已有訂閱
        const existingSubscription = await registration.pushManager.getSubscription();

        if (existingSubscription) {
            console.log('Already subscribed to push notifications, updating user_id...');
            console.log('Updating subscription for user:', googleId);

            // 確保後端有這個訂閱記錄（可能 user_id 不同，需要更新）
            const response = await fetch(`${API_URL}/api/push/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: googleId,
                    subscription: existingSubscription.toJSON()
                })
            });

            const result = await response.json();
            console.log('Subscribe API response:', result);

            if (!response.ok) {
                console.error('Failed to update subscription:', result);
            }
            return;
        }

        // 檢查通知權限
        if (Notification.permission === 'default') {
            // 尚未決定，請求權限
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('Notification permission denied');
                return;
            }
        } else if (Notification.permission === 'denied') {
            console.log('Notification permission previously denied');
            return;
        }

        // 取得 VAPID 公鑰
        const vapidResponse = await fetch(`${API_URL}/api/push/vapid-public-key`);
        if (!vapidResponse.ok) {
            console.warn('VAPID key not available');
            return;
        }
        const { publicKey } = await vapidResponse.json();

        // 訂閱推播
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
        });

        // 發送訂閱資訊到後端
        await fetch(`${API_URL}/api/push/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: googleId,
                subscription: subscription.toJSON()
            })
        });

        console.log('Push notification subscribed successfully');
    } catch (error) {
        console.error('Push subscription failed:', error);
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // 載入時從 localStorage 恢復登入狀態
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

    // 當 user 變化時，檢查並訂閱推播
    useEffect(() => {
        console.log('User state changed:', user);
        console.log('User google_id:', user?.google_id);

        if (user?.google_id) {
            console.log('Will check push subscription in 2 seconds...');
            // 延遲一點執行，避免頁面載入時立即彈出權限請求
            const timer = setTimeout(() => {
                console.log('Executing checkAndSubscribeToNotifications...');
                checkAndSubscribeToNotifications(user.google_id);
            }, 2000);
            return () => clearTimeout(timer);
        } else {
            console.log('No google_id found, skipping push subscription');
        }
    }, [user]);

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
            // 注意：訂閱會由上面的 useEffect 自動觸發

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

