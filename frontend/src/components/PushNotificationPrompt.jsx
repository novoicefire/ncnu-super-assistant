/**
 * PushNotificationPrompt.jsx - 推播通知訂閱提示（強制版）
 * iOS Safari PWA 需要用戶手動點擊按鈕才能觸發權限請求
 * 用戶必須開啟推播才能繼續使用
 */
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheckCircle, faMobileScreen, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../AuthContext.jsx';
import { usePushNotification } from '../hooks/usePushNotification.js';
import './PushNotificationPrompt.css';

const PushNotificationPrompt = () => {
    const { isLoggedIn } = useAuth();
    const { isSupported, permission, isSubscribed, subscribe, loading, error } = usePushNotification();
    const [showSuccess, setShowSuccess] = useState(false);

    // 檢測 iOS PWA 模式
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;

    // 檢查是否應該顯示強制提示
    const shouldShow = isLoggedIn
        && isSupported
        && !isSubscribed
        && permission !== 'denied'
        && !showSuccess
        // iOS 必須在 PWA 模式才顯示
        && (!isIOS || isPWA);

    const handleSubscribe = async () => {
        const success = await subscribe();
        if (success) {
            setShowSuccess(true);
            // 3秒後自動關閉
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };

    // 已經訂閱成功
    if (showSuccess) {
        return (
            <div className="push-overlay success-overlay">
                <div className="push-success-modal">
                    <FontAwesomeIcon icon={faCheckCircle} className="success-icon-large" />
                    <h2>推播通知已開啟！</h2>
                    <p>您將收到重要公告和更新通知</p>
                </div>
            </div>
        );
    }

    if (!shouldShow) {
        return null;
    }

    return (
        <div className="push-overlay">
            <div className="push-modal">
                {/* 圖示 */}
                <div className="push-modal-icon">
                    <FontAwesomeIcon icon={faBell} />
                </div>

                {/* 標題 */}
                <h2>開啟推播通知</h2>
                <p className="push-modal-subtitle">
                    為了讓您不錯過重要公告，請開啟推播通知
                </p>

                {/* 功能說明 */}
                <div className="push-features">
                    <div className="push-feature">
                        <FontAwesomeIcon icon={faMobileScreen} />
                        <span>即時接收重要公告</span>
                    </div>
                    <div className="push-feature">
                        <FontAwesomeIcon icon={faBell} />
                        <span>課程異動提醒</span>
                    </div>
                </div>

                {/* 錯誤訊息 */}
                {error && (
                    <div className="push-error-box">
                        <p>{error}</p>
                    </div>
                )}

                {/* 開啟按鈕 */}
                <button
                    className="push-enable-btn"
                    onClick={handleSubscribe}
                    disabled={loading}
                >
                    {loading ? (
                        '處理中...'
                    ) : (
                        <>
                            開啟推播通知
                            <FontAwesomeIcon icon={faArrowRight} />
                        </>
                    )}
                </button>

                {/* 權限被拒絕時的提示 */}
                {permission === 'denied' && (
                    <p className="push-denied-hint">
                        推播權限已被封鎖，請到系統設定中手動開啟
                    </p>
                )}
            </div>
        </div>
    );
};

export default PushNotificationPrompt;
