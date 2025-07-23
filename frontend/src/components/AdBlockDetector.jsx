// frontend/src/components/AdBlockDetector.jsx (強制關閉 AdBlock 版本)
import React, { useState, useEffect } from 'react';
import './AdBlockDetector.css';

const AdBlockDetector = ({ children }) => {
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    console.log('🔍 開始 AdBlock 檢測...');
    checkAdBlockMultiple();
  }, []);

  const checkAdBlockMultiple = async () => {
    const results = await Promise.all([
      testMethod1(), // 元素隱藏檢測
      testMethod2(), // CSS 規則檢測  
      testMethod3(), // 網路請求檢測
      testMethod4()  // DOM 操作檢測
    ]);

    const detectedCount = results.filter(Boolean).length;
    const isDetected = detectedCount >= 2; // 至少2個方法檢測到才認定為有AdBlock

    console.log('🔍 AdBlock 檢測結果:', {
      方法1_元素隱藏: results[0],
      方法2_CSS規則: results[1], 
      方法3_網路請求: results[2],
      方法4_DOM操作: results[3],
      檢測到的方法數: detectedCount,
      最終結果: isDetected ? '檢測到廣告攔截器' : '未檢測到廣告攔截器'
    });

    setAdBlockDetected(isDetected);
    setIsChecking(false);
  };

  // 方法1：元素隱藏檢測
  const testMethod1 = () => {
    return new Promise((resolve) => {
      const testElements = [
        'adsbox',
        'ad-banner', 
        'advertisement',
        'google-ads',
        'adsystem'
      ];

      let blockedCount = 0;

      testElements.forEach(className => {
        const testEl = document.createElement('div');
        testEl.className = className;
        testEl.style.cssText = 'position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;';
        testEl.innerHTML = '&nbsp;';
        document.body.appendChild(testEl);

        setTimeout(() => {
          const isBlocked = testEl.offsetHeight === 0 || 
                           testEl.offsetWidth === 0 ||
                           getComputedStyle(testEl).display === 'none' ||
                           getComputedStyle(testEl).visibility === 'hidden';
          
          if (isBlocked) blockedCount++;
          document.body.removeChild(testEl);
          
          if (className === testElements[testElements.length - 1]) {
            resolve(blockedCount > 0);
          }
        }, 100);
      });
    });
  };

  // 方法2：CSS 規則檢測
  const testMethod2 = () => {
    return new Promise((resolve) => {
      try {
        const style = document.createElement('style');
        style.textContent = '.adtest { width: 1px !important; }';
        document.head.appendChild(style);

        const testEl = document.createElement('div');
        testEl.className = 'adtest banner-ad';
        testEl.style.cssText = 'position:absolute!important;left:-9999px!important;';
        document.body.appendChild(testEl);

        setTimeout(() => {
          const isBlocked = getComputedStyle(testEl).width !== '1px';
          document.body.removeChild(testEl);
          document.head.removeChild(style);
          resolve(isBlocked);
        }, 100);
      } catch (e) {
        resolve(false);
      }
    });
  };

  // 方法3：網路請求檢測
  const testMethod3 = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://googleads.g.doubleclick.net/pagead/id';
      script.async = true;
      
      const timeout = setTimeout(() => {
        resolve(true); // 超時認為被攔截
        if (script.parentNode) script.parentNode.removeChild(script);
      }, 2000);

      script.onload = () => {
        clearTimeout(timeout);
        resolve(false); // 載入成功，沒有攔截
        if (script.parentNode) script.parentNode.removeChild(script);
      };

      script.onerror = () => {
        clearTimeout(timeout);
        resolve(true); // 載入失敗，可能被攔截
        if (script.parentNode) script.parentNode.removeChild(script);
      };

      document.head.appendChild(script);
    });
  };

  // 方法4：DOM 操作檢測
  const testMethod4 = () => {
    return new Promise((resolve) => {
      const testEl = document.createElement('ins');
      testEl.className = 'adsbygoogle';
      testEl.style.cssText = 'position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;display:block!important;';
      document.body.appendChild(testEl);

      setTimeout(() => {
        const isBlocked = !testEl.parentNode || 
                         testEl.style.display === 'none' ||
                         testEl.offsetHeight === 0;
        
        if (testEl.parentNode) {
          document.body.removeChild(testEl);
        }
        resolve(isBlocked);
      }, 300);
    });
  };

  const refreshPage = () => {
    window.location.reload();
  };

  if (isChecking) {
    return (
      <div className="adblock-checking">
        <div className="checking-spinner"></div>
        <p>正在檢測網頁環境...</p>
      </div>
    );
  }

  // 在 AdBlockDetector.jsx 中修改這個部分
  if (adBlockDetected) {
    return (
      <div className="adblock-overlay">
        <div className="adblock-modal compact">
          <div className="adblock-icon">🛡️</div>
          <h2>請關閉廣告攔截器</h2>
          <p>為確保所有功能正常運作，請將本網站加入白名單。</p>
        
          <div className="adblock-steps">
            <div className="step-item">
              <span>1.</span> 點擊瀏覽器的廣告攔截器圖標
            </div>
            <div className="step-item">
              <span>2.</span> 選擇「暫停此網站」或「加入白名單」
            </div>
            <div className="step-item">
              <span>3.</span> 重新載入頁面
            </div>
          </div>

          <button className="retry-btn compact" onClick={refreshPage}>
            🔄 重新載入頁面
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default AdBlockDetector;
