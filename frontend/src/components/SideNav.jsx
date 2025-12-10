/**
 * SideNav.jsx - 電腦版左側垂直導航欄 + i18n + 語言切換 + 通知
 * 參考 eMenu Tokyo 設計，使用毛玻璃效果
 */
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useNotifications } from '../contexts/NotificationContext.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHouse,
    faCalendarDays,
    faGraduationCap,
    faAddressBook,
    faCalendar,
    faClipboardList,
    faMoon,
    faSun,
    faChevronLeft,
    faChevronRight,
    faArrowRightFromBracket,
    faBook,
    faGlobe,
    faBell,
    faCheckCircle,
    faInfoCircle,
    faExclamationTriangle,
    faXmark,
    faGear
} from '@fortawesome/free-solid-svg-icons';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import './SideNav.css';

// 語言選項
const languages = [
    { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
];

// 管理員 email 列表
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim());

const SideNav = ({ disclaimerAccepted }) => {
    const { t, i18n } = useTranslation();
    const { isLoggedIn, user, logout, isLoading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    // 使用真實通知 Context
    const { notifications, unreadCount, markAsRead, markAllAsRead, newNotification, dismissNewNotification } = useNotifications();
    const location = useLocation();
    // 檢查是否為管理員
    const isAdmin = isLoggedIn && user?.email && ADMIN_EMAILS.includes(user.email);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const langRef = useRef(null);
    const notificationRef = useRef(null);

    // 導航項目配置（使用翻譯 key）
    const navItems = [
        { path: '/', labelKey: 'nav.home', icon: faHouse },
        { path: '/course-planner', labelKey: 'nav.coursePlanner', icon: faCalendarDays },
        { path: '/tracker', labelKey: 'nav.progress', icon: faGraduationCap },
        { path: '/calendar', labelKey: 'nav.calendar', icon: faCalendar },
        { path: '/updates', labelKey: 'nav.updateLog', icon: faClipboardList },
    ];

    // 點擊外部關閉選單
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (langRef.current && !langRef.current.contains(event.target)) {
                setShowLangMenu(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    // Google 登入按鈕
    const GoogleLoginButton = () => {
        const { handleGoogleLogin } = useAuth();
        const buttonDiv = React.useRef(null);

        React.useEffect(() => {
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
                        size: isCollapsed ? "icon_only" : "medium",
                        shape: "pill",
                        text: "signin_with"
                    }
                );
            }

            return () => {
                if (currentButtonDiv) {
                    currentButtonDiv.innerHTML = "";
                }
            };
        }, [handleGoogleLogin, isCollapsed]);

        return <div ref={buttonDiv} className="google-login-btn"></div>;
    };

    return (
        <nav className={`side-nav ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Logo 區域 */}
            <div className="side-nav-header">
                <div className="brand-container">
                    <img
                        src="/logo.svg"
                        alt="Logo"
                        className="side-nav-logo"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    {!isCollapsed && (
                        <span className="brand-text">{t('header.brandFull')}</span>
                    )}
                </div>
                <button
                    className="collapse-btn"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? t('common.expand') : t('common.collapse')}
                >
                    <FontAwesomeIcon icon={isCollapsed ? faChevronRight : faChevronLeft} />
                </button>
            </div>

            {/* 導航連結 */}
            <div className="side-nav-links">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `side-nav-item ${isActive ? 'active' : ''}`
                        }
                        title={isCollapsed ? t(item.labelKey) : ''}
                    >
                        <FontAwesomeIcon icon={item.icon} className="nav-icon" />
                        {!isCollapsed && <span className="nav-label">{t(item.labelKey)}</span>}
                    </NavLink>
                ))}

                {/* IBS 專區外部連結 */}
                <a
                    href="https://solar-tuesday-ad1.notion.site/edb276ef8b5c4d05983a4a27c841a989?v=0e56c1269fd149aebe113ddff1c49d73"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="side-nav-item external-link"
                    title={isCollapsed ? t('nav.ibsZone') : ''}
                >
                    <FontAwesomeIcon icon={faBook} className="nav-icon" />
                    {!isCollapsed && (
                        <>
                            <span className="nav-label">{t('nav.ibsZone')}</span>
                            <span className="external-badge">↗</span>
                        </>
                    )}
                </a>

                {/* Instagram 聯繫/問題回報連結 */}
                <a
                    href="https://www.instagram.com/ncnu_super_assistant/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="side-nav-item external-link instagram-link"
                    title={isCollapsed ? t('nav.contactIG') : ''}
                >
                    <FontAwesomeIcon icon={faInstagram} className="nav-icon" />
                    {!isCollapsed && (
                        <>
                            <span className="nav-label">{t('nav.contactIG')}</span>
                            <span className="external-badge">↗</span>
                        </>
                    )}
                </a>
            </div>

            {/* 底部區域：工具按鈕 + 用戶資訊 */}
            <div className="side-nav-footer">
                {/* 語言切換 */}
                <div className="lang-wrapper-side" ref={langRef}>
                    <button
                        className="side-nav-tool-btn"
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        title={t('header.language')}
                    >
                        <FontAwesomeIcon icon={faGlobe} className="nav-icon" />
                        {!isCollapsed && <span className="nav-label">{t('header.language')}</span>}
                    </button>

                    {showLangMenu && (
                        <div className="side-lang-dropdown">
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

                {/* 通知按鈕 */}
                <div className="notification-wrapper-side" ref={notificationRef}>
                    <button
                        className="side-nav-tool-btn"
                        onClick={() => setShowNotifications(!showNotifications)}
                        title={t('header.notifications')}
                    >
                        <FontAwesomeIcon icon={faBell} className="nav-icon" />
                        {unreadCount > 0 && (
                            <span className="notification-badge-side">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                        {!isCollapsed && <span className="nav-label">{t('header.notifications')}</span>}
                    </button>

                    {/* 新通知彈出框 */}
                    {newNotification && (() => {
                        const iconConfig = getNotificationIcon(newNotification.type);
                        return (
                            <div className="new-notification-popup-side">
                                <div className="popup-content">
                                    <FontAwesomeIcon icon={iconConfig.icon} className="popup-icon" style={{ color: iconConfig.color }} />
                                    <div className="popup-text">
                                        <div className="popup-title">{newNotification.title}</div>
                                        <div className="popup-message">{newNotification.message}</div>
                                    </div>
                                    <button className="popup-close" onClick={dismissNewNotification}>
                                        ×
                                    </button>
                                </div>
                            </div>
                        );
                    })()}

                    {showNotifications && (
                        <div className="side-notification-dropdown">
                            <div className="notification-dropdown-header">
                                <span>{t('header.notifications')}</span>
                                {unreadCount > 0 && (
                                    <button className="mark-all-read" onClick={markAllAsRead}>
                                        {t('header.markAllRead')}
                                    </button>
                                )}
                            </div>
                            <div className="notification-list-side">
                                {notifications.length > 0 ? (
                                    notifications.map(notification => {
                                        const iconInfo = getNotificationIcon(notification.type);
                                        return (
                                            <div
                                                key={notification.id}
                                                className={`notification-item-side ${notification.read ? 'read' : ''}`}
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                <div className="notification-icon-side" style={{ color: iconInfo.color }}>
                                                    <FontAwesomeIcon icon={iconInfo.icon} />
                                                </div>
                                                <div className="notification-content-side">
                                                    <div className="notification-title-side">{notification.title}</div>
                                                    <div className="notification-message-side">{notification.message}</div>
                                                    <div className="notification-time-side">
                                                        {notification.created_at
                                                            ? new Date(notification.created_at).toLocaleString('zh-TW')
                                                            : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="empty-notifications-side">
                                        <FontAwesomeIcon icon={faBell} />
                                        <p>{t('header.noNotifications')}</p>
                                    </div>
                                )}
                            </div>
                            {/* 管理員連結 */}
                            {isAdmin && (
                                <Link
                                    to="/admin/notifications"
                                    className="admin-link-side"
                                    onClick={() => setShowNotifications(false)}
                                >
                                    <FontAwesomeIcon icon={faGear} />
                                    管理通知
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* 主題切換 */}
                <button
                    className="side-nav-tool-btn theme-toggle-btn"
                    onClick={toggleTheme}
                    title={theme === 'light' ? t('common.switchToDark') : t('common.switchToLight')}
                >
                    <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} className="nav-icon" />
                    {!isCollapsed && (
                        <span className="nav-label">
                            {theme === 'light' ? t('common.darkMode') : t('common.lightMode')}
                        </span>
                    )}
                </button>

                {/* 用戶區域 */}
                <div className="user-section">
                    {isLoading ? (
                        <div className="loading-text">{t('common.loading')}</div>
                    ) : isLoggedIn && user ? (
                        <div className={`user-info ${isCollapsed ? 'collapsed' : ''}`}>
                            <img
                                src={user.avatar_url}
                                alt={user.full_name}
                                className="user-avatar"
                                title={user.full_name}
                            />
                            {!isCollapsed && (
                                <div className="user-details">
                                    <span className="user-name">{user.full_name}</span>
                                    <button
                                        onClick={logout}
                                        className="logout-btn"
                                        title={t('common.logout')}
                                    >
                                        <FontAwesomeIcon icon={faArrowRightFromBracket} />
                                        <span>{t('common.logout')}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <GoogleLoginButton />
                    )}
                </div>
            </div>
        </nav>
    );
};

export default SideNav;
