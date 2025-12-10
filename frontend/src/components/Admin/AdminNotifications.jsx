/**
 * AdminNotifications.jsx - 管理員通知發送頁面
 * 提供管理員發送通知和推播的介面
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../AuthContext.jsx';
import { usePushNotification } from '../../hooks/usePushNotification.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBell,
    faPaperPlane,
    faCheckCircle,
    faInfoCircle,
    faExclamationTriangle,
    faXmark,
    faTrash,
    faMobileScreen,
    faGear
} from '@fortawesome/free-solid-svg-icons';
import './AdminNotifications.css';

// API 基礎路徑
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// 管理員 email 列表（從環境變數讀取）
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim());

const AdminNotifications = () => {
    const { t } = useTranslation();
    const { user, isLoggedIn } = useAuth();
    const { isSupported, permission, isSubscribed, subscribe, unsubscribe } = usePushNotification();

    // 檢查是否為管理員
    const isAdmin = isLoggedIn && user?.email && ADMIN_EMAILS.includes(user.email);

    // 表單狀態
    const [formData, setFormData] = useState({
        type: 'info',
        title: '',
        message: '',
        link: '',
        sendPush: false
    });

    // 已發送通知列表
    const [sentNotifications, setSentNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // 取得已發送通知列表
    useEffect(() => {
        if (isAdmin) {
            fetchSentNotifications();
        }
    }, [isAdmin]);

    const fetchSentNotifications = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/notifications/admin`);
            if (response.ok) {
                const data = await response.json();
                setSentNotifications(data);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    // 發送通知
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // 1. 建立網站通知
            const notifyResponse = await fetch(`${API_BASE}/api/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: formData.type,
                    title: formData.title,
                    message: formData.message,
                    link: formData.link || null,
                    user_id: null  // null = 全站通知
                })
            });

            if (!notifyResponse.ok) {
                throw new Error('建立通知失敗');
            }

            // 2. 如果勾選發送推播
            if (formData.sendPush) {
                const pushResponse = await fetch(`${API_BASE}/api/push/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: formData.title,
                        message: formData.message,
                        link: formData.link || '/'
                    })
                });

                if (!pushResponse.ok) {
                    console.warn('推播發送失敗，但網站通知已建立');
                }
            }

            setSuccess('通知發送成功！');
            setFormData({ type: 'info', title: '', message: '', link: '', sendPush: false });
            fetchSentNotifications();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 刪除通知
    const handleDelete = async (id) => {
        if (!window.confirm('確定要刪除這則通知嗎？')) return;

        try {
            const response = await fetch(`${API_BASE}/api/notifications/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setSentNotifications(prev => prev.filter(n => n.id !== id));
            }
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    // 如果未登入或非管理員
    if (!isLoggedIn) {
        return (
            <div className="admin-notifications unauthorized">
                <FontAwesomeIcon icon={faXmark} className="error-icon" />
                <h2>請先登入</h2>
                <p>您需要登入才能存取此頁面。</p>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="admin-notifications unauthorized">
                <FontAwesomeIcon icon={faXmark} className="error-icon" />
                <h2>權限不足</h2>
                <p>您沒有權限存取管理員頁面。</p>
                <p className="hint">請確認您的 email ({user?.email}) 已加入 VITE_ADMIN_EMAILS 環境變數。</p>
            </div>
        );
    }

    const getTypeIcon = (type) => {
        switch (type) {
            case 'success': return { icon: faCheckCircle, color: '#10b981' };
            case 'warning': return { icon: faExclamationTriangle, color: '#f59e0b' };
            case 'error': return { icon: faXmark, color: '#ef4444' };
            default: return { icon: faInfoCircle, color: '#3b82f6' };
        }
    };

    return (
        <div className="admin-notifications">
            <header className="admin-header">
                <div className="header-content">
                    <FontAwesomeIcon icon={faBell} className="header-icon" />
                    <h1>通知管理</h1>
                </div>
                <p className="admin-email">管理員：{user?.email}</p>
            </header>

            <div className="admin-content">
                {/* 發送通知表單 */}
                <section className="send-notification-section">
                    <h2><FontAwesomeIcon icon={faPaperPlane} /> 發送新通知</h2>

                    <form onSubmit={handleSubmit} className="notification-form">
                        {/* 通知類型 */}
                        <div className="form-group">
                            <label>通知類型</label>
                            <div className="type-selector">
                                {['info', 'success', 'warning', 'error'].map(type => {
                                    const iconInfo = getTypeIcon(type);
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            className={`type-btn ${formData.type === type ? 'active' : ''}`}
                                            onClick={() => setFormData(prev => ({ ...prev, type }))}
                                            style={{ '--type-color': iconInfo.color }}
                                        >
                                            <FontAwesomeIcon icon={iconInfo.icon} />
                                            <span>{type}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 標題 */}
                        <div className="form-group">
                            <label htmlFor="title">標題 *</label>
                            <input
                                id="title"
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="輸入通知標題"
                                required
                            />
                        </div>

                        {/* 內容 */}
                        <div className="form-group">
                            <label htmlFor="message">內容 *</label>
                            <textarea
                                id="message"
                                value={formData.message}
                                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                placeholder="輸入通知內容"
                                rows={3}
                                required
                            />
                        </div>

                        {/* 連結 */}
                        <div className="form-group">
                            <label htmlFor="link">點擊連結（選填）</label>
                            <input
                                id="link"
                                type="text"
                                value={formData.link}
                                onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                                placeholder="例如：/course-planner"
                            />
                        </div>

                        {/* 發送推播 */}
                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.sendPush}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sendPush: e.target.checked }))}
                                />
                                <FontAwesomeIcon icon={faMobileScreen} />
                                <span>同時發送瀏覽器推播通知</span>
                            </label>
                        </div>

                        {/* 錯誤/成功訊息 */}
                        {error && <div className="message error">{error}</div>}
                        {success && <div className="message success">{success}</div>}

                        {/* 送出按鈕 */}
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? '發送中...' : '發送通知'}
                            <FontAwesomeIcon icon={faPaperPlane} />
                        </button>
                    </form>
                </section>

                {/* 推播設定區 */}
                <section className="push-settings-section">
                    <h2><FontAwesomeIcon icon={faGear} /> 推播設定</h2>
                    <div className="push-status">
                        <p><strong>瀏覽器支援：</strong>{isSupported ? '✅ 支援' : '❌ 不支援'}</p>
                        <p><strong>權限狀態：</strong>{permission}</p>
                        <p><strong>訂閱狀態：</strong>{isSubscribed ? '✅ 已訂閱' : '❌ 未訂閱'}</p>
                    </div>
                    {isSupported && !isSubscribed && (
                        <button className="subscribe-btn" onClick={subscribe}>
                            訂閱推播通知
                        </button>
                    )}
                    {isSubscribed && (
                        <button className="unsubscribe-btn" onClick={unsubscribe}>
                            取消訂閱
                        </button>
                    )}
                </section>

                {/* 已發送通知列表 */}
                <section className="sent-notifications-section">
                    <h2><FontAwesomeIcon icon={faBell} /> 已發送通知 ({sentNotifications.length})</h2>

                    <div className="notifications-list">
                        {sentNotifications.length === 0 ? (
                            <div className="empty-state">
                                <FontAwesomeIcon icon={faBell} />
                                <p>尚無已發送的通知</p>
                            </div>
                        ) : (
                            sentNotifications.map(notification => {
                                const iconInfo = getTypeIcon(notification.type);
                                return (
                                    <div key={notification.id} className="notification-card">
                                        <div className="notification-icon" style={{ background: iconInfo.color }}>
                                            <FontAwesomeIcon icon={iconInfo.icon} />
                                        </div>
                                        <div className="notification-body">
                                            <h3>{notification.title}</h3>
                                            <p>{notification.message}</p>
                                            <span className="notification-meta">
                                                {new Date(notification.created_at).toLocaleString('zh-TW')}
                                                {notification.user_id ? ` • 個人通知` : ' • 全站通知'}
                                            </span>
                                        </div>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDelete(notification.id)}
                                            title="刪除通知"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AdminNotifications;
