import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import './Navbar.css';
// [核心修改] 建立一個新的組件來專門處理 Google 登入按鈕的渲染
const GoogleLoginButton = () => {
const { handleGoogleLogin } = useAuth();
const buttonDiv = useRef(null); // 建立一個 ref 來指向我們要渲染按鈕的 div
useEffect(() => {
    // 確保 Google 的 gsi 函式庫已經被載入
    if (window.google && buttonDiv.current) {
        // 初始化 Google Identity Services
        window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, // 直接從環境變數讀取
            callback: handleGoogleLogin, // 登入成功後的回調函數
        });
        // 將 Google 登入按鈕渲染到我們指定的 div 中
        window.google.accounts.id.renderButton(
            buttonDiv.current,
            { theme: "outline", size: "large", shape: "pill", text: "signin_with" } // 自訂按鈕樣式
        );
        // 啟用 One Tap 登入
        window.google.accounts.id.prompt(); 
    }
}, [handleGoogleLogin]);

// 這個 div 就是 Google 按鈕的「容器」
return <div ref={buttonDiv} id="google-signin-button"></div>;};

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
            // 使用我們自己建立的 Google 登入按鈕組件
            <GoogleLoginButton />
        )}
      </div>
    </nav>
    );
};