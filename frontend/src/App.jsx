// frontend/src/App.jsx (完整效能優化版 + Google Analytics)
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'; // ✅ 新增 useLocation
import { Toaster } from 'react-hot-toast';
import ReactGA from 'react-ga4'; // ✅ 新增 Google Analytics

// 核心組件直接導入
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { LoadingProvider } from './components/common/LoadingManager.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import PerformanceMonitor from './components/common/PerformanceMonitor.jsx';
import Navbar from './components/Navbar.jsx';
import DisclaimerModal from './components/DisclaimerModal.jsx';

// 🎯 懶載入頁面組件
const Dashboard = lazy(() => import('./components/0_Dashboard/Dashboard.jsx'));
const CoursePlanner = lazy(() => import('./components/1_CoursePlanner/CoursePlanner.jsx'));
const GraduationTracker = lazy(() => import('./components/2_GraduationTracker/GraduationTracker.jsx'));
const CampusDirectory = lazy(() => import('./components/3_CampusDirectory/CampusDirectory.jsx'));
const UniversityCalendar = lazy(() => import('./components/4_UniversityCalendar/UniversityCalendar.jsx'));
const UpdateLog = lazy(() => import('./components/5_UpdateLog/UpdateLog.jsx'));

// 樣式
import './App.css';
import './styles/themes.css';
import './styles/apple-ui.css';
import './styles/performance.css';

// 🎯 頁面載入回退組件
const PageLoadingFallback = ({ pageName }) => (
  <div className="page-loading">
    <div className="loading-content">
      <div className="apple-spinner large">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      <div className="loading-text">載入{pageName}中...</div>
    </div>
  </div>
);

// ✅ 新增：Google Analytics 路由追蹤組件
function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    // 追蹤頁面瀏覽
    ReactGA.send({ 
      hitType: "pageview", 
      page: location.pathname + location.search,
      title: document.title
    });

    // 記錄開發環境日誌
    if (import.meta.env.DEV) {
      console.log('📊 GA Page View:', location.pathname);
    }
  }, [location]);

  return null;
}

function App() {
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  // 🎯 應用程式初始化
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 🎯 預載入關鍵資源
        await Promise.all([
          // 預載入字體
          document.fonts.ready,
          
          // 檢查本地儲存可用性
          (() => {
            try {
              localStorage.setItem('test', 'test');
              localStorage.removeItem('test');
              return Promise.resolve();
            } catch {
              console.warn('LocalStorage not available');
              return Promise.resolve();
            }
          })(),
          
          // 模擬最小載入時間確保載入動畫顯示
          new Promise(resolve => setTimeout(resolve, 800))
        ]);

        setIsAppReady(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        setIsAppReady(true); // 即使失敗也要顯示應用程式
      }
    };

    initializeApp();
  }, []);

  // 🎯 免責聲明處理
  const handleAcceptDisclaimer = () => {
    setShowDisclaimer(false);
    setDisclaimerAccepted(true);
    
    // ✅ 新增：追蹤免責聲明接受事件
    ReactGA.event({
      category: 'User Interaction',
      action: 'Accept Disclaimer',
      label: 'Initial Visit'
    });
  };

  // 🎯 防止背景滾動
  useEffect(() => {
    if (showDisclaimer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDisclaimer]);

  // 🎯 效能監控回調
  const handlePerformanceMetrics = (metrics) => {
    // ✅ 新增：發送效能數據到 GA
    if (metrics && metrics.lcp) {
      ReactGA.event({
        category: 'Performance',
        action: 'Core Web Vitals',
        label: `LCP: ${Math.round(metrics.lcp)}ms`,
        value: Math.round(metrics.lcp)
      });
    }

    // 開發環境日誌
    if (import.meta.env.DEV) {
      console.log('Performance Metrics:', metrics);
    }
  };

  // 🎯 應用程式未準備好時的載入畫面
  if (!isAppReady) {
    return (
      <div className="app-initializing">
        <div className="init-loading">
          <div className="init-logo">
            <img src="/logo.svg" alt="Logo" style={{ width: '80px', height: '80px' }} />
          </div>
          <div className="apple-spinner large">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <div className="init-text">暨大生超級助理</div>
          <div className="init-subtext">正在初始化...</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LoadingProvider>
          <Router>
            {/* ✅ 新增：路由追蹤組件 */}
            <RouteTracker />

            {/* 🎯 免責聲明 */}
            <DisclaimerModal 
              isVisible={showDisclaimer} 
              onAccept={handleAcceptDisclaimer} 
            />

            {/* 🎯 效能監控 */}
            <PerformanceMonitor 
              isEnabled={import.meta.env.DEV} // ✅ 修改：使用 Vite 環境變數
              onMetrics={handlePerformanceMetrics}
            />

            {/* 🎯 主應用程式 */}
            <div className="app-container">
              <ErrorBoundary fallback={
                <div className="navbar-error">
                  <div>導航欄載入失敗</div>
                  <button onClick={() => window.location.reload()}>重新載入</button>
                </div>
              }>
                <Navbar disclaimerAccepted={disclaimerAccepted} />
              </ErrorBoundary>
              
              <div className="container">
                <ErrorBoundary>
                  <Suspense fallback={<PageLoadingFallback pageName="頁面" />}>
                    <Routes>
                      <Route 
                        path="/" 
                        element={
                          <Suspense fallback={<PageLoadingFallback pageName="首頁" />}>
                            <Dashboard />
                          </Suspense>
                        } 
                      />
                      <Route 
                        path="/course-planner" 
                        element={
                          <Suspense fallback={<PageLoadingFallback pageName="智慧排課" />}>
                            <CoursePlanner />
                          </Suspense>
                        } 
                      />
                      <Route 
                        path="/tracker" 
                        element={
                          <Suspense fallback={<PageLoadingFallback pageName="畢業進度" />}>
                            <GraduationTracker />
                          </Suspense>
                        } 
                      />
                      <Route 
                        path="/directory" 
                        element={
                          <Suspense fallback={<PageLoadingFallback pageName="校園通訊錄" />}>
                            <CampusDirectory />
                          </Suspense>
                        } 
                      />
                      <Route 
                        path="/calendar" 
                        element={
                          <Suspense fallback={<PageLoadingFallback pageName="行事曆" />}>
                            <UniversityCalendar />
                          </Suspense>
                        } 
                      />
                      <Route 
                        path="/updates" 
                        element={
                          <Suspense fallback={<PageLoadingFallback pageName="更新日誌" />}>
                            <UpdateLog />
                          </Suspense>
                        } 
                      />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </div>
              
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--theme-bg-card)',
                    color: 'var(--theme-text-primary)',
                    border: '1px solid var(--theme-border-primary)',
                    borderRadius: '12px',
                    boxShadow: 'var(--theme-shadow-lg)'
                  }
                }}
              />
            </div>
          </Router>
        </LoadingProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
