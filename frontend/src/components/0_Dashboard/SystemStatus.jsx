// frontend/src/components/0_Dashboard/SystemStatus.jsx (正常模式版)
import React, { useState, useEffect } from 'react';
import { checkSystemHealth, getUserStats } from '../../apiHelper.js';

const SystemStatus = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [systemData, setSystemData] = useState({
    isLoading: true,
    serverStatus: 'checking',
    lastSync: null,
    userCount: 0,
    responseTime: null,
    lastUpdate: null
  });

  // 🎯 載入系統狀態 - 使用真實 API
  useEffect(() => {
    const loadSystemStatus = async () => {
      try {
        // ✅ 使用真實的 API 請求
        const [healthData, userStatsData] = await Promise.all([
          checkSystemHealth(),
          getUserStats()
        ]);

        setSystemData({
          isLoading: false,
          serverStatus: healthData.status || 'online',
          lastSync: healthData.timestamp || new Date(),
          userCount: userStatsData.totalUsers || 0,
          responseTime: healthData.responseTime || null,
          lastUpdate: new Date()
        });
      } catch (error) {
        console.error('載入系統狀態失敗:', error);
        setSystemData(prev => ({
          ...prev,
          isLoading: false,
          serverStatus: 'error',
          lastUpdate: new Date()
        }));
      }
    };

    // 初始載入
    loadSystemStatus();

    // 每 30 秒更新一次
    const intervalId = setInterval(loadSystemStatus, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return '🟢';
      case 'warning': return '🟡';
      case 'error': return '🔴';
      case 'checking': return '🔄';
      default: return '⚪';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return '正常';
      case 'warning': return '異常';
      case 'error': return '中斷';
      case 'checking': return '檢查中';
      default: return '未知';
    }
  };

  const formatLastUpdate = () => {
    if (!systemData.lastUpdate) return '';
    return systemData.lastUpdate.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatUserCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toLocaleString();
  };

  const formatResponseTime = (time) => {
    if (!time) return '---';
    return `${time}ms`;
  };

  const formatLastSync = (date) => {
    if (!date) return '未同步';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 30) return '剛剛';
    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分鐘前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小時前`;
    
    return date.toLocaleString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ✅ 重新整理功能 - 使用真實的重新載入
  const handleRefresh = async () => {
    setSystemData(prev => ({ ...prev, isLoading: true }));
    
    try {
      const [healthData, userStatsData] = await Promise.all([
        checkSystemHealth(),
        getUserStats()
      ]);

      setSystemData({
        isLoading: false,
        serverStatus: healthData.status || 'online',
        lastSync: healthData.timestamp || new Date(),
        userCount: userStatsData.totalUsers || 0,
        responseTime: healthData.responseTime || null,
        lastUpdate: new Date()
      });
    } catch (error) {
      console.error('重新載入系統狀態失敗:', error);
      setSystemData(prev => ({
        ...prev,
        isLoading: false,
        serverStatus: 'error',
        lastUpdate: new Date()
      }));
    }
  };

  return (
    <div className="system-status glass-effect">
      {/* ✅ 使用與 TodayStatus 完全相同的類名和結構 */}
      <div className="today-status-header">
        <div className="header-content">
          <h3 className="gradient-text">🔧 系統狀態</h3>
          {formatLastUpdate() && (
            <span className="last-update">
              {getStatusIcon(systemData.serverStatus)} {getStatusText(systemData.serverStatus)} • 更新於 {formatLastUpdate()}
            </span>
          )}
        </div>
        <button 
          className="collapse-toggle mobile-only"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? '展開系統狀態' : '收起系統狀態'}
        >
          <span className={`toggle-icon ${isCollapsed ? 'collapsed' : ''}`}>
            ▼
          </span>
        </button>
      </div>

      {/* ✅ 可折疊內容區域 */}
      <div className={`collapsible-content ${isCollapsed ? 'collapsed' : ''}`}>
        {systemData.isLoading ? (
          <div className="loading-state">
            <div className="loading-animation">
              <div className="pulse-circle"></div>
              <p>載入系統狀態中...</p>
            </div>
          </div>
        ) : (
          <div className="status-grid">
            <div className="status-card">
              <div className="status-card-icon">👥</div>
              <div className="status-card-content">
                <div className="status-card-title">線上用戶</div>
                <div className="status-card-value">{formatUserCount(systemData.userCount)}</div>
              </div>
            </div>

            <div className="status-card">
              <div className="status-card-icon">⚡</div>
              <div className="status-card-content">
                <div className="status-card-title">響應時間</div>
                <div className="status-card-value">{formatResponseTime(systemData.responseTime)}</div>
              </div>
            </div>

            <div className="status-card">
              <div className="status-card-icon">🔄</div>
              <div className="status-card-content">
                <div className="status-card-title">最後同步</div>
                <div className="status-card-value">{formatLastSync(systemData.lastSync)}</div>
              </div>
            </div>

            <div className="status-card">
              <div className="status-card-icon">📊</div>
              <div className="status-card-content">
                <div className="status-card-title">服務狀態</div>
                <div className="status-card-value">{getStatusText(systemData.serverStatus)}</div>
              </div>
            </div>
          </div>
        )}

        <div className="system-actions">
          <button 
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={systemData.isLoading}
          >
            🔄 重新整理
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
