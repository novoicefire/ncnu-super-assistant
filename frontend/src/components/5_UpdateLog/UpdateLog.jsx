// frontend/src/components/5_UpdateLog/UpdateLog.jsx
import React, { useState } from 'react';
import { updateHistory } from './updateData.js';
import './UpdateLog.css';

const UpdateLog = () => {
  const [selectedType, setSelectedType] = useState('all');
  
  // 篩選更新記錄
  const filteredUpdates = selectedType === 'all' 
    ? updateHistory 
    : updateHistory.filter(update => update.type === selectedType);

  // 獲取更新類型的標籤樣式
  const getTypeLabel = (type) => {
    const types = {
      major: { label: '重大更新', class: 'major' },
      feature: { label: '新功能', class: 'feature' },
      improvement: { label: '優化', class: 'improvement' },
      fix: { label: '修復', class: 'fix' }
    };
    return types[type] || { label: '更新', class: 'default' };
  };

  return (
    <div className="update-log-container">
      <div className="update-header">
        <h1>📝 更新日誌</h1>
        <p>記錄每次正式版發布的功能更新與改進</p>
        
        {/* 統計資訊 */}
        <div className="stats">
          <div className="stat-item">
            <span className="stat-number">{updateHistory.length}</span>
            <span className="stat-label">次更新</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">v{updateHistory[0]?.version.replace('v', '') || '1.0.0'}</span>
            <span className="stat-label">最新版本</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{new Date().getFullYear()}</span>
            <span className="stat-label">持續更新</span>
          </div>
        </div>
      </div>

      {/* 篩選器 */}
      <div className="filter-section">
        <h3>篩選更新類型：</h3>
        <div className="filter-buttons">
          <button 
            className={selectedType === 'all' ? 'active' : ''}
            onClick={() => setSelectedType('all')}
          >
            全部
          </button>
          <button 
            className={selectedType === 'major' ? 'active' : ''}
            onClick={() => setSelectedType('major')}
          >
            🎉 重大更新
          </button>
          <button 
            className={selectedType === 'feature' ? 'active' : ''}
            onClick={() => setSelectedType('feature')}
          >
            ✨ 新功能
          </button>
          <button 
            className={selectedType === 'improvement' ? 'active' : ''}
            onClick={() => setSelectedType('improvement')}
          >
            ⚡ 優化
          </button>
          <button 
            className={selectedType === 'fix' ? 'active' : ''}
            onClick={() => setSelectedType('fix')}
          >
            🔧 修復
          </button>
        </div>
      </div>

      {/* 更新時間軸 */}
      <div className="timeline">
        {filteredUpdates.map((update, index) => {
          const typeInfo = getTypeLabel(update.type);
          return (
            <div key={update.version} className="timeline-item">
              <div className="timeline-marker">
                <div className={`timeline-dot ${typeInfo.class}`}></div>
                {index !== filteredUpdates.length - 1 && <div className="timeline-line"></div>}
              </div>
              
              <div className="timeline-content">
                <div className="update-card">
                  <div className="update-header-info">
                    <div className="version-info">
                      <h2>{update.version}</h2>
                      <span className={`type-badge ${typeInfo.class}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <div className="date">{update.date}</div>
                  </div>
                  
                  <h3 className="update-title">{update.title}</h3>
                  
                  {update.description && (
                    <p className="update-description">{update.description}</p>
                  )}
                  
                  <div className="features-list">
                    <h4>🎯 本次更新內容：</h4>
                    <ul>
                      {update.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {update.technical && (
                    <details className="technical-details">
                      <summary>🔧 技術細節</summary>
                      <ul>
                        {update.technical.map((tech, idx) => (
                          <li key={idx}>{tech}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUpdates.length === 0 && (
        <div className="no-updates">
          <p>📭 沒有符合篩選條件的更新記錄</p>
        </div>
      )}
    </div>
  );
};

export default UpdateLog;
