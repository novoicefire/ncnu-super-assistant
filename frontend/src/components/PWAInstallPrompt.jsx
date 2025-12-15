/**
 * PWAInstallPrompt.jsx - PWA 安裝提示組件
 * 
 * 功能：
 * 1. iOS Safari：顯示強制安裝引導
 * 2. Android Chrome：顯示強制安裝引導 + 原生安裝按鈕
 * 3. 應用內瀏覽器（LINE、IG、Messenger 等）：引導用戶使用原生瀏覽器開啟
 * 4. Desktop：不顯示任何提示
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faShareFromSquare,
    faPlus,
    faMobileScreen,
    faBell,
    faArrowDown,
    faGlobe,
    faCopy,
    faCheck,
    faEllipsisVertical,
    faArrowUpRightFromSquare
} from '@fortawesome/free-solid-svg-icons';
import './PWAInstallPrompt.css';

/**
 * 檢測環境工具函數
 */
const detectEnvironment = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // 檢測 iOS（包括 iPad）
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

    // 檢測 Android
    const isAndroid = /Android/i.test(userAgent);

    // 檢測是否為手機（iOS 或 Android）
    const isMobile = isIOS || isAndroid;

    // 檢測是否為 Desktop
    const isDesktop = !isMobile;

    // 檢測應用內瀏覽器（LINE、Facebook、Messenger、Instagram、Twitter、微信等）
    const isInAppBrowser = (
        /Line\//i.test(userAgent) ||                    // LINE
        /FBAN|FBAV|FB_IAB/i.test(userAgent) ||          // Facebook
        /Messenger/i.test(userAgent) ||                 // Messenger
        /Instagram/i.test(userAgent) ||                 // Instagram
        /Twitter/i.test(userAgent) ||                   // Twitter/X
        /MicroMessenger/i.test(userAgent) ||            // 微信
        (/wv/i.test(userAgent) && isAndroid)            // Android WebView
    );

    // 檢測是否為 Safari（iOS 原生瀏覽器，排除其他瀏覽器）
    const isIOSSafari = isIOS && /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(userAgent);

    // 檢測是否為 Android Chrome（排除 WebView 和應用內瀏覽器）
    const isAndroidChrome = isAndroid && /Chrome/i.test(userAgent) && !isInAppBrowser;

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
        isAndroid,
        isMobile,
        isDesktop,
        isInAppBrowser,
        isIOSSafari,
        isAndroidChrome,
        isPWA,
        iOSVersion,
        // iOS 16.4+ 才支援 Web Push
        supportsIOSPush: isIOS && iOSVersion >= 16
    };
};

