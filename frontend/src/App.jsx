// frontend/src/App.jsx (完整效能優化版 + Google Analytics + 新導航)
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ReactGA from 'react-ga4';

// 核心組件直接導入
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import { PWAProvider } from './contexts/PWAContext.jsx';
import { LoadingProvider } from './components/common/LoadingManager.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import PerformanceMonitor from './components/common/PerformanceMonitor.jsx';
import SideNav from './components/SideNav.jsx';
import BottomNavBar from './components/BottomNavBar.jsx';
import MobileHeader from './components/MobileHeader.jsx'; // ✅ 手機版頂部標題欄
import DisclaimerModal from './components/DisclaimerModal.jsx';
import PWAInstallPrompt from './components/PWAInstallPrompt.jsx';
import PushNotificationPrompt from './components/PushNotificationPrompt.jsx';

// 🎯 懶載入頁面組件
const Dashboard = lazy(() => import('./components/0_Dashboard/Dashboard.jsx'));
const CoursePlanner = lazy(() => import('./components/1_CoursePlanner/CoursePlanner.jsx'));
const GraduationTracker = lazy(() => import('./components/2_GraduationTracker/GraduationTracker.jsx'));
const UniversityCalendar = lazy(() => import('./components/4_UniversityCalendar/UniversityCalendar.jsx'));
const UpdateLog = lazy(() => import('./components/5_UpdateLog/UpdateLog.jsx'));
const AdminNotifications = lazy(() => import('./components/Admin/AdminNotifications.jsx'));
const AdminAnnouncements = lazy(() => import('./components/Admin/AdminAnnouncements.jsx'));
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard.jsx'));

// 樣式
import './App.css';
import './styles/themes.css';
import './styles/apple-ui.css';
import './styles/performance.css';
import './styles/animations.css'; // ✅ 新增統一動畫系統
import './styles/LoadingStyles.css'; // ✅ 現代化載入動畫

// 🎯 頁面載入回退組件（現代化版本）
const PageLoadingFallback = ({ pageName }) => (
  <div className="page-loading">
    <div className="loading-content">
      <div className="loading-spinner-container">
        <div className="modern-spinner">
          <div className="spinner-circle"></div>
          <div className="spinner-circle"></div>
          <div className="spinner-circle"></div>
          <div className="spinner-core"></div>
        </div>
      </div>
      <div className="loading-text">載入{pageName}中...</div>
    </div>
  </div>
);

// ✅ Google Analytics 路由追蹤組件
function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({
      hitType: "pageview",
      page: location.pathname + location.search,
      title: document.title
    });

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
        await Promise.all([
          document.fonts.ready,
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

        ]);
        setIsAppReady(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        setIsAppReady(true);
      }
    };
    initializeApp();
  }, []);

  // 🎯 免責聲明處理
  const handleAcceptDisclaimer = () => {
    setShowDisclaimer(false);
    setDisclaimerAccepted(true);
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
    if (metrics && metrics.lcp) {
      ReactGA.event({
        category: 'Performance',
        action: 'Core Web Vitals',
        label: `LCP: ${Math.round(metrics.lcp)}ms`,
        value: Math.round(metrics.lcp)
      });
    }
    if (import.meta.env.DEV) {
      console.log('Performance Metrics:', metrics);
    }
  };

  // 🎯 應用程式未準備好時 - 不顯示重複載入畫面（由 index.html 初始載入動畫處理）
  if (!isAppReady) {
    return null; // index.html 的初始載入動畫會顯示
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <LoadingProvider>
            <PWAProvider>
              <Router>
                <RouteTracker />

                {/* PWA 安裝提示 */}
                <PWAInstallPrompt />

                <DisclaimerModal
                  isVisible={showDisclaimer}
                  onAccept={handleAcceptDisclaimer}
                />

                <PerformanceMonitor
                  isEnabled={import.meta.env.DEV}
                  onMetrics={handlePerformanceMetrics}
                />

                {/* 🎯 主應用程式 - 新佈局結構 */}
                <div className="app-layout">
                  {/* 側邊導航（電腦版） */}
                  <ErrorBoundary fallback={<div className="nav-error">導航欄載入失敗</div>}>
                    <SideNav disclaimerAccepted={disclaimerAccepted} />
                  </ErrorBoundary>

                  {/* 手機版頂部標題欄 */}
                  <MobileHeader />

                  {/* 主內容區域 */}
                  <main className="main-content">
                    <ErrorBoundary>
                      <Suspense fallback={<PageLoadingFallback pageName="頁面" />}>
                        <Routes>
                          <Route path="/" element={
                            <Suspense fallback={<PageLoadingFallback pageName="首頁" />}>
                              <Dashboard />
                            </Suspense>
                          } />
                          <Route path="/course-planner" element={
                            <Suspense fallback={<PageLoadingFallback pageName="智慧排課" />}>
                              <CoursePlanner />
                            </Suspense>
                          } />
                          <Route path="/tracker" element={
                            <Suspense fallback={<PageLoadingFallback pageName="畢業進度" />}>
                              <GraduationTracker />
                            </Suspense>
                          } />
                          <Route path="/calendar" element={
                            <Suspense fallback={<PageLoadingFallback pageName="行事曆" />}>
                              <UniversityCalendar />
                            </Suspense>
                          } />
                          <Route path="/updates" element={
                            <Suspense fallback={<PageLoadingFallback pageName="更新日誌" />}>
                              <UpdateLog />
                            </Suspense>
                          } />
                          <Route path="/admin" element={
                            <Suspense fallback={<PageLoadingFallback pageName="管理中心" />}>
                              <AdminDashboard />
                            </Suspense>
                          } />
                        </Routes>
                      </Suspense>
                    </ErrorBoundary>
                  </main>

                  {/* 底部導航（手機版） */}
                  <BottomNavBar />

                  {/* 推播通知訂閱提示（用戶手動點擊觸發） */}
                  <PushNotificationPrompt />

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
            </PWAProvider>
          </LoadingProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
