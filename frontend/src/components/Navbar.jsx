// frontend/src/components/Navbar.jsx (狀態依賴修正版)

import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import './Navbar.css';

const GoogleLoginButton = () => {
    const { handleGoogleLogin, isLoggedIn } = useAuth(); // [核心修正 1] 獲取 isLoggedIn 狀態
    const buttonDiv = useRef(null);

    useEffect(() => {
        // [核心修正 2] 只有在未登入時，才渲染 Google 按鈕
        if (!isLoggedIn && window.google && buttonDiv.current) {
            // 清空容器，防止重複渲染
            buttonDiv.current.innerHTML = "";

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
    // [核心修正 3] 將 isLoggedIn 加入依賴陣列
    // 這會使得當 isLoggedIn 從 false 變為 true 時，這個 effect 會重新執行
    // 雖然在這個版本中，重新執行時按鈕不會被渲染，但這是一個好的實踐
    }, [isLoggedIn, handleGoogleLogin]);

    // 如果已經登入，就不渲染這個元件的任何內容
    if (isLoggedIn) {
        return null;
    }

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
            ) : isLoggedIn && user ? ( // [核心修正 4] 確保 user 物件存在
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