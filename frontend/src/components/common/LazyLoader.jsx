// frontend/src/components/common/LazyLoader.jsx (懶載入包裝器 - 精簡版)
import React, { Suspense, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from './ErrorBoundary.jsx';
import '../../styles/LoadingStyles.css';

const LazyLoader = ({
  children,
  fallback,
  errorFallback,
  minLoadingTime = 300,
  onLoadStart,
  onLoadEnd,
  onError
}) => {
  const { t } = useTranslation();
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    setStartTime(Date.now());
    if (onLoadStart) onLoadStart();

    return () => {
      if (onLoadEnd) onLoadEnd();
    };
  }, [onLoadStart, onLoadEnd]);

  // 簡單載入 fallback（無骨架屏，節省效能）
  const defaultFallback = (
    <div className="lazy-loading-container">
      <div className="loading-content">
        <div className="loading-spinner-container">
          <div className="modern-spinner">
            <div className="spinner-circle"></div>
            <div className="spinner-circle"></div>
            <div className="spinner-circle"></div>
            <div className="spinner-core"></div>
          </div>
        </div>
        <div className="loading-text">{t('common.loading')}</div>
      </div>
    </div>
  );

  // 錯誤 fallback
  const defaultErrorFallback = (
    <div className="lazy-error-container">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <h3>{t('common.loadFailed')}</h3>
        <p>{t('common.loadFailedDesc')}</p>
        <button
          className="apple-button"
          onClick={() => window.location.reload()}
        >
          {t('common.reload')}
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
        <div className="lazy-content content-fade-in">
          {children}
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};

export default LazyLoader;
