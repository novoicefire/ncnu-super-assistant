// frontend/src/components/0_Dashboard/AnnouncementCard.jsx
import React, { useState, useEffect } from 'react';
import { announcementData } from './announcementData.js';
import AnnouncementButton from './AnnouncementButton.jsx';

const AnnouncementCard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // 載入公告資料並按日期排序
    const sortedAnnouncements = [...announcementData]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5); // 最多顯示5則最新公告
    
    setAnnouncements(sortedAnnouncements);
    setLastUpdate(new Date());
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔥';
      case 'normal': return '📢';
      case 'low': return '💬';
      default: return '📢';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'announcement-high';
      case 'normal': return 'announcement-normal';
      case 'low': return 'announcement-low';
      default: return 'announcement-normal';
    }
  };

  const renderContent = (content) => {
    // 簡單的Markdown風格解析
    return content
      .split('\n')
      .map((line, index) => {
        // 處理粗體文字
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <p key={index} className="announcement-highlight">
              {line.slice(2, -2)}
            </p>
          );
        }
        // 處理列表項目
        if (line.startsWith('•')) {
          return (
            <li key={index} className="announcement-list-item">
              {line.slice(1).trim()}
            </li>
          );
        }
        // 一般段落
        if (line.trim()) {
          return (
            <p key={index} className="announcement-text">
              {line}
            </p>
          );
        }
        return null;
      })
      .filter(Boolean);
  };

  const renderImages = (images) => {
    if (!images || images.length === 0) return null;

    return (
      <div className="announcement-images">
        {images.map((image, index) => (
          <div key={index} className="image-container">
            <img 
              src={image.src} 
              alt={image.alt}
              className="announcement-image"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            {image.caption && (
              <p className="image-caption">{image.caption}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderEmbeds = (embeds) => {
    if (!embeds || embeds.length === 0) return null;

    return (
      <div className="announcement-embeds">
        {embeds.map((embed, index) => (
          <div key={index} className="embed-container">
            {embed.type === 'youtube' && (
              <div className="youtube-embed">
                <iframe
                  src={`https://www.youtube.com/embed/${embed.id}`}
                  title={embed.title || 'YouTube影片'}
                  frameBorder="0"
                  allowFullScreen
                  className="youtube-iframe"
                />
              </div>
            )}
            {embed.type === 'link' && (
              <a 
                href={embed.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-embed"
              >
                <div className="link-preview">
                  <h5>{embed.title}</h5>
                  <p>{embed.description}</p>
                  <span className="link-url">🔗 {embed.url}</span>
                </div>
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderButtons = (buttons) => {
    if (!buttons || buttons.length === 0) return null;

    return (
      <div className="announcement-buttons">
        {buttons.map((button, index) => (
          <AnnouncementButton
            key={index}
            text={button.text}
            url={button.url}
            style={button.style}
            icon={button.icon}
            external={button.external}
          />
        ))}
      </div>
    );
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return '';
    return lastUpdate.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="announcement-card">
      <div className="announcement-header">
        <div className="header-content">
          <h3>📢 網站公告</h3>
          <span className="last-update">
            最後更新：{formatLastUpdate()}
          </span>
        </div>
        <button
          className="collapse-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? '展開公告' : '收合公告'}
        >
          <span className={`toggle-icon ${isCollapsed ? 'collapsed' : ''}`}>
            ▼
          </span>
        </button>
      </div>

      <div className={`collapsible-content ${isCollapsed ? 'collapsed' : ''}`}>
        {announcements.length === 0 ? (
          <div className="empty-announcements">
            <div className="empty-icon">📭</div>
            <h4>暫無公告</h4>
            <p>目前沒有最新公告，請稍後再來查看</p>
          </div>
        ) : (
          <div className="announcements-list">
            {announcements.map((announcement) => (
              <div 
                key={announcement.id}
                className={`announcement-item ${getPriorityClass(announcement.priority)}`}
              >
                <div className="announcement-meta">
                  <span className="priority-indicator">
                    {getPriorityIcon(announcement.priority)}
                  </span>
                  <span className="announcement-date">
                    {formatDate(announcement.date)}
                  </span>
                </div>
                
                <h4 className="announcement-title">
                  {announcement.title}
                </h4>
                
                <div className="announcement-content">
                  {renderContent(announcement.content)}
                </div>
                
                {renderImages(announcement.images)}
                {renderEmbeds(announcement.embeds)}
                {renderButtons(announcement.buttons)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementCard;
