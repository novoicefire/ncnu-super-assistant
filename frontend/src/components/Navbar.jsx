// frontend/src/components/Navbar.jsx (新增 SVG Logo 版)
import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
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
  const { isLoggedIn, user, logout, isLoading } = useAuth();
  const [showIBSAnimation, setShowIBSAnimation] = useState(false);

  useEffect(() => {
    if (disclaimerAccepted && !showIBSAnimation) {
      const timer = setTimeout(() => {
        setShowIBSAnimation(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [disclaimerAccepted, showIBSAnimation]);

  return (
    <nav className="navbar">
      {/* 🎨 修改：品牌區域包含 logo 和文字 */}
      <div className="nav-brand-container">
        <img 
          src="/logo.svg" 
          alt="暨大生超級助理 Logo" 
          className="nav-logo"
          onError={(e) => {
            // 如果 logo 載入失敗，隱藏圖片
            e.target.style.display = 'none';
          }}
        />
        <div className="nav-brand">暨大生超級助理</div>
      </div>
      
      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
          智慧排課
        </NavLink>
        <NavLink to="/tracker" className={({ isActive }) => isActive ? 'active' : ''}>
          畢業進度
        </NavLink>
        <NavLink to="/directory" className={({ isActive }) => isActive ? 'active' : ''}>
          校園通訊錄
        </NavLink>
        <NavLink to="/calendar" className={({ isActive }) => isActive ? 'active' : ''}>
          暨大行事曆
        </NavLink>
        <NavLink to="/updates" className={({ isActive }) => isActive ? 'active' : ''}>
          更新日誌
        </NavLink>
        
        <a 
          href="https://solar-tuesday-ad1.notion.site/edb276ef8b5c4d05983a4a27c841a989?v=0e56c1269fd149aebe113ddff1c49d73"
          target="_blank"
          rel="noopener noreferrer"
          className={`nav-external-link ibs-handbook ${showIBSAnimation ? 'animate' : ''}`}
          title="國企系 IBS 學士班手冊（外部連結）"
        >
          <span className="link-icon">📚</span>
          <span className="link-text">IBS專區</span>
          <span className="external-indicator">↗</span>
        </a>
      </div>

      <div className="auth-section">
        {isLoading ? (
          <div className="loading-text">載入中...</div>
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
              title="登出"
            >
              登出
            </button>
          </div>
        ) : (
          <GoogleLoginButton />
        )}
      </div>
    </nav>
  );
};

export default Navbar;
