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
    console.log('[Push] Starting push subscription check...');

    // 檢查瀏覽器支援
    if (!('Notification' in window)) {
        console.log('[Push] Notification API not supported');
        return;
    }

    if (!('serviceWorker' in navigator)) {
        console.log('[Push] Service Worker not supported');
        return;
    }

    // 檢測 iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;

    console.log('[Push] Environment:', { isIOS, isPWA, permission: Notification.permission });

    // iOS Safari 只能在 PWA 模式下使用推播
    if (isIOS && !isPWA) {
        console.log('[Push] iOS detected but not in PWA mode, skipping push subscription');
        return;
    }

    try {
        // 檢查 Service Worker 註冊
        console.log('[Push] Checking Service Worker registration...');
        let registration = await navigator.serviceWorker.getRegistration('/service-worker.js');

        if (!registration) {
            console.log('[Push] Registering Service Worker...');
            registration = await navigator.serviceWorker.register('/service-worker.js');
        }

        console.log('[Push] Waiting for Service Worker ready...');
        await navigator.serviceWorker.ready;
        console.log('[Push] Service Worker is ready');

        // 檢查是否已有訂閱
        const existingSubscription = await registration.pushManager.getSubscription();
        console.log('[Push] Existing subscription:', existingSubscription ? 'Yes' : 'No');

        if (existingSubscription) {
            console.log('[Push] Already subscribed, updating user_id in backend...');

            const response = await fetch(`${API_URL}/api/push/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: googleId,
                    subscription: existingSubscription.toJSON()
                })
            });

            const result = await response.json();
            console.log('[Push] Subscribe API response:', response.status, result);

            if (!response.ok) {
                console.error('[Push] Failed to update subscription:', result);
            } else {
                console.log('[Push] Subscription updated successfully');
            }
            return;
        }

        // 檢查通知權限
        console.log('[Push] Current permission:', Notification.permission);

        if (Notification.permission === 'denied') {
            console.log('[Push] Permission previously denied, cannot subscribe');
            return;
        }

        if (Notification.permission === 'default') {
            console.log('[Push] Requesting permission...');
            const permission = await Notification.requestPermission();
            console.log('[Push] Permission result:', permission);

            if (permission !== 'granted') {
                console.log('[Push] Permission not granted');
                return;
            }
        }

        // 取得 VAPID 公鑰
        console.log('[Push] Fetching VAPID public key...');
        const vapidResponse = await fetch(`${API_URL}/api/push/vapid-public-key`);

        if (!vapidResponse.ok) {
            console.warn('[Push] VAPID key not available:', vapidResponse.status);
            return;
        }

        const { publicKey } = await vapidResponse.json();
        console.log('[Push] Got VAPID public key');

        // 訂閱推播
        console.log('[Push] Creating push subscription...');
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
        console.log('[Push] Push subscription created:', subscription.endpoint);

        // 發送訂閱資訊到後端
        console.log('[Push] Sending subscription to backend...');
        const response = await fetch(`${API_URL}/api/push/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: googleId,
                subscription: subscription.toJSON()
            })
        });

        const result = await response.json();
        console.log('[Push] Backend response:', response.status, result);

        if (response.ok) {
            console.log('[Push] ✅ Push notification subscribed successfully!');
        } else {
            console.error('[Push] ❌ Failed to save subscription:', result);
        }
    } catch (error) {
        console.error('[Push] ❌ Push subscription failed:', error.name, error.message);
        console.error('[Push] Stack:', error.stack);
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

            // 儲存用戶資料與原始 credential（用於管理員 API 驗證）
            const fullUserData = {
                ...response.data,
                credential: credentialResponse.credential  // 保存 ID Token
            };
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

