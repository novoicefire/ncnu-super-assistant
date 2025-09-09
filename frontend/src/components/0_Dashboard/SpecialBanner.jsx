// frontend/src/components/0_Dashboard/SpecialBanner.jsx
import React, { useState, useEffect } from 'react';

const SpecialBanner = () => {
  // 從 localStorage 讀取橫幅是否已被關閉的狀態
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    // 關閉橫幅並在 localStorage 中記錄
    setIsVisible(false);
  };

  if (!isVisible) {
    return null; // 如果不可見，則不渲染任何內容
  }

  return (
    <div className="special-banner">
      <div className="special-banner-content">
        <span className="banner-icon">🎉</span>
        <p className="banner-text">
          <strong>新功能上線！</strong> 
          <a href="/course-planner" className="banner-link">智慧排課系統</a> 
          現已推出，快來體驗看看吧！
        </p>
      </div>
      <button 
        className="dismiss-button" 
        onClick={handleDismiss}
        aria-label="關閉特殊公告"
        title="關閉"
      >
        &times;
      </button>
    </div>
  );
};

export default SpecialBanner;
