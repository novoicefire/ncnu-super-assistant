// frontend/src/components/0_Dashboard/AnnouncementButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const AnnouncementButton = ({ 
  text, 
  url, 
  style = 'secondary', 
  icon = '', 
  external = false 
}) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    
    if (external) {
      // 外部連結：新分頁開啟
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // 內部連結：使用路由導航
      if (url.startsWith('#')) {
        // 錨點連結：滾動到指定位置
        const element = document.querySelector(url);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // 路由連結
        navigate(url);
      }
    }
  };

  const getButtonClass = () => {
    const baseClass = 'announcement-btn';
    switch (style) {
      case 'primary':
        return `${baseClass} btn-primary`;
      case 'secondary':
        return `${baseClass} btn-secondary`;
      case 'success':
        return `${baseClass} btn-success`;
      case 'warning':
        return `${baseClass} btn-warning`;
      case 'danger':
        return `${baseClass} btn-danger`;
      default:
        return `${baseClass} btn-secondary`;
    }
  };

  return (
    <button
      className={getButtonClass()}
      onClick={handleClick}
      title={external ? '在新分頁中開啟' : ''}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      <span className="btn-text">{text}</span>
      {external && <span className="external-indicator">↗</span>}
    </button>
  );
};

export default AnnouncementButton;
