// frontend/src/components/Navbar.jsx (最終除錯版)

import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import './Navbar.css';

const GoogleLoginButton = () => {
    const { handleGoogleLogin } = useAuth();
    const buttonDiv = useRef(null);

    useEffect(() => {
        // [核心修正] 每次 Navbar 重新渲染時，這個 effect 都可能重新運行
        // 這確保了 Google 按鈕總是使用最新的 handleGoogleLogin 函數
        if (window.google && buttonDiv.current) {
            // 加入 console.log 來確認初始化
            console.log("Initializing Google Sign-In Button with client_id:", import.meta.env.VITE_GOOGLE_CLIENT_ID);

            window.google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                callback: handleGoogleLogin, // 使用從 context 傳來的最新函數
            });
            
            // 清空容器，防止重複渲染
            buttonDiv.current.innerHTML = "";
            
            window.google.accounts.id.renderButton(
                buttonDiv.current,
                { theme: "outline", size: "large", shape: "pill", text: "signin_with" }
            );
            window.google.accounts.id.prompt(); 
        }
    }, [handleGoogleLogin]); // 依賴 handleGoogleLogin

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