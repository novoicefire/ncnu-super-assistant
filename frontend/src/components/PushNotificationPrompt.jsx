/**
 * PushNotificationPrompt.jsx - 推播通知訂閱提示
 * iOS Safari PWA 需要用戶手動點擊按鈕才能觸發權限請求
 */
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faXmark, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../AuthContext.jsx';
import { usePushNotification } from '../hooks/usePushNotification.js';
import './PushNotificationPrompt.css';

const PushNotificationPrompt = () => {
    const { user, isLoggedIn } = useAuth();
    const { isSupported, permission, isSubscribed, subscribe, loading, error } = usePushNotification();
    const [dismissed, setDismissed] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // 檢測 iOS PWA 模式
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;

    // 檢查是否應該顯示提示
    const shouldShow = isLoggedIn
        && isSupported
        && !isSubscribed
        && permission !== 'denied'
        && !dismissed
        && !showSuccess
        // iOS 必須在 PWA 模式才顯示
        && (!isIOS || isPWA);

    // 從 localStorage 檢查是否已經 dismissed
    useEffect(() => {
        const wasDismissed = localStorage.getItem('push_prompt_dismissed');
        if (wasDismissed === 'true') {
            setDismissed(true);
        }
    }, []);

    const handleSubscribe = async () => {
        const success = await subscribe();
        if (success) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem('push_prompt_dismissed', 'true');
    };

    // 已經訂閱或顯示成功訊息
    if (showSuccess) {
        return (
            <div className="push-prompt success">
                <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
                <span>推播通知已開啟！</span>
            </div>
        );
    }

    if (!shouldShow) {
        return null;
    }

    return (
        <div className="push-prompt">
            <div className="push-prompt-content">
                <div className="push-prompt-icon">
                    <FontAwesomeIcon icon={faBell} />
                </div>
                <div className="push-prompt-text">
                    <p className="prompt-title">開啟推播通知</p>
                    <p className="prompt-desc">接收重要公告和更新</p>
                </div>
                <button
                    className="push-prompt-btn"
                    onClick={handleSubscribe}
                    disabled={loading}
                >
                    {loading ? '處理中...' : '開啟'}
                </button>
                <button
                    className="push-prompt-close"
                    onClick={handleDismiss}
                    aria-label="關閉"
                >
                    <FontAwesomeIcon icon={faXmark} />
                </button>
            </div>
            {error && <p className="push-error">{error}</p>}
        </div>
    );
};

export default PushNotificationPrompt;
