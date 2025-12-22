/**
 * PWAContext.jsx - PWA 安裝提示狀態管理
 * 
 * 用於跨組件共享 PWA 安裝提示的顯示狀態
 * - BottomNavBar 可以觸發顯示提示
 * - PWAInstallPrompt 可以觸發關閉動畫
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PWAContext = createContext();

// localStorage key 和過期時間（24小時）
const DISMISS_KEY = 'pwa_install_dismissed';
const DISMISS_DURATION = 24 * 60 * 60 * 1000;

/**
 * 檢測環境工具函數
 */
export const detectEnvironment = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isAndroid = /Android/i.test(userAgent);
    const isMobile = isIOS || isAndroid;
    const isDesktop = !isMobile;

    const isInAppBrowser = (
        /Line\//i.test(userAgent) ||
        /FBAN|FBAV|FB_IAB/i.test(userAgent) ||
        /Messenger/i.test(userAgent) ||
        /Instagram/i.test(userAgent) ||
        /Twitter/i.test(userAgent) ||
        /MicroMessenger/i.test(userAgent) ||
        (/wv/i.test(userAgent) && isAndroid)
    );

    const isIOSSafari = isIOS && /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(userAgent);
    const isAndroidChrome = isAndroid && /Chrome/i.test(userAgent) && !isInAppBrowser;
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    const iOSVersion = (() => {
        const match = userAgent.match(/OS (\d+)_/);
        return match ? parseInt(match[1], 10) : 0;
    })();

    return {
        isIOS, isAndroid, isMobile, isDesktop, isInAppBrowser,
        isIOSSafari, isAndroidChrome, isPWA, iOSVersion,
        supportsIOSPush: isIOS && iOSVersion >= 16
    };
};

export const usePWA = () => {
    const context = useContext(PWAContext);
    if (!context) {
        throw new Error('usePWA must be used within a PWAProvider');
    }
    return context;
};

export const PWAProvider = ({ children }) => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [environment, setEnvironment] = useState(null);
    const [canShow, setCanShow] = useState(false);

    // 初始化環境檢測
    useEffect(() => {
        const env = detectEnvironment();
        setEnvironment(env);

        // 判斷是否可以顯示 PWA 提示
        if (env.isPWA || env.isDesktop) {
            setCanShow(false);
            return;
        }

        // 檢查是否已跳過（24小時內）
        const dismissedTime = localStorage.getItem(DISMISS_KEY);
        if (dismissedTime) {
            const elapsed = Date.now() - parseInt(dismissedTime, 10);
            if (elapsed < DISMISS_DURATION) {
                setCanShow(true); // 可以在「更多」選單中顯示按鈕
                setShowPrompt(false);
                return;
            } else {
                localStorage.removeItem(DISMISS_KEY);
            }
        }

        // 符合條件，可以顯示
        const shouldShow = env.isInAppBrowser || env.isIOSSafari || env.isAndroidChrome;
        setCanShow(shouldShow);
        setShowPrompt(shouldShow);
    }, []);

    // 顯示提示（從「更多」選單觸發）
    const openPrompt = useCallback(() => {
        setShowPrompt(true);
        setIsAnimatingOut(false);
    }, []);

    // 帶動畫關閉提示
    const closeWithAnimation = useCallback(() => {
        setIsAnimatingOut(true);
        // 動畫結束後隱藏
        setTimeout(() => {
            setShowPrompt(false);
            setIsAnimatingOut(false);
            // 記錄跳過時間
            localStorage.setItem(DISMISS_KEY, Date.now().toString());
        }, 400);
    }, []);

    // 直接關閉（不帶動畫）
    const closePrompt = useCallback(() => {
        setShowPrompt(false);
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }, []);

    const value = {
        showPrompt,
        isAnimatingOut,
        environment,
        canShow,
        openPrompt,
        closeWithAnimation,
        closePrompt
    };

    return (
        <PWAContext.Provider value={value}>
            {children}
        </PWAContext.Provider>
    );
};
