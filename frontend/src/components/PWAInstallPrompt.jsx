/**
 * PWAInstallPrompt.jsx - PWA 安裝提示組件
 * 在 iOS Safari 上強制顯示安裝提示，用戶必須安裝後才能繼續使用
 */
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faShareFromSquare,
    faPlus,
    faMobileScreen,
    faBell,
    faArrowDown
} from '@fortawesome/free-solid-svg-icons';
import './PWAInstallPrompt.css';

/**
 * 檢測環境工具函數
 */
const detectEnvironment = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // 檢測 iOS（包括 iPad）
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

    // 檢測是否為 Safari（排除 Chrome 等其他瀏覽器）
    const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent);

    // 檢測是否已安裝為 PWA（從主畫面啟動）
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;

    // 檢測 iOS 版本
    const iOSVersion = (() => {
        const match = userAgent.match(/OS (\d+)_/);
        return match ? parseInt(match[1], 10) : 0;
    })();

    return {
        isIOS,
        isSafari,
        isPWA,
        iOSVersion,
        isIOSSafari: isIOS && isSafari,
        // iOS 16.4+ 才支援 Web Push
        supportsIOSPush: isIOS && iOSVersion >= 16
    };
};

const PWAInstallPrompt = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [environment, setEnvironment] = useState(null);
    const [step, setStep] = useState(1); // 安裝步驟引導

    useEffect(() => {
        const env = detectEnvironment();
        setEnvironment(env);

        // 只在 iOS Safari 且未安裝 PWA 時顯示強制提示
        if (env.isIOSSafari && !env.isPWA) {
            setShowPrompt(true);
        }
    }, []);

    // 如果不需要顯示提示，不渲染任何內容
    if (!showPrompt || !environment) {
        return null;
    }

    return (
        <div className="pwa-install-overlay">
            <div className="pwa-install-modal">
                {/* 標題區 */}
                <div className="pwa-install-header">
                    <div className="pwa-install-icon">
                        <img src="/logo.svg" alt="暨大助理" />
                    </div>
                    <h2>安裝「暨大生超級助理」App</h2>
                    <p className="pwa-install-subtitle">
                        為了獲得完整功能（包括<strong>推播通知</strong>），請先將本網站加入主畫面
                    </p>
                </div>

                {/* 功能說明 */}
                <div className="pwa-features">
                    <div className="pwa-feature">
                        <FontAwesomeIcon icon={faMobileScreen} />
                        <span>獨立 App 體驗</span>
                    </div>
                    <div className="pwa-feature">
                        <FontAwesomeIcon icon={faBell} />
                        <span>接收推播通知</span>
                    </div>
                </div>

                {/* 安裝步驟 */}
                <div className="pwa-install-steps">
                    <h3>安裝步驟</h3>

                    <div className={`pwa-step ${step === 1 ? 'active' : ''}`} onClick={() => setStep(1)}>
                        <div className="step-number">1</div>
                        <div className="step-content">
                            <p>點擊底部的 <strong>分享按鈕</strong></p>
                            <div className="step-icon-demo">
                                <FontAwesomeIcon icon={faShareFromSquare} className="share-icon" />
                                <FontAwesomeIcon icon={faArrowDown} className="arrow-icon bounce" />
                            </div>
                        </div>
                    </div>

                    <div className={`pwa-step ${step === 2 ? 'active' : ''}`} onClick={() => setStep(2)}>
                        <div className="step-number">2</div>
                        <div className="step-content">
                            <p>向下滑動並點擊 <strong>「加入主畫面」</strong></p>
                            <div className="step-icon-demo add-home">
                                <FontAwesomeIcon icon={faPlus} />
                                <span>加入主畫面</span>
                            </div>
                        </div>
                    </div>

                    <div className={`pwa-step ${step === 3 ? 'active' : ''}`} onClick={() => setStep(3)}>
                        <div className="step-number">3</div>
                        <div className="step-content">
                            <p>點擊右上角的 <strong>「新增」</strong></p>
                            <p className="step-hint">完成後請從主畫面開啟 App</p>
                        </div>
                    </div>
                </div>

                {/* iOS 版本提示 */}
                {environment.iOSVersion < 16 && (
                    <div className="pwa-ios-warning">
                        <p>⚠️ 您的 iOS 版本 ({environment.iOSVersion}) 不支援推播通知</p>
                        <p>請升級至 iOS 16.4 或更新版本以獲得完整功能</p>
                    </div>
                )}

                {/* 底部提示 */}
                <div className="pwa-install-footer">
                    <p>安裝完成後，此提示將自動消失</p>
                </div>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
