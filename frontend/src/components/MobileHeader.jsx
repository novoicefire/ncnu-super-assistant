/**
 * MobileHeader.jsx - 手機版頂部標題欄（重新設計佈局）
 * 左側：翻譯 + 深色模式
 * 中間：Logo 與品牌名定時輪調
 * 右側：通知 + 用戶
 */
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useNotifications } from '../contexts/NotificationContext.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMoon,
    faSun,
    faGlobe,
    faBell,
    faArrowRightFromBracket,
    faCheckCircle,
    faInfoCircle,
    faExclamationTriangle,
    faXmark,
    faGear
} from '@fortawesome/free-solid-svg-icons';
import './MobileHeader.css';

// 語言選項
const languages = [
    { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
];

// 管理員 email 列表
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim());

const MobileHeader = () => {
    const { t, i18n } = useTranslation();
    const { isLoggedIn, user, logout, isLoading, handleGoogleLogin } = useAuth();
    const { theme, toggleTheme } = useTheme();
    // 使用真實通知 Context
    const { notifications, unreadCount, markAsRead, markAllAsRead, newNotification, dismissNewNotification } = useNotifications();

    // 檢查是否為管理員
    const isAdmin = isLoggedIn && user?.email && ADMIN_EMAILS.includes(user.email);

    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showLogo, setShowLogo] = useState(false); // false=先顯示品牌名，15秒後切換為Logo
    const langRef = useRef(null);
    const notificationRef = useRef(null);
    const userRef = useRef(null);

    // 進入網站15秒後從品牌名切換為Logo（只執行一次）
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowLogo(true);
        }, 15000); // 15秒
        return () => clearTimeout(timer);
    }, []);

    // 點擊外部關閉
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (langRef.current && !langRef.current.contains(event.target)) {
                setShowLangMenu(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (userRef.current && !userRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Google 登入按鈕
    const GoogleLoginButton = () => {
        const buttonDiv = useRef(null);

        useEffect(() => {
            const currentButtonDiv = buttonDiv.current;
            if (window.google && currentButtonDiv) {
                window.google.accounts.id.initialize({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                    callback: handleGoogleLogin,
                });
                window.google.accounts.id.renderButton(
                    currentButtonDiv,
                    {
                        theme: "outline",
                        size: "medium",
                        shape: "pill",
                        text: "signin"
                    }
                );
            }
            return () => {
                if (currentButtonDiv) {
                    currentButtonDiv.innerHTML = "";
                }
            };
        }, []);

        return <div ref={buttonDiv} className="google-login-mobile"></div>;
    };

    const handleLanguageChange = (langCode) => {
        i18n.changeLanguage(langCode);
        setShowLangMenu(false);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success': return { icon: faCheckCircle, color: '#10b981' };
            case 'warning': return { icon: faExclamationTriangle, color: '#f59e0b' };
            case 'error': return { icon: faXmark, color: '#ef4444' };
            default: return { icon: faInfoCircle, color: '#3b82f6' };
        }
    };

    const currentLang = i18n.language;

    return (
        <header className="mobile-header modern">
            {/* ===== 左側：翻譯 + 深色模式 ===== */}
            <div className="mobile-header-left">
                {/* 語言切換 */}
                <div className="lang-wrapper" ref={langRef}>
                    <button
                        className="mobile-icon-btn"
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        title={t('header.language')}
                    >
                        <FontAwesomeIcon icon={faGlobe} />
                    </button>

                    {showLangMenu && (
                        <div className="lang-dropdown">
                            {languages.map(lang => (
                                <button
                                    key={lang.code}
                                    className={`lang-option ${lang.code === currentLang ? 'active' : ''}`}
                                    onClick={() => handleLanguageChange(lang.code)}
                                >
                                    <span className="lang-flag">{lang.flag}</span>
                                    <span className="lang-name">{lang.name}</span>
                                    {lang.code === currentLang && (
                                        <FontAwesomeIcon icon={faCheckCircle} className="lang-check" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 主題切換 */}
                <button
                    className="mobile-icon-btn"
                    onClick={toggleTheme}
                    title={theme === 'light' ? t('header.switchToDark') : t('header.switchToLight')}
                >
                    <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
                </button>
            </div>

            {/* ===== 中間：Logo/品牌名輪調 ===== */}
            <div className="mobile-brand-center">
                <div className={`brand-flipper ${showLogo ? 'show-logo' : 'show-text'}`}>
                    <img
                        src="/logo.svg"
                        alt="Logo"
                        className="mobile-logo-flip"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span className="mobile-brand-flip">{t('header.brandFull')}</span>
                </div>
            </div>

            {/* ===== 右側：通知 + 用戶 ===== */}
            <div className="mobile-header-right">
                {/* 通知按鈕 */}
                <div className="notification-wrapper" ref={notificationRef}>
                    <button
                        className="mobile-icon-btn notification-btn"
                        onClick={() => setShowNotifications(!showNotifications)}
                        title={t('header.notifications')}
                    >
                        <FontAwesomeIcon icon={faBell} />
                        {unreadCount > 0 && (
                            <span className="notification-badge">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* 新通知彈出框 */}
                    {newNotification && (() => {
                        const iconConfig = getNotificationIcon(newNotification.type);
                        return (
                            <div className="new-notification-popup">
                                <div className="popup-content">
                                    <FontAwesomeIcon icon={iconConfig.icon} className="popup-icon" style={{ color: iconConfig.color }} />
                                    <div className="popup-text">
                                        <div className="popup-title">{newNotification.title}</div>
                                        <div className="popup-message">{newNotification.message}</div>
                                    </div>
                                    <button className="popup-close" onClick={dismissNewNotification}>
                                        <FontAwesomeIcon icon={faXmark} />
                                    </button>
                                </div>
                            </div>
                        );
                    })()}

                    {showNotifications && (
                        <div className="notification-dropdown">
                            <div className="dropdown-header">
                                <span className="dropdown-title">{t('header.notifications')}</span>
                                {unreadCount > 0 && (
                                    <button
                                        className="mark-all-read"
                                        onClick={markAllAsRead}
                                    >
                                        {t('header.markAllRead')}
                                    </button>
                                )}
                            </div>
                            <div className="notification-list">
                                {notifications.length === 0 ? (
                                    <div className="empty-notifications">
                                        <FontAwesomeIcon icon={faBell} />
                                        <p>{t('header.noNotifications')}</p>
                                    </div>
                                ) : (
                                    notifications.map((notification) => {
                                        const iconConfig = getNotificationIcon(notification.type);
                                        return (
                                            <div
                                                key={notification.id}
                                                className={`notification-item ${notification.read ? 'read' : ''}`}
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                <div
                                                    className="notification-icon"
                                                    style={{ color: iconConfig.color }}
                                                >
                                                    <FontAwesomeIcon icon={iconConfig.icon} />
                                                </div>
                                                <div className="notification-content">
                                                    <span className="notification-title">{notification.title}</span>
                                                    <span className="notification-message">{notification.message}</span>
                                                    <span className="notification-time">
                                                        {notification.created_at
                                                            ? new Date(notification.created_at).toLocaleString('zh-TW')
                                                            : ''}
                                                    </span>
                                                </div>
                                                {!notification.read && <div className="unread-dot" />}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            {/* 管理員連結 */}
                            {isAdmin && (
                                <Link
                                    to="/admin/notifications"
                                    className="admin-link"
                                    onClick={() => setShowNotifications(false)}
                                >
                                    <FontAwesomeIcon icon={faGear} />
                                    管理通知
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* 用戶區域 */}
                {isLoading ? (
                    <span className="loading-dot">•••</span>
                ) : isLoggedIn && user ? (
                    <div className="mobile-user-wrapper" ref={userRef}>
                        <button
                            className="mobile-avatar-btn"
                            onClick={() => setShowUserMenu(!showUserMenu)}
                        >
                            <img
                                src={user.avatar_url}
                                alt={user.full_name}
                                className="mobile-avatar"
                            />
                        </button>
                        {showUserMenu && (
                            <div className="user-dropdown">
                                <div className="user-info">
                                    <span className="user-name">{user.full_name}</span>
                                    <span className="user-email">{user.email}</span>
                                </div>
                                <button
                                    onClick={() => { logout(); setShowUserMenu(false); }}
                                    className="logout-dropdown-btn"
                                >
                                    <FontAwesomeIcon icon={faArrowRightFromBracket} />
                                    {t('common.logout')}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <GoogleLoginButton />
                )}
            </div>
        </header>
    );
};

export default MobileHeader;
