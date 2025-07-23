// frontend/src/components/AdBlockDetector.jsx
import React, { useState, useEffect } from 'react';
import './AdBlockDetector.css';

const AdBlockDetector = ({ children }) => {
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAdBlock();
  }, []);

  const checkAdBlock = () => {
    // 方法1：創建測試廣告元素
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox';
    testAd.style.position = 'absolute';
    testAd.style.left = '-9999px';
    testAd.style.height = '1px';
    testAd.style.width = '1px';
    document.body.appendChild(testAd);

    // 方法2：檢測常見的廣告攔截器模式
    setTimeout(() => {
      const isBlocked = testAd.offsetHeight === 0 || 
                       testAd.style.display === 'none' || 
                       testAd.style.visibility === 'hidden';
      
      document.body.removeChild(testAd);
      
      // 方法3：檢測網路請求攔截
      const img = new Image();
      img.onload = () => {
        setAdBlockDetected(isBlocked);
        setIsChecking(false);
      };
      img.onerror = () => {
        setAdBlockDetected(true);
        setIsChecking(false);
      };
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      
      // 備用檢測
      if (!img.complete) {
        setTimeout(() => {
          setAdBlockDetected(isBlocked);
          setIsChecking(false);
        }, 100);
      }
    }, 100);
  };

  const refreshPage = () => {
    window.location.reload();
  };

  if (isChecking) {
    return (
      <div className="adblock-checking">
        <div className="checking-spinner"></div>
        <p>正在載入頁面...</p>
      </div>
    );
  }

  if (adBlockDetected) {
    return (
      <div className="adblock-overlay">
        <div className="adblock-modal">
          <div className="adblock-icon">🛡️</div>
          <h2>檢測到廣告攔截器</h2>
          <p>為了提供更好的服務，請將本網站加入廣告攔截器的白名單。</p>
          
          <div className="adblock-instructions">
            <h3>📝 如何加入白名單：</h3>
            <div className="instruction-steps">
              <div className="step">
                <span className="step-number">1</span>
                <span>點擊瀏覽器右上角的廣告攔截器圖標</span>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <span>選擇「暫停此網站的廣告攔截」或「加入白名單」</span>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <span>重新載入頁面即可正常使用</span>
              </div>
            </div>
          </div>

          <div className="adblock-notice">
            <p>💡 <strong>為什麼需要關閉廣告攔截器？</strong></p>
            <p>我們的網站包含重要的學術資訊和服務公告，廣告攔截器可能會誤判並隱藏這些重要內容，影響您的使用體驗。</p>
          </div>

          <div className="adblock-actions">
            <button className="retry-btn" onClick={refreshPage}>
              🔄 重新載入頁面
            </button>
            <button className="continue-btn" onClick={() => setAdBlockDetected(false)}>
              ⚠️ 仍要繼續使用（可能功能不完整）
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdBlockDetector;
