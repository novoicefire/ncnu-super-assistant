// frontend/src/components/0_Dashboard/WelcomeBanner.jsx (歡迎橫幅組件)
import React from 'react';

const WelcomeBanner = ({ user, isLoggedIn }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早安';
    if (hour < 18) return '午安';
    return '晚安';
  };

  const getWelcomeMessage = () => {
    if (!isLoggedIn) {
      return '歡迎來到暨大生超級助理！';
    }
    
    const firstName = user?.full_name?.split(' ')[0] || '同學';
    const greeting = getGreeting();
    
    return `${greeting}，${firstName}！今天是美好的學習日`;
  };

  const getSubMessage = () => {
    const today = new Date();
    const isWeekend = today.getDay() === 0 || today.getDay() === 6;
    
    if (isWeekend) {
      return '週末愉快，記得適度休息 🌈';
    }
    
    return '讓我們一起規劃未來的學習時光 ✨';
  };

  return (
    <div className="welcome-banner">
      <div className="welcome-content">
        <h1 className="welcome-title">
          {isLoggedIn ? '🎓' : '👋'} {getWelcomeMessage()}
        </h1>
        <p className="welcome-subtitle">
          {getSubMessage()}
        </p>
      </div>
      <div className="welcome-decoration">
        <div className="floating-element">📚</div>
        <div className="floating-element">✨</div>
        <div className="floating-element">🎯</div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
