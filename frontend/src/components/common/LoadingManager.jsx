// frontend/src/components/common/LoadingManager.jsx (全域載入狀態管理)
import React, { createContext, useContext, useState, useCallback } from 'react';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [globalLoading, setGlobalLoading] = useState(false);

  // 🎯 設置載入狀態
  const setLoading = useCallback((key, isLoading, options = {}) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      
      if (isLoading) {
        newState[key] = {
          isLoading: true,
          startTime: Date.now(),
          message: options.message || '載入中...',
          progress: options.progress || 0,
          cancelable: options.cancelable || false,
          onCancel: options.onCancel
        };
      } else {
        delete newState[key];
      }
      
      return newState;
    });
  }, []);

  // 🎯 更新載入進度
  const updateProgress = useCallback((key, progress, message) => {
    setLoadingStates(prev => {
      if (!prev[key]) return prev;
      
      return {
        ...prev,
        [key]: {
          ...prev[key],
          progress,
          message: message || prev[key].message
        }
      };
    });
  }, []);

  // 🎯 檢查是否正在載入
  const isLoading = useCallback((key) => {
    return key ? !!loadingStates[key] : Object.keys(loadingStates).length > 0;
  }, [loadingStates]);

  // 🎯 獲取載入狀態
  const getLoadingState = useCallback((key) => {
    return loadingStates[key] || null;
  }, [loadingStates]);

  // 🎯 取消載入
  const cancelLoading = useCallback((key) => {
    const state = loadingStates[key];
    if (state && state.cancelable && state.onCancel) {
      state.onCancel();
    }
    setLoading(key, false);
  }, [loadingStates, setLoading]);

  // 🎯 全域載入控制
  const setGlobalLoadingState = useCallback((isLoading, message) => {
    setGlobalLoading(isLoading);
    if (isLoading) {
      setLoading('global', true, { message });
    } else {
      setLoading('global', false);
    }
  }, [setLoading]);

  const value = {
    loadingStates,
    globalLoading,
    setLoading,
    updateProgress,
    isLoading,
    getLoadingState,
    cancelLoading,
    setGlobalLoadingState
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <LoadingOverlay />
    </LoadingContext.Provider>
  );
};

// 🎯 載入覆蓋層組件
const LoadingOverlay = () => {
  const { loadingStates, globalLoading } = useLoading();
  
  // 只顯示全域載入或重要載入
  const importantLoadings = Object.entries(loadingStates).filter(
    ([key, state]) => key === 'global' || state.important
  );

  if (!globalLoading && importantLoadings.length === 0) {
    return null;
  }

  const currentLoading = importantLoadings[0]?.[1] || loadingStates.global;

  return (
    <div className="loading-overlay">
      <div className="loading-backdrop" />
      <div className="loading-content glass-effect">
        <div className="loading-spinner-container">
          <div className="apple-spinner large">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
        </div>
        
        <div className="loading-text">
          {currentLoading?.message || '載入中...'}
        </div>
        
        {currentLoading?.progress > 0 && (
          <div className="loading-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${currentLoading.progress}%` }}
              />
            </div>
            <div className="progress-text">
              {Math.round(currentLoading.progress)}%
            </div>
          </div>
        )}
        
        {currentLoading?.cancelable && (
          <button 
            className="cancel-btn"
            onClick={() => currentLoading.onCancel?.()}
          >
            取消
          </button>
        )}
      </div>
    </div>
  );
};
