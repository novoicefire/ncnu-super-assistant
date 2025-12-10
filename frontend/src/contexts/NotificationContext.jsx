/**
 * NotificationContext.jsx - 通知狀態管理 Context
 * 提供全域通知狀態、即時更新（Supabase Realtime）
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext.jsx';

// 建立 Context
const NotificationContext = createContext(null);

// API 基礎路徑
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Supabase Realtime 設定
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * NotificationProvider - 通知狀態提供者
 */
export const NotificationProvider = ({ children }) => {
    const { user, isLoggedIn } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [newNotification, setNewNotification] = useState(null); // 新通知彈出框

    // 計算未讀數量
    useEffect(() => {
        const count = notifications.filter(n => !n.read).length;
        setUnreadCount(count);
    }, [notifications]);

    // 取得通知列表
    const fetchNotifications = useCallback(async () => {
        if (!isLoggedIn || !user?.google_id) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_BASE}/api/notifications?user_id=${user.google_id}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }

            const data = await response.json();
            setNotifications(data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn, user]);

    // 標記單一通知為已讀
    const markAsRead = useCallback(async (notificationId) => {
        if (!user?.google_id) return;

        try {
            const response = await fetch(
                `${API_BASE}/api/notifications/${notificationId}/read?user_id=${user.google_id}`,
                { method: 'PUT' }
            );

            if (!response.ok) {
                throw new Error('Failed to mark as read');
            }

            // 更新本地狀態
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    }, [user]);

    // 標記所有通知為已讀
    const markAllAsRead = useCallback(async () => {
        if (!user?.google_id) return;

        try {
            const response = await fetch(
                `${API_BASE}/api/notifications/read-all?user_id=${user.google_id}`,
                { method: 'PUT' }
            );

            if (!response.ok) {
                throw new Error('Failed to mark all as read');
            }

            // 更新本地狀態
            setNotifications(prev =>
                prev.map(n => ({ ...n, read: true }))
            );
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    }, [user]);

    // 設定 Supabase Realtime 訂閱
    useEffect(() => {
        if (!isLoggedIn || !user?.google_id) return;
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('Supabase Realtime not configured, falling back to polling');
            // 降級為每 30 秒輪詢
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }

        // 初始載入
        fetchNotifications();

        // 建立 Realtime 連線
        let channel = null;

        const setupRealtime = async () => {
            try {
                const { createClient } = await import('@supabase/supabase-js');
                const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

                channel = supabase
                    .channel('notifications-changes')
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'notifications'
                            // 不使用 filter，訂閱所有 INSERT 事件
                        },
                        (payload) => {
                            const newNotif = payload.new;
                            console.log('Realtime: New notification received:', newNotif);

                            // 手動過濾：只接收屬於當前用戶的通知或全站通知 (user_id = null)
                            if (newNotif.user_id === null || newNotif.user_id === user.google_id) {
                                console.log('Realtime: Notification matched, showing popup');
                                // 避免重複：只有當通知不存在時才新增
                                setNotifications(prev => {
                                    const exists = prev.some(n => n.id === newNotif.id);
                                    if (exists) {
                                        console.log('Realtime: Notification already exists, skipping');
                                        return prev;
                                    }
                                    return [newNotif, ...prev];
                                });
                                // 設定 newNotification 供 UI 顯示彈出框
                                setNewNotification(newNotif);
                                // 5 秒後自動清除
                                setTimeout(() => setNewNotification(null), 5000);
                            } else {
                                console.log('Realtime: Notification not for this user, ignoring');
                            }
                        }
                    )
                    .subscribe((status) => {
                        console.log('Realtime subscription status:', status);
                    });
            } catch (err) {
                console.error('Error setting up Realtime:', err);
                // 降級為輪詢
                const interval = setInterval(fetchNotifications, 30000);
                return () => clearInterval(interval);
            }
        };

        setupRealtime();

        return () => {
            if (channel) {
                channel.unsubscribe();
            }
        };
    }, [isLoggedIn, user, fetchNotifications]);

    // 清除新通知彈出框
    const dismissNewNotification = useCallback(() => {
        setNewNotification(null);
    }, []);

    // Context 值
    const value = {
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        newNotification,
        dismissNewNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

/**
 * useNotifications - 取得通知 Context 的 Hook
 */
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export default NotificationContext;
