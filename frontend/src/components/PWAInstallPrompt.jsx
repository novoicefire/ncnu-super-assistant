/**
 * PWAInstallPrompt.jsx - PWA 安裝提示組件
 * 
 * 功能：
 * 1. iOS Safari：顯示建議安裝引導（可跳過）
 * 2. Android Chrome：顯示建議安裝引導 + 原生安裝按鈕（可跳過）
 * 3. 應用內瀏覽器（LINE、IG、Messenger 等）：引導用戶使用原生瀏覽器開啟（可跳過）
 * 4. Desktop：不顯示任何提示
 * 5. 用戶跳過後可從「更多」選單再次開啟
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faShareFromSquare,
    faMobileScreen,
    faBell,
    faGlobe,
    faCopy,
    faCheck,
    faEllipsisVertical,
    faArrowUpRightFromSquare,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import { usePWA } from '../contexts/PWAContext';
import './PWAInstallPrompt.css';

const PWAInstallPrompt = () => {
    const { t } = useTranslation();
    const { showPrompt, isAnimatingOut, environment, closeWithAnimation } = usePWA();
    const [linkCopied, setLinkCopied] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    // 計算 promptType
    const getPromptType = () => {
        if (!environment) return null;
        if (environment.isPWA || environment.isDesktop) return null;
        if (environment.isInAppBrowser) return 'inApp';
        if (environment.isIOSSafari) return 'iosSafari';
        if (environment.isAndroidChrome) return 'androidChrome';
        return null;
    };

    const promptType = getPromptType();

    // 監聽 beforeinstallprompt 事件（用於 Android Chrome）
    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        const handleAppInstalled = () => {
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
    if (!showPrompt || !promptType || !environment) {
        return null;
    }

    // 應用內瀏覽器提示：引導用戶使用原生瀏覽器開啟
    if (promptType === 'inApp') {
        return (
            <div className={`pwa-install-overlay ${isAnimatingOut ? 'pwa-flyout' : ''}`}>
                <div className="pwa-install-modal">
                    {/* 關閉按鈕 */}
                    <button className="pwa-dismiss-btn" onClick={closeWithAnimation} aria-label="關閉">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                    {/* 標題區 */}
                    <div className="pwa-install-header">
                        <div className="pwa-install-icon warning-icon">
                            <FontAwesomeIcon icon={faGlobe} />
                        </div>
                        <div className="pwa-install-header-text">
                            <h2>{t('pwa.openBrowserTitle', '請使用瀏覽器開啟')}</h2>
                            <p className="pwa-install-subtitle">
                                {environment.isIOS
                                    ? t('pwa.openInSafariShort', '複製連結到 Safari 瀏覽器開啟')
                                    : t('pwa.openInChromeShort', '複製連結到 Chrome 瀏覽器開啟')
                                }
                            </p>
                        </div>
                    </div>
                    {/* 複製連結按鈕 */}
                    <button
                        className={`copy-link-btn ${linkCopied ? 'copied' : ''}`}
                        onClick={handleCopyLink}
                    >
                        <FontAwesomeIcon icon={linkCopied ? faCheck : faCopy} />
                        <span>{linkCopied ? t('pwa.linkCopied', '已複製！') : t('pwa.copyLink', '複製連結')}</span>
                    </button>
                </div>
            </div>
        );
    }

    // iOS Safari 安裝引導
    if (promptType === 'iosSafari') {
        return (
            <div className={`pwa-install-overlay ${isAnimatingOut ? 'pwa-flyout' : ''}`}>
                <div className="pwa-install-modal">
                    {/* 關閉按鈕 */}
                    <button className="pwa-dismiss-btn" onClick={closeWithAnimation} aria-label="關閉">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                    {/* 標題區 */}
                    <div className="pwa-install-header">
                        <div className="pwa-install-icon">
                            <img src="/logo.svg" alt="暨大生超級助理" />
                        </div>
                        <div className="pwa-install-header-text">
                            <h2>{t('pwa.installTitleShort', '加入主畫面')}</h2>
                            <p className="pwa-install-subtitle">
                                {t('pwa.iosInstallHint', '點擊底部')} <FontAwesomeIcon icon={faShareFromSquare} style={{ color: '#007AFF' }} /> {t('pwa.iosInstallHint2', '→「加入主畫面」')}
                            </p>
                        </div>
                    </div>
                    {/* 功能說明 */}
                    <div className="pwa-features-inline">
                        <span><FontAwesomeIcon icon={faMobileScreen} /> {t('pwa.featureAppShort', '獨立 App')}</span>
                        <span><FontAwesomeIcon icon={faBell} /> {t('pwa.featurePushShort', '推播通知')}</span>
                    </div>
                </div>
            </div>
        );
    }

    // Android Chrome 安裝引導
    if (promptType === 'androidChrome') {
        return (
            <div className={`pwa-install-overlay ${isAnimatingOut ? 'pwa-flyout' : ''}`}>
                <div className="pwa-install-modal">
                    {/* 關閉按鈕 */}
                    <button className="pwa-dismiss-btn" onClick={closeWithAnimation} aria-label="關閉">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                    {/* 標題區 */}
                    <div className="pwa-install-header">
                        <div className="pwa-install-icon">
                            <img src="/logo.svg" alt="暨大生超級助理" />
                        </div>
                        <div className="pwa-install-header-text">
                            <h2>{t('pwa.installTitleShort', '加入主畫面')}</h2>
                            <p className="pwa-install-subtitle">
                                {t('pwa.androidInstallHint', '獲得完整 App 體驗與推播通知')}
                            </p>
                        </div>
                    </div>
                    {/* 安裝按鈕 */}
                    {deferredPrompt ? (
                        <button className="install-btn" onClick={handleInstallClick}>
                            <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                            <span>{t('pwa.installNow', '立即安裝')}</span>
                        </button>
                    ) : (
                        <div className="pwa-android-hint">
                            <p>
                                {t('pwa.androidManualHint', '點擊右上角')} <FontAwesomeIcon icon={faEllipsisVertical} /> {t('pwa.androidManualHint2', '→「安裝應用程式」')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
};

export default PWAInstallPrompt;

