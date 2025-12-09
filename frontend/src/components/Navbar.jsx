// frontend/src/components/Navbar.jsx (新方案：IBS按鈕統一放置於右側區域 + i18n)
import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import './Navbar.css';

const GoogleLoginButton = () => {
  const { handleGoogleLogin } = useAuth();
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
          size: "large",
          shape: "pill",
          text: "signin_with"
        }
      );

      window.google.accounts.id.prompt();
    }

    return () => {
      if (currentButtonDiv) {
        currentButtonDiv.innerHTML = "";
      }
    };
  }, [handleGoogleLogin]);

  return <div ref={buttonDiv}></div>;
};

const Navbar = ({ disclaimerAccepted }) => {
  const { t } = useTranslation();
  const { isLoggedIn, user, logout, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [showIBSAnimation, setShowIBSAnimation] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const mobileMenuRef = useRef(null);
  const menuToggleRef = useRef(null);

  // 路由變化時關閉手機選單
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // IBS 動畫邏輯
  useEffect(() => {
    if (disclaimerAccepted && !showIBSAnimation) {
      const timer = setTimeout(() => {
        setShowIBSAnimation(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [disclaimerAccepted, showIBSAnimation]);

  // 手機選單切換
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // 防止背景滾動
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // 點擊外部區域關閉選單
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isMobileMenuOpen) return;

      if (menuToggleRef.current && menuToggleRef.current.contains(event.target)) {
        return;
      }

      if (mobileMenuRef.current && mobileMenuRef.current.contains(event.target)) {
        return;
      }

      setIsMobileMenuOpen(false);
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <nav className="navbar">
      {/* 🎨 品牌區域 */}
      <div className="nav-brand-container">
        <button
          ref={menuToggleRef}
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label={t('common.toggleMenu')}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <img
          src="/logo.svg"
          alt={t('header.brandFull')}
          className="nav-logo"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="nav-brand">{t('header.brandFull')}</div>
      </div>

      {/* 導航連結區域 */}
      <div
        ref={mobileMenuRef}
        className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}
      >
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
          🏠 {t('nav.home')}
        </NavLink>
        <NavLink to="/course-planner" className={({ isActive }) => isActive ? 'active' : ''}>
          📚 {t('nav.coursePlanner')}
        </NavLink>
        <NavLink to="/tracker" className={({ isActive }) => isActive ? 'active' : ''}>
          🎓 {t('nav.progress')}
        </NavLink>
        <NavLink to="/calendar" className={({ isActive }) => isActive ? 'active' : ''}>
          📅 {t('nav.calendar')}
        </NavLink>
        <NavLink to="/updates" className={({ isActive }) => isActive ? 'active' : ''}>
          📋 {t('nav.updateLog')}
        </NavLink>

        {/* 手機版專用：並排按鈕容器 */}
        <div className="mobile-buttons-row">
          {/* 🎓 手機版IBS專區連結（與深色模式並排） */}
          <a
            href="https://solar-tuesday-ad1.notion.site/edb276ef8b5c4d05983a4a27c841a989?v=0e56c1269fd149aebe113ddff1c49d73"
            target="_blank"
            rel="noopener noreferrer"
            className={`nav-external-link ibs-handbook mobile-ibs-link ${showIBSAnimation ? 'animate' : ''}`}
            title={t('nav.ibsZone')}
          >
            <span className="link-icon">📚</span>
            <span className="link-text">{t('nav.ibsZone')}</span>
            <span className="external-indicator">↗</span>
          </a>

          {/* ✅ 主題切換按鈕 */}
          <button
            className="mobile-theme-toggle-container"
            onClick={toggleTheme}
            title={theme === 'light' ? t('common.switchToDark') : t('common.switchToLight')}
          >
            <div className="mobile-theme-toggle-icon">
              {theme === 'light' ? '🌙' : '☀️'}
            </div>
            <span className="mobile-theme-label">
              {theme === 'light' ? t('common.darkMode') : t('common.lightMode')}
            </span>
          </button>
        </div>
      </div>

      {/* 🎨 右側區域：IBS專區 + 主題切換 + 認證 */}
      <div className="nav-right-section">
        {/* ✅ 新增：IBS專區按鈕（放在主題按鈕左邊） */}
        <a
          href="https://solar-tuesday-ad1.notion.site/edb276ef8b5c4d05983a4a27c841a989?v=0e56c1269fd149aebe113ddff1c49d73"
          target="_blank"
          rel="noopener noreferrer"
          className={`nav-external-link ibs-handbook ${showIBSAnimation ? 'animate' : ''}`}
          title={t('nav.ibsZone')}
        >
          <span className="link-icon">📚</span>
          <span className="link-text">{t('nav.ibsZone')}</span>
          <span className="external-indicator">↗</span>
        </a>

        {/* ✅ 桌面版主題切換按鈕 */}
        <button
          className="theme-toggle desktop-theme-toggle"
          onClick={toggleTheme}
          title={theme === 'light' ? t('common.switchToDark') : t('common.switchToLight')}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {/* 🔐 認證區域 */}
        <div className="auth-section">
          {isLoading ? (
            <div className="loading-text">{t('common.loading')}</div>
          ) : isLoggedIn && user ? (
            <div className="user-profile">
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="avatar"
                title={user.full_name}
              />
              <span className="user-name">{user.full_name}</span>
              <button
                onClick={logout}
                className="logout-button"
                title={t('common.logout')}
              >
                {t('common.logout')}
              </button>
            </div>
          ) : (
            <GoogleLoginButton />
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
