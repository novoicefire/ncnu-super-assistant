// frontend/src/components/0_Dashboard/AnnouncementCard.jsx (改良版 - 時間軸風格 + i18n)
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { announcementData } from './announcementData.js';
import AnnouncementButton from './AnnouncementButton.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullhorn,
  faFire,
  faComment,
  faChevronDown,
  faChevronUp,
  faCircle
} from '@fortawesome/free-solid-svg-icons';

const AnnouncementCard = () => {
  const { t, i18n } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [readItems, setReadItems] = useState(() => {
    // 從 localStorage 讀取已讀狀態
    const saved = localStorage.getItem('readAnnouncements');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    const sortedAnnouncements = [...announcementData]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    setAnnouncements(sortedAnnouncements);
    setLastUpdate(new Date());
  }, []);

  // 保存已讀狀態到 localStorage
  useEffect(() => {
    localStorage.setItem('readAnnouncements', JSON.stringify([...readItems]));
  }, [readItems]);

  const unreadCount = announcements.filter(a => !readItems.has(a.id)).length;

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
      // 展開時標記為已讀
      const newRead = new Set(readItems);
      newRead.add(id);
      setReadItems(newRead);
    }
    setExpandedItems(newExpanded);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('time.today');
    if (diffDays === 1) return t('time.yesterday');
    if (diffDays < 7) return i18n.language === 'en' ? `${diffDays} days ago` : `${diffDays} 天前`;

    return date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'zh-TW', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'high':
        return { icon: faFire, color: '#ef4444', label: t('announcement.priorityHigh'), bgColor: 'rgba(239, 68, 68, 0.15)' };
      case 'normal':
        return { icon: faBullhorn, color: '#3b82f6', label: t('announcement.priorityNormal'), bgColor: 'rgba(59, 130, 246, 0.15)' };
      case 'low':
        return { icon: faComment, color: '#6b7280', label: t('announcement.priorityLow'), bgColor: 'rgba(107, 114, 128, 0.15)' };
      default:
        return { icon: faBullhorn, color: '#3b82f6', label: t('announcement.priorityNormal'), bgColor: 'rgba(59, 130, 246, 0.15)' };
    }
  };

  const renderContent = (content) => {
    return content
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <p key={index} className="announcement-highlight">
              {line.slice(2, -2)}
            </p>
          );
        }
        if (line.startsWith('•')) {
          return (
            <li key={index} className="announcement-list-item">
              {line.slice(1).trim()}
            </li>
          );
        }
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
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {image.caption && <p className="image-caption">{image.caption}</p>}
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
    <div className="announcement-card modern">
      {/* 標題列 */}
      <div className="announcement-header">
        <div className="header-content">
          <div className="header-title-row">
            <FontAwesomeIcon icon={faBullhorn} className="header-icon" />
            <h3>{t('announcement.title')}</h3>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
          <span className="last-update">
            {t('announcement.lastUpdate')} {formatLastUpdate()}
          </span>
        </div>
        <button
          className="collapse-toggle modern"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? '展開公告' : '收合公告'}
        >
          <FontAwesomeIcon icon={isCollapsed ? faChevronDown : faChevronUp} />
        </button>
      </div>

      {/* 公告列表 - 時間軸風格 */}
      <div className={`collapsible-content ${isCollapsed ? 'collapsed' : ''}`}>
        {announcements.length === 0 ? (
          <div className="empty-announcements">
            <div className="empty-icon">📭</div>
            <h4>暫無公告</h4>
            <p>目前沒有最新公告</p>
          </div>
        ) : (
          <div className="announcements-timeline">
            {announcements.map((announcement, index) => {
              const priority = getPriorityConfig(announcement.priority);
              const isExpanded = expandedItems.has(announcement.id);
              const isUnread = !readItems.has(announcement.id);

              return (
                <div
                  key={announcement.id}
                  className={`timeline-item ${isExpanded ? 'expanded' : ''} ${isUnread ? 'unread' : ''}`}
                  style={{ '--priority-color': priority.color }}
                >
                  {/* 時間軸連接線 */}
                  <div className="timeline-connector">
                    <div
                      className="timeline-dot"
                      style={{ backgroundColor: priority.color }}
                    >
                      {isUnread && <FontAwesomeIcon icon={faCircle} className="unread-indicator" />}
                    </div>
                    {index < announcements.length - 1 && <div className="timeline-line" />}
                  </div>

                  {/* 公告內容 */}
                  <div
                    className="timeline-content"
                    onClick={() => toggleExpand(announcement.id)}
                  >
                    {/* 標籤和日期 */}
                    <div className="timeline-meta">
                      <span
                        className="priority-badge"
                        style={{
                          backgroundColor: priority.bgColor,
                          color: priority.color
                        }}
                      >
                        <FontAwesomeIcon icon={priority.icon} />
                        <span>{priority.label}</span>
                      </span>
                      <span className="timeline-date">{formatDate(announcement.date)}</span>
                    </div>

                    {/* 標題 */}
                    <h4 className="timeline-title">{announcement.title}</h4>

                    {/* 展開的內容 */}
                    <div className={`timeline-body ${isExpanded ? 'show' : ''}`}>
                      <div className="announcement-content">
                        {announcement.content.trim().startsWith('<iframe') ? (
                          <div dangerouslySetInnerHTML={{ __html: announcement.content }} />
                        ) : (
                          renderContent(announcement.content)
                        )}
                      </div>
                      {renderImages(announcement.images)}
                      {renderEmbeds(announcement.embeds)}
                      {renderButtons(announcement.buttons)}
                    </div>

                    {/* 展開提示 */}
                    <div className="expand-hint">
                      <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
                      <span>{isExpanded ? '收合' : '展開詳情'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementCard;
