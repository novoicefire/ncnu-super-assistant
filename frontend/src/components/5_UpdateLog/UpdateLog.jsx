// frontend/src/components/5_UpdateLog/UpdateLog.jsx (時間軸風格 - 類似首頁公告)
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRocket,
  faStar,
  faBolt,
  faWrench,
  faFilter,
  faCode,
  faChevronDown,
  faChevronUp,
  faHistory,
  faCircle
} from '@fortawesome/free-solid-svg-icons';
import { updateHistory } from './updateData.js';
import './UpdateLog.css';

const UpdateLog = () => {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState('all');
  const [expandedItems, setExpandedItems] = useState(new Set([updateHistory[0]?.version])); // 預設展開最新的

  // 篩選更新記錄
  const filteredUpdates = selectedType === 'all'
    ? updateHistory
    : updateHistory.filter(update => update.type === selectedType);

  // 類型配置
  const typeConfig = {
    major: {
      icon: faRocket,
      color: '#ef4444',
      label: t('updateLog.major')
    },
    feature: {
      icon: faStar,
      color: '#22c55e',
      label: t('updateLog.feature')
    },
    improvement: {
      icon: faBolt,
      color: '#3b82f6',
      label: t('updateLog.improvement')
    },
    fix: {
      icon: faWrench,
      color: '#f59e0b',
      label: t('updateLog.fix')
    }
  };

  const toggleExpand = (version) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(version)) {
      newExpanded.delete(version);
    } else {
      newExpanded.add(version);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="ul-container">
      {/* 頁面標題 */}
      <header className="ul-header">
        <div className="ul-header-icon">
          <FontAwesomeIcon icon={faHistory} />
        </div>
        <h1 className="ul-title">{t('updateLog.title')}</h1>
        <p className="ul-subtitle">{t('updateLog.subtitle')}</p>

        {/* 統計區 */}
        <div className="ul-stats">
          <div className="ul-stat">
            <span className="ul-stat-value">{updateHistory.length}</span>
            <span className="ul-stat-label">{t('updateLog.totalUpdates')}</span>
          </div>
          <div className="ul-stat">
            <span className="ul-stat-value">{updateHistory[0]?.version || 'v1.0.0'}</span>
            <span className="ul-stat-label">{t('updateLog.latestVersion')}</span>
          </div>
          <div className="ul-stat">
            <span className="ul-stat-value">{new Date().getFullYear()}</span>
            <span className="ul-stat-label">{t('updateLog.activeYear')}</span>
          </div>
        </div>
      </header>

      {/* 篩選器 */}
      <div className="ul-filters">
        <div className="ul-filters-header">
          <FontAwesomeIcon icon={faFilter} />
          <span>{t('updateLog.filterTitle')}</span>
        </div>
        <div className="ul-filter-btns">
          <button
            className={`ul-filter-btn ${selectedType === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedType('all')}
          >
            {t('updateLog.all')}
          </button>
          {Object.entries(typeConfig).map(([type, config]) => (
            <button
              key={type}
              className={`ul-filter-btn ${selectedType === type ? 'active' : ''}`}
              onClick={() => setSelectedType(type)}
              style={{ '--btn-color': config.color }}
            >
              <FontAwesomeIcon icon={config.icon} />
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* 時間軸列表 */}
      <div className="ul-timeline">
        {filteredUpdates.map((update, index) => {
          const config = typeConfig[update.type] || typeConfig.feature;
          const isExpanded = expandedItems.has(update.version);
          const isLast = index === filteredUpdates.length - 1;

          return (
            <div
              key={update.version}
              className={`ul-timeline-item ${isExpanded ? 'expanded' : ''}`}
              style={{ '--type-color': config.color }}
            >
              {/* 時間軸連接線 */}
              <div className="ul-timeline-connector">
                <div
                  className="ul-timeline-dot"
                  style={{ backgroundColor: config.color }}
                >
                  <FontAwesomeIcon icon={config.icon} className="ul-dot-icon" />
                </div>
                {!isLast && <div className="ul-timeline-line" />}
              </div>

              {/* 內容區域 */}
              <div
                className="ul-timeline-content"
                onClick={() => toggleExpand(update.version)}
              >
                {/* 頂部：類型標籤 + 日期 */}
                <div className="ul-content-header">
                  <span
                    className="ul-type-badge"
                    style={{ backgroundColor: `${config.color}20`, color: config.color }}
                  >
                    <FontAwesomeIcon icon={config.icon} />
                    {config.label}
                  </span>
                  <div className="ul-meta">
                    <span className="ul-version">{update.version}</span>
                    <span className="ul-date">{update.date}</span>
                  </div>
                  <FontAwesomeIcon
                    icon={isExpanded ? faChevronUp : faChevronDown}
                    className="ul-expand-icon"
                  />
                </div>

                {/* 標題 */}
                <h3 className="ul-content-title">{update.title}</h3>

                {/* 展開內容 */}
                {isExpanded && (
                  <div className="ul-expanded-content">
                    {/* 描述 */}
                    {update.description && (
                      <p className="ul-description">{update.description}</p>
                    )}

                    {/* 功能列表 */}
                    <div className="ul-features">
                      <h4>{t('updateLog.updateContent')}</h4>
                      <ul>
                        {update.features.map((feature, idx) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </div>

                    {/* 技術詳情 */}
                    {update.technical && update.technical.length > 0 && (
                      <div className="ul-technical">
                        <h4>
                          <FontAwesomeIcon icon={faCode} />
                          {t('updateLog.technicalDetails')}
                        </h4>
                        <ul>
                          {update.technical.map((tech, idx) => (
                            <li key={idx}>{tech}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 無結果提示 */}
      {filteredUpdates.length === 0 && (
        <div className="ul-empty">
          <p>📭 {t('updateLog.noUpdates')}</p>
        </div>
      )}
    </div>
  );
};

export default UpdateLog;
