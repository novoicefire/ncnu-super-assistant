// frontend/src/components/Navbar.jsx (新檔案 - 完整版)

import React from 'react';
import { NavLink } from 'react-router-dom'; // 使用 NavLink 來處理 active 樣式
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../AuthContext.jsx'; // 引入我們建立的 AuthContext
import './Navbar.css'; // 引入 Navbar 的專屬樣式

const Navbar = () => {
    const { isLoggedIn, user, handleGoogleLogin, logout, isLoading } = useAuth();

    return (
        <nav className="navbar">
          <NavLink to="/" className="nav-brand">暨大生超級助理</NavLink>
          
          <div className="nav-links">
            <NavLink to="/">智慧排課</NavLink>
            <NavLink to="/tracker">畢業進度</NavLink>
            <NavLink to="/directory">校園通訊錄</NavLink>
            <NavLink to="/calendar">學校行事曆</NavLink>
          </div>

          <div className="auth-section">
            {isLoading ? (
                <div>載入中...</div>
            ) : isLoggedIn ? (
                <div className="user-profile">
                    <img src={user.avatar_url} alt={user.full_name} className="avatar" />
                    <span className="user-name">{user.full_name}</span>
                    <button onClick={logout} className="logout-button">登出</button>
                </div>
            ) : (
                <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={() => console.log('Login Failed')}
                    useOneTap // 啟用 Google One Tap 登入，體驗更好
                    theme="outline"
                    shape="pill"
                />
            )}
          </div>
        </nav>
    );
};

export default Navbar;