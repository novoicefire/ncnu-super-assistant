// frontend/src/components/DisclaimerModal.jsx (修復版)
import React, { useEffect } from 'react';
import './DisclaimerModal.css';

const DisclaimerModal = ({ isVisible, onAccept }) => {
  // 🔧 修復：更安全的body滾動控制
  useEffect(() => {
    if (isVisible) {
      document.body.classList.add('disclaimer-showing');
    } else {
      document.body.classList.remove('disclaimer-showing');
    }

    // 清理函數
    return () => {
      document.body.classList.remove('disclaimer-showing');
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="disclaimer-overlay">
      <div className="disclaimer-modal">
        <div className="disclaimer-header">
          <h2>⚠️ 重要提醒</h2>
        </div>
        
        <div className="disclaimer-content">
          <div className="disclaimer-text">
            <p>
              暨大生超級助理為<strong>「非校方」</strong>維護的網頁，
              所有資訊以學校新教務系統公告為準，
              暨大生超級助理不負責任何選課、課程資訊、
              畢業必修進度追蹤、校園行事曆等相關問題。
            </p>
            
            <div className="disclaimer-note">
              <p>📌 請注意：</p>
              <ul>
                <li>本網站僅供參考，不代表學校官方立場</li>
                <li>如有疑問請以學校正式公告為準</li>
                <li>使用本網站即表示您同意上述聲明</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="disclaimer-footer">
          <button 
            className="disclaimer-accept-btn"
            onClick={onAccept}
          >
            ✅ 我已閱讀並同意以上聲明
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;
