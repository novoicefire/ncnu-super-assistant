// frontend/src/components/common/PerformanceMonitor.jsx (效能監控組件)
import React, { useEffect, useState, useCallback } from 'react';

const PerformanceMonitor = ({ 
  isEnabled = true, 
  showOverlay = false,
  onMetrics 
}) => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    connectionType: 'unknown',
    isOnline: navigator.onLine
  });

  const [isVisible, setIsVisible] = useState(false);

  // 🎯 收集效能指標
  const collectMetrics = useCallback(() => {
    if (!isEnabled) return;

    try {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      const newMetrics = {
        // 載入時間
        loadTime: navigation ? Math.round(navigation.loadEventEnd - navigation.loadEventStart) : 0,
        
        // 首次內容繪製時間
        fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        
        // 記憶體使用量 (如果瀏覽器支援)
        memoryUsage: performance.memory ? 
          Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 0,
          
        // 網路連線類型
        connectionType: navigator.connection?.effectiveType || 'unknown',
        
        // 在線狀態
        isOnline: navigator.onLine,
        
        // 當前時間戳
        timestamp: Date.now()
      };

      setMetrics(newMetrics);
      
      if (onMetrics) {
        onMetrics(newMetrics);
      }

      // 🎯 效能警告
      if (newMetrics.loadTime > 3000) {
        console.warn('⚠️ 頁面載入時間過長:', newMetrics.loadTime, 'ms');
      }

      if (newMetrics.memoryUsage > 100) {
        console.warn('⚠️ 記憶體使用量較高:', newMetrics.memoryUsage, 'MB');
      }

    } catch (error) {
      console.error('效能監控錯誤:', error);
    }
  }, [isEnabled, onMetrics]);

  // 🎯 監聽效能事件
  useEffect(() => {
    if (!isEnabled) return;

    // 初始收集
    collectMetrics();

    // 定期更新
    const interval = setInterval(collectMetrics, 5000);

    // 監聽在線狀態變化
    const handleOnline = () => setMetrics(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setMetrics(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 監聽頁面隱藏/顯示
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        collectMetrics();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnabled, collectMetrics]);

  // 🎯 鍵盤快捷鍵切換顯示
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  if (!isEnabled || (!showOverlay && !isVisible)) {
    return null;
  }

  const getConnectionColor = (type) => {
    switch (type) {
      case '4g': return '#28a745';
      case '3g': return '#ffc107';
      case '2g': return '#dc3545';
      case 'slow-2g': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="performance-monitor">
      <div className="performance-overlay glass-effect">
        <div className="performance-header">
          <h4>⚡ 效能監控</h4>
          <button 
            className="close-btn"
            onClick={() => setIsVisible(false)}
          >
            ×
          </button>
        </div>
        
        <div className="performance-grid">
          <div className="metric-item">
            <div className="metric-label">載入時間</div>
            <div className={`metric-value ${metrics.loadTime > 3000 ? 'warning' : 'good'}`}>
              {metrics.loadTime}ms
            </div>
          </div>
          
          <div className="metric-item">
            <div className="metric-label">首次內容繪製</div>
            <div className={`metric-value ${metrics.fcp > 2000 ? 'warning' : 'good'}`}>
              {Math.round(metrics.fcp)}ms
            </div>
          </div>
          
          <div className="metric-item">
            <div className="metric-label">記憶體使用</div>
            <div className={`metric-value ${metrics.memoryUsage > 100 ? 'warning' : 'good'}`}>
              {metrics.memoryUsage}MB
            </div>
          </div>
          
          <div className="metric-item">
            <div className="metric-label">網路狀態</div>
            <div className="metric-value">
              <span 
                className="connection-indicator"
                style={{ color: getConnectionColor(metrics.connectionType) }}
              >
                ● {metrics.connectionType.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="metric-item">
            <div className="metric-label">線上狀態</div>
            <div className={`metric-value ${metrics.isOnline ? 'good' : 'error'}`}>
              {metrics.isOnline ? '🟢 在線' : '🔴 離線'}
            </div>
          </div>
        </div>
        
        <div className="performance-footer">
          <small>使用 Ctrl+Shift+P 切換顯示</small>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
