// frontend/src/components/Navbar.jsx (已修正 Export 错误)

import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import './Navbar.css';

// 这个元件是 Navbar 内部使用的，所以不需要从这个檔案汇出
const GoogleLoginButton = () => {
    const { handleGoogleLogin } = useAuth();
    const buttonDiv = useRef(null);

    useEffect(() => {
        if (window.google && buttonDiv.current) {
            window.google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                callback: handleGoogleLogin,
            });
            window.google.accounts.id.renderButton(
                buttonDiv.current,
                { theme: "outline", size: "large", shape: "pill", text: "signin_with" }
            );
            window.google.accounts.id.prompt(); 
        }
    }, [handleGoogleLogin]);

    return <div ref={buttonDiv} id="google-signin-button"></div>;
};


const Navbar = () => {
    const { isLoggedIn, user, logout, isLoading } = useAuth();

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
                <GoogleLoginButton />
            )}
          </div>
        </nav>
    );
};

// [核心修正] 确保我们汇出的是 Navbar 这个主要的元件
export default Navbar;