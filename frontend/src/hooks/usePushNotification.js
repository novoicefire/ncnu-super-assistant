/**
 * usePushNotification.js - 瀏覽器推播通知 Hook
 * 處理推播權限請求、訂閱和取消訂閱
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext.jsx';

// API 基礎路徑
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * usePushNotification - 推播通知 Hook
 * @returns {Object} 推播相關狀態和方法
 */
export const usePushNotification = () => {
    const { user, isLoggedIn } = useAuth();
    const [permission, setPermission] = useState('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 檢查瀏覽器是否支援推播
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;

    // 初始化：檢查權限狀態
    useEffect(() => {
        if (isSupported) {
            setPermission(Notification.permission);
            checkSubscription();
        }
    }, [isSupported]);

    // 檢查目前的訂閱狀態
    const checkSubscription = useCallback(async () => {
        if (!isSupported) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (err) {
            console.error('Error checking subscription:', err);
        }
    }, [isSupported]);

    // 請求通知權限並訂閱
    const subscribe = useCallback(async () => {
        if (!isSupported) {
            setError('瀏覽器不支援推播通知');
            return false;
        }

        if (!isLoggedIn || !user?.google_id) {
            setError('請先登入');
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            // 請求權限
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult !== 'granted') {
                setError('通知權限被拒絕');
                return false;
            }

            // 註冊 Service Worker
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            await navigator.serviceWorker.ready;

            // 取得 VAPID 公鑰
            const vapidResponse = await fetch(`${API_BASE}/api/push/vapid-public-key`);
            if (!vapidResponse.ok) {
                throw new Error('無法取得 VAPID 金鑰');
            }
            const { publicKey } = await vapidResponse.json();

            // 轉換 VAPID 公鑰格式
            const applicationServerKey = urlBase64ToUint8Array(publicKey);

            // 訂閱推播
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });

            // 發送訂閱資訊到後端
            const response = await fetch(`${API_BASE}/api/push/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.google_id,
                    subscription: subscription.toJSON()
                })
            });

            if (!response.ok) {
                throw new Error('訂閱失敗');
            }

            setIsSubscribed(true);
            return true;
        } catch (err) {
            console.error('Error subscribing:', err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, [isSupported, isLoggedIn, user]);

    // 取消訂閱
    const unsubscribe = useCallback(async () => {
        if (!isSupported) return false;

        setLoading(true);
        setError(null);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // 通知後端取消訂閱
                await fetch(`${API_BASE}/api/push/unsubscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        endpoint: subscription.endpoint
                    })
                });

                // 瀏覽器端取消訂閱
                await subscription.unsubscribe();
            }

            setIsSubscribed(false);
            return true;
        } catch (err) {
            console.error('Error unsubscribing:', err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, [isSupported]);

    return {
        isSupported,
        permission,
        isSubscribed,
        loading,
        error,
        subscribe,
        unsubscribe
    };
};

/**
 * 將 Base64 URL 編碼轉換為 Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
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
}

export default usePushNotification;
