// frontend/src/components/0_Dashboard/StatusCard.jsx (毛玻璃效果版)
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const StatusCard = ({ 
  icon, 
  title, 
  value, 
  status, 
  cardContent, 
  onClick, 
  isOpen = false,  // [新增] 接收外部控制的開啟狀態
  isClickable = false, 
  animationDelay = 0 
}) => {
  // [刪除] const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);
  const popupRef = useRef(null);

  // 🎯 進場動畫
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  // 🎯 計算卡片最佳位置
  const calculatePopupPosition = () => {
    if (!cardRef.current) return;
    
    const cardRect = cardRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 預設位置：卡片右側
    let x = cardRect.right + 16;
    let y = cardRect.top + (cardRect.height / 2) - 150;

    // 🎯 智能位置調整
    if (x + 320 > viewportWidth) {
      x = cardRect.left - 336;
    }

    if (y < 20) {
      y = 20;
    } else if (y + 300 > viewportHeight) {
      y = viewportHeight - 320;
    }

    setCardPosition({ 
      x: Math.max(20, x), 
      y: Math.max(20, y) 
    });
  };

  // [新增] 當 isOpen 改變時重新計算位置
  useEffect(() => {
    if (isOpen) {
      setTimeout(calculatePopupPosition, 10);
    }
  }, [isOpen]);

  // [刪除] handleMouseEnter 和 handleMouseLeave 函數

  // 🎯 點擊處理 [修改]
  const handleClick = (e) => {
    e.stopPropagation(); // [新增] 阻止事件冒泡
    if (onClick) {  // [修改] 移除 isClickable 檢查
      onClick();
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'active': return 'status-active';
      case 'empty': return 'status-empty';
      case 'warning': return 'status-warning';
      case 'error': return 'status-error';
      default: return 'status-info';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'active': return '#28a745';
      case 'warning': return '#ffc107';
      case 'error': return '#dc3545';
      case 'empty': return '#6c757d';
      default: return '#17a2b8';
    }
  };

  // 🎯 毛玻璃彈出卡片組件 [修改] 移除滑鼠事件
  const PopupCard = () => (
    <div
      ref={popupRef}
      className="status-card-popup-glass"
      style={{
        position: 'fixed',
        left: `${cardPosition.x}px`,
        top: `${cardPosition.y}px`,
        zIndex: 9999
      }}
      onClick={(e) => e.stopPropagation()} // [修改] 只保留點擊阻止冒泡
    >
      <div className="popup-arrow-glass"></div>
      <div className="popup-content-glass">
        <div className="content-header-glass">
          <h4>{title}</h4>
          <span className="update-time-glass">剛剛更新</span>
        </div>
        <div className="popup-body-glass">
          {cardContent}
        </div>
      </div>

      {/* ✅ 毛玻璃效果樣式 */}
      <style jsx>{`
        .status-card-popup-glass {
          position: fixed !important;
          /* ✅ 毛玻璃背景 */
          background: rgba(255, 255, 255, 0.25) !important;
          backdrop-filter: blur(20px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          border-radius: 20px !important;
          min-width: 320px !important;
          max-width: 400px !important;
          padding: 0 !important;
          animation: popupGlassSlideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.1),
            0 4px 16px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.4) !important;
          overflow: hidden !important;
          z-index: 9999 !important;
          pointer-events: all !important;
        }

        @keyframes popupGlassSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
            backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            backdrop-filter: blur(20px) saturate(180%);
          }
        }

        .popup-arrow-glass {
          position: absolute !important;
          width: 12px !important;
          height: 12px !important;
          /* ✅ 毛玻璃箭頭 */
          background: rgba(255, 255, 255, 0.25) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          transform: rotate(45deg) !important;
          z-index: -1 !important;
          left: -6px !important;
          top: 50% !important;
          margin-top: -6px !important;
        }

        .popup-content-glass {
          padding: 1.5rem !important;
          position: relative !important;
          z-index: 1 !important;
          /* ✅ 內容區域半透明背景 */
          background: rgba(255, 255, 255, 0.1) !important;
          border-radius: 18px !important;
        }

        .content-header-glass {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          margin-bottom: 1rem !important;
          padding-bottom: 0.5rem !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
        }

        .content-header-glass h4 {
          margin: 0 !important;
          font-size: 1.1rem !important;
          font-weight: 600 !important;
          color: rgba(51, 51, 51, 0.9) !important;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8) !important;
        }

        .update-time-glass {
          font-size: 0.7rem !important;
          color: rgba(108, 117, 125, 0.8) !important;
          opacity: 0.8 !important;
          text-shadow: 0 1px 1px rgba(255, 255, 255, 0.6) !important;
        }

        .popup-body-glass {
          max-height: 300px !important;
          overflow-y: auto !important;
          /* ✅ 滾動條毛玻璃樣式 */
        }

        .popup-body-glass::-webkit-scrollbar {
          width: 6px !important;
        }

        .popup-body-glass::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1) !important;
          border-radius: 3px !important;
        }

        .popup-body-glass::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3) !important;
          border-radius: 3px !important;
        }

        .popup-body-glass::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5) !important;
        }

        /* ✅ 深色模式毛玻璃效果 */
        [data-theme="dark"] .status-card-popup-glass {
          background: rgba(45, 55, 72, 0.3) !important;
          backdrop-filter: blur(20px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 4px 16px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
        }

        [data-theme="dark"] .popup-arrow-glass {
          background: rgba(45, 55, 72, 0.3) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        [data-theme="dark"] .popup-content-glass {
          background: rgba(45, 55, 72, 0.1) !important;
        }

        [data-theme="dark"] .content-header-glass {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        [data-theme="dark"] .content-header-glass h4 {
          color: rgba(247, 250, 252, 0.9) !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
        }

        [data-theme="dark"] .update-time-glass {
          color: rgba(160, 174, 192, 0.8) !important;
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3) !important;
        }

        [data-theme="dark"] .popup-body-glass::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05) !important;
        }

        [data-theme="dark"] .popup-body-glass::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2) !important;
        }

        [data-theme="dark"] .popup-body-glass::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3) !important;
        }

        /* ✅ 手機版毛玻璃適配 */
        @media (max-width: 768px) {
          .status-card-popup-glass {
            position: fixed !important;
            left: 1rem !important;
            right: 1rem !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            max-width: none !important;
            width: auto !important;
            min-width: auto !important;
            /* ✅ 手機版毛玻璃效果 */
            background: rgba(255, 255, 255, 0.35) !important;
            backdrop-filter: blur(25px) saturate(200%) !important;
            -webkit-backdrop-filter: blur(25px) saturate(200%) !important;
          }

          .popup-arrow-glass {
            display: none !important;
          }

          [data-theme="dark"] .status-card-popup-glass {
            background: rgba(45, 55, 72, 0.4) !important;
          }
        }

        /* ✅ Safari 兼容性 */
        @supports not (backdrop-filter: blur(20px)) {
          .status-card-popup-glass {
            background: rgba(255, 255, 255, 0.9) !important;
          }
          
          [data-theme="dark"] .status-card-popup-glass {
            background: rgba(45, 55, 72, 0.9) !important;
          }
        }
      `}</style>
    </div>
  );

  return (
    <>
      <div
        ref={cardRef}
        className={`status-card ${getStatusClass()} ${isClickable ? 'clickable' : ''} ${isVisible ? 'card-visible' : 'card-hidden'} ${isOpen ? 'is-open' : ''}`} // [新增] is-open class
        // [刪除] onMouseEnter={handleMouseEnter}
        // [刪除] onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{
          '--status-color': getStatusColor(),
          animationDelay: `${animationDelay}ms`
        }}
      >
        <div className="status-card-main">
          <div className="status-icon-container">
            <span className="status-icon">{icon}</span>
            {status === 'active' && <div className="status-pulse"></div>}
          </div>
          <div className="status-content">
            <div className="status-title">{title}</div>
            <div className="status-value">{value}</div>
          </div>
          {isClickable && (
            <div className="card-arrow">→</div>
          )}
        </div>
        
        {/* 波紋效果 */}
        <div className="card-ripple"></div>
        
        {/* 光暈效果 */}
        <div className="card-glow"></div>
      </div>

      {/* ✅ 使用 Portal 渲染毛玻璃彈出卡片 [修改] 條件從 isHovered 改為 isOpen */}
      {isOpen && cardContent && typeof document !== 'undefined' && 
        createPortal(<PopupCard />, document.body)
      }
    </>
  );
};

export default StatusCard;