const PWAInstallPrompt = () => {
    const { t } = useTranslation();
    const [environment, setEnvironment] = useState(null);
    const [promptType, setPromptType] = useState(null); // 'inApp' | 'iosSafari' | 'androidChrome' | null
    const [step, setStep] = useState(1); // 安裝步驟引導
    const [linkCopied, setLinkCopied] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        const env = detectEnvironment();
        setEnvironment(env);

        // 已安裝 PWA 或是 Desktop，不顯示任何提示
        if (env.isPWA || env.isDesktop) {
            setPromptType(null);
            return;
        }

        // 應用內瀏覽器：引導用戶使用原生瀏覽器開啟
        if (env.isInAppBrowser) {
            setPromptType('inApp');
            return;
        }

        // iOS Safari：顯示安裝引導
        if (env.isIOSSafari) {
            setPromptType('iosSafari');
            return;
        }

        // Android Chrome：顯示安裝引導
        if (env.isAndroidChrome) {
            setPromptType('androidChrome');
            return;
        }

        // 其他情況（例如 Firefox、其他瀏覽器）：不顯示提示
        setPromptType(null);
    }, []);

    // 監聽 beforeinstallprompt 事件（用於 Android Chrome）
    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // 監聽 appinstalled 事件
        const handleAppInstalled = () => {
            setPromptType(null);
            setDeferredPrompt(null);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    // 處理 Android 安裝按鈕點擊
    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('使用者接受安裝 PWA');
            }
        } catch (error) {
            console.error('安裝 PWA 失敗:', error);
        }

        setDeferredPrompt(null);
    };

    // 複製連結到剪貼簿
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch (error) {
            console.error('複製連結失敗:', error);
            // Fallback: 使用舊版 API
            const textArea = document.createElement('textarea');
            textArea.value = window.location.href;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        }
    };

    // 不需要顯示提示
    if (!promptType || !environment) {
        return null;
    }

    // 應用內瀏覽器提示：引導用戶使用原生瀏覽器開啟
    if (promptType === 'inApp') {
        return (
            <div className="pwa-install-overlay">
                <div className="pwa-install-modal">
                    {/* 標題區 */}
                    <div className="pwa-install-header">
                        <div className="pwa-install-icon warning-icon">
                            <FontAwesomeIcon icon={faGlobe} />
                        </div>
                        <h2>{t('pwa.openBrowserTitle', '請使用瀏覽器開啟')}</h2>
                        <p className="pwa-install-subtitle">
                            {t('pwa.openBrowserDesc', '本應用需要透過 Safari 或 Chrome 瀏覽器開啟才能正常使用')}
                        </p>
                    </div>

                    {/* 操作步驟 */}
                    <div className="pwa-install-steps">
                        <h3>{t('pwa.howToOpen', '如何開啟')}</h3>

                        <div className="pwa-step">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <p>{t('pwa.copyLinkStep', '複製以下連結')}</p>
                                <button
                                    className={`copy-link-btn ${linkCopied ? 'copied' : ''}`}
                                    onClick={handleCopyLink}
                                >
                                    <FontAwesomeIcon icon={linkCopied ? faCheck : faCopy} />
                                    <span>{linkCopied ? t('pwa.linkCopied', '已複製！') : t('pwa.copyLink', '複製連結')}</span>
                                </button>
                            </div>
                        </div>

                        <div className="pwa-step">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <p>
                                    {environment.isIOS
                                        ? t('pwa.openInSafari', '打開 Safari 瀏覽器，貼上連結')
                                        : t('pwa.openInChrome', '打開 Chrome 瀏覽器，貼上連結')
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 底部提示 */}
                    <div className="pwa-install-footer">
                        <p>{t('pwa.inAppBrowserNote', '應用內瀏覽器不支援完整功能')}</p>
                    </div>
                </div>
            </div>
        );
    }

    // iOS Safari 安裝引導
    if (promptType === 'iosSafari') {
        return (
            <div className="pwa-install-overlay">
                <div className="pwa-install-modal">
                    {/* 標題區 */}
                    <div className="pwa-install-header">
                        <div className="pwa-install-icon">
                            <img src="/logo.svg" alt="暨大生超級助理" />
                        </div>
                        <h2>{t('pwa.installTitle', '安裝「暨大生超級助理」App')}</h2>
                        <p className="pwa-install-subtitle">
                            {t('pwa.installSubtitle', '為了獲得完整功能（包括')}
                            <strong>{t('pwa.pushNotification', '推播通知')}</strong>
                            {t('pwa.installSubtitle2', '），請先將本網站加入主畫面')}
                        </p>
                    </div>

                    {/* 功能說明 */}
                    <div className="pwa-features">
                        <div className="pwa-feature">
                            <FontAwesomeIcon icon={faMobileScreen} />
                            <span>{t('pwa.featureApp', '獨立 App 體驗')}</span>
                        </div>
                        <div className="pwa-feature">
                            <FontAwesomeIcon icon={faBell} />
                            <span>{t('pwa.featurePush', '接收推播通知')}</span>
                        </div>
                    </div>

                    {/* 安裝步驟 */}
                    <div className="pwa-install-steps">
                        <h3>{t('pwa.installSteps', '安裝步驟')}</h3>

                        <div className={`pwa-step ${step === 1 ? 'active' : ''}`} onClick={() => setStep(1)}>
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <p>{t('pwa.iosStep1', '點擊底部的')}<strong>{t('pwa.shareButton', '分享按鈕')}</strong></p>
                                <div className="step-icon-demo">
                                    <FontAwesomeIcon icon={faShareFromSquare} className="share-icon" />
                                    <FontAwesomeIcon icon={faArrowDown} className="arrow-icon bounce" />
                                </div>
                            </div>
                        </div>

                        <div className={`pwa-step ${step === 2 ? 'active' : ''}`} onClick={() => setStep(2)}>
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <p>{t('pwa.iosStep2', '向下滑動並點擊')}<strong>{t('pwa.addToHomeScreen', '「加入主畫面」')}</strong></p>
                                <div className="step-icon-demo add-home">
                                    <FontAwesomeIcon icon={faPlus} />
                                    <span>{t('pwa.addToHomeScreenBtn', '加入主畫面')}</span>
                                </div>
                            </div>
                        </div>

                        <div className={`pwa-step ${step === 3 ? 'active' : ''}`} onClick={() => setStep(3)}>
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <p>{t('pwa.iosStep3', '點擊右上角的')}<strong>{t('pwa.addButton', '「新增」')}</strong></p>
                                <p className="step-hint">{t('pwa.iosStep3Hint', '完成後請從主畫面開啟 App')}</p>
                            </div>
                        </div>
                    </div>

                    {/* iOS 版本提示 */}
                    {environment.iOSVersion < 16 && (
                        <div className="pwa-ios-warning">
                            <p>⚠️ {t('pwa.iosVersionWarning', '您的 iOS 版本')} ({environment.iOSVersion}) {t('pwa.iosVersionWarning2', '不支援推播通知')}</p>
                            <p>{t('pwa.iosUpgradeHint', '請升級至 iOS 16.4 或更新版本以獲得完整功能')}</p>
                        </div>
                    )}

                    {/* 底部提示 */}
                    <div className="pwa-install-footer">
                        <p>{t('pwa.installComplete', '安裝完成後，從桌面開啟即可使用')}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Android Chrome 安裝引導
    if (promptType === 'androidChrome') {
        return (
            <div className="pwa-install-overlay">
                <div className="pwa-install-modal">
                    {/* 標題區 */}
                    <div className="pwa-install-header">
                        <div className="pwa-install-icon">
                            <img src="/logo.svg" alt="暨大生超級助理" />
                        </div>
                        <h2>{t('pwa.installTitle', '安裝「暨大生超級助理」App')}</h2>
                        <p className="pwa-install-subtitle">
                            {t('pwa.installSubtitle', '為了獲得完整功能（包括')}
                            <strong>{t('pwa.pushNotification', '推播通知')}</strong>
                            {t('pwa.installSubtitle2', '），請先將本網站加入主畫面')}
                        </p>
                    </div>

                    {/* 功能說明 */}
                    <div className="pwa-features">
                        <div className="pwa-feature">
                            <FontAwesomeIcon icon={faMobileScreen} />
                            <span>{t('pwa.featureApp', '獨立 App 體驗')}</span>
                        </div>
                        <div className="pwa-feature">
                            <FontAwesomeIcon icon={faBell} />
                            <span>{t('pwa.featurePush', '接收推播通知')}</span>
                        </div>
                    </div>

                    {/* 安裝按鈕（如果有 beforeinstallprompt 事件） */}
                    {deferredPrompt && (
                        <div className="pwa-install-action">
                            <button className="install-btn" onClick={handleInstallClick}>
                                <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                                <span>{t('pwa.installNow', '立即安裝')}</span>
                            </button>
                        </div>
                    )}

                    {/* 手動安裝步驟（如果沒有 beforeinstallprompt 事件） */}
                    {!deferredPrompt && (
                        <div className="pwa-install-steps">
                            <h3>{t('pwa.installSteps', '安裝步驟')}</h3>

                            <div className={`pwa-step ${step === 1 ? 'active' : ''}`} onClick={() => setStep(1)}>
                                <div className="step-number">1</div>
                                <div className="step-content">
                                    <p>{t('pwa.androidStep1', '點擊右上角')}<strong>{t('pwa.menuButton', '選單按鈕')}</strong></p>
                                    <div className="step-icon-demo">
                                        <FontAwesomeIcon icon={faEllipsisVertical} className="menu-icon" />
                                    </div>
                                </div>
                            </div>

                            <div className={`pwa-step ${step === 2 ? 'active' : ''}`} onClick={() => setStep(2)}>
                                <div className="step-number">2</div>
                                <div className="step-content">
                                    <p>{t('pwa.androidStep2', '選擇')}<strong>{t('pwa.installApp', '「安裝應用程式」')}</strong></p>
                                    <p className="step-hint">{t('pwa.androidStep2Hint', '或「加到主畫面」')}</p>
                                </div>
                            </div>

                            <div className={`pwa-step ${step === 3 ? 'active' : ''}`} onClick={() => setStep(3)}>
                                <div className="step-number">3</div>
                                <div className="step-content">
                                    <p>{t('pwa.androidStep3', '點擊')}<strong>{t('pwa.installConfirm', '「安裝」')}</strong>{t('pwa.androidStep3b', '確認')}</p>
                                    <p className="step-hint">{t('pwa.androidStep3Hint', '完成後請從主畫面開啟 App')}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 底部提示 */}
                    <div className="pwa-install-footer">
                        <p>{t('pwa.installComplete', '安裝完成後，從桌面開啟即可使用')}</p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default PWAInstallPrompt;
