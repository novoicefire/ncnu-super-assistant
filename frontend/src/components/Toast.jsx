/**
 * Toast.jsx - 頂部 Toast 通知元件
 * 當有新通知時從頂部滑入
 */
import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faTimes } from '@fortawesome/free-solid-svg-icons';
import './Toast.css';

// Toast 管理器 - 用於從外部觸發 toast
let showToastExternal = null;

export const showToast = (notification) => {
    if (showToastExternal) {
        showToastExternal(notification);
    }
};

const Toast = () => {
    const [toasts, setToasts] = useState([]);

    // 新增 toast
    const addToast = useCallback((notification) => {
        const id = Date.now();
        const newToast = {
            id,
            title: notification.title,
            message: notification.message,
            type: notification.type || 'info'
        };

        setToasts(prev => [...prev, newToast]);

        // 5 秒後自動移除
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    }, []);

    // 移除 toast
    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    // 暴露給外部使用
    useEffect(() => {
        showToastExternal = addToast;
        return () => {
            showToastExternal = null;
        };
    }, [addToast]);

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <div key={toast.id} className={`toast toast-${toast.type}`}>
                    <div className="toast-icon">
                        <FontAwesomeIcon icon={faBell} />
                    </div>
                    <div className="toast-content">
                        <div className="toast-title">{toast.title}</div>
                        <div className="toast-message">{toast.message}</div>
                    </div>
                    <button
                        className="toast-close"
                        onClick={() => removeToast(toast.id)}
                        aria-label="關閉"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default Toast;
