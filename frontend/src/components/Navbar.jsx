// frontend/src/components/Navbar.jsx (最終完整版)

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
                { theme: "outline", size: "large", shape: "pill", text: "signin_with" }
            );
            window.google.accounts.id.prompt(); 
        }

        return () => {
            if (currentButtonDiv) {
                currentButtonDiv.innerHTML = "";
            }
        };
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
            ) : isLoggedIn && user ? (
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

export default Navbar;