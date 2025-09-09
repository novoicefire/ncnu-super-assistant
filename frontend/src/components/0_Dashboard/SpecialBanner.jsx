// frontend/src/components/0_Dashboard/SpecialBanner.jsx
import React, { useState } from 'react';
import './SpecialBanner.css';

const SpecialBanner = () => {
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 500);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`special-banner ${isClosing ? 'closing' : ''}`}>
      <div className="special-banner-content">
        <span className="banner-icon">🫶</span>
        <p className="banner-text">
          <span dangerouslySetInnerHTML={{ __html: '<strong>友情提示不是廣告</strong>有需要' }} />
          {' '}
          <a href="https://www.instagram.com/ncnu_super_assistant/" className="banner-link">【免費諮詢升學或職涯規劃】</a>
          {' '}
          的人可以找我要聯繫方式，而且他們在學校也有駐點，有興趣可以去問問看，反正問不用錢，祝大家學業順利💪大展鴻圖😎
        </p>
      </div>
      <button className="dismiss-button" onClick={handleDismiss} aria-label="關閉特殊公告" title="關閉">&times;</button>
    </div>
  );
};

export default SpecialBanner;