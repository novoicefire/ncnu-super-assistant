// frontend/src/components/common/LazyLoader.jsx (懶載入包裝器)
import React, { Suspense, useState, useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary.jsx';

const LazyLoader = ({ 
  children, 
  fallback, 
  errorFallback,
  minLoadingTime = 300,
  onLoadStart,
  onLoadEnd,
  onError 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    setStartTime(Date.now());
    if (onLoadStart) onLoadStart();
    
    return () => {
      if (onLoadEnd) onLoadEnd();
    };
  }, [onLoadStart, onLoadEnd]);

  const handleLoadEnd = () => {
    const elapsed = Date.now() - startTime;
    const remainingTime = Math.max(0, minLoadingTime - elapsed);
    
    setTimeout(() => {
      setIsLoading(false);
    }, remainingTime);
  };

  const defaultFallback = (
    <div className="lazy-loading-container">
      <div className="loading-content">
        <div className="loading-spinner apple-spinner"></div>
        <div className="loading-text">載入中...</div>
        <div className="loading-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const defaultErrorFallback = (
    <div className="lazy-error-container">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <h3>載入失敗</h3>
        <p>組件載入時發生錯誤，請重新整理頁面</p>
        <button 
          className="apple-button"
          onClick={() => window.location.reload()}
        >
          重新載入
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary 
      fallback={errorFallback || defaultErrorFallback}
      onError={onError}
    >
      <Suspense 
        fallback={fallback || defaultFallback}
      >
        <div className="lazy-content">
          {children}
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};

export default LazyLoader;
