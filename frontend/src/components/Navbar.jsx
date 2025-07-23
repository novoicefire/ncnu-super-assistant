// frontend/src/components/Navbar.jsx (完整版 - 包含漸變色和所有功能)
import React, { useEffect, useRef } from 'react';
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

const Navbar = () => {
  const { isLoggedIn, user, logout, isLoading, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
  };

  if (isLoading) {
    return (
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <NavLink to="/" className="brand-link">
              🎓 暨大生超級助理
            </NavLink>
          </div>
          <div className="nav-loading">載入中...</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* 品牌標誌 */}
        <div className="nav-brand">
          <NavLink to="/" className="brand-link">
            🎓 暨大生超級助理
          </NavLink>
        </div>

        {/* 主要導航連結 */}
        <div className="nav-links">
          <NavLink 
            to="/" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            📚 智慧排課
          </NavLink>
          
          <NavLink 
            to="/tracker" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            🎓 畢業進度
          </NavLink>
          
          <NavLink 
            to="/directory" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            📞 校園通訊錄
          </NavLink>
          
          <NavLink 
            to="/calendar" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            📅 暨大行事曆
          </NavLink>
          
          <NavLink 
            to="/posts" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            📰 最新資訊
          </NavLink>
          
          <NavLink 
            to="/updates" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            📝 更新日誌
          </NavLink>

          {/* 管理員專用連結 */}
          {isAdmin && (
            <NavLink 
              to="/admin" 
              className={({ isActive }) => `nav-link admin-link ${isActive ? 'active' : ''}`}
            >
              🔐 管理員
            </NavLink>
          )}
        </div>

        {/* 用戶區域 */}
        <div className="nav-user">
          {isLoggedIn ? (
            <div className="user-info">
              <div className="user-profile">
                <img 
                  src={user.avatar_url} 
                  alt={user.full_name}
                  className="user-avatar"
                />
                <span className="user-name">{user.full_name}</span>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                🔓 登出
              </button>
            </div>
          ) : (
            <div className="login-section">
              <GoogleLoginButton />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
