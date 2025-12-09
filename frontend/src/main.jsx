// frontend/src/main.jsx (GIS API 版本 + Google Analytics + i18n)

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './AuthContext.jsx'
import ReactGA from 'react-ga4'
import './i18n' // 導入 i18n 配置

// 🎯 初始化 Google Analytics
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

if (GA_MEASUREMENT_ID) {
  ReactGA.initialize(GA_MEASUREMENT_ID, {
    gtagOptions: {
      send_page_view: false // 我們會在 App.jsx 中手動追蹤
    }
  })
  console.log('✅ Google Analytics 已初始化')
} else {
  console.warn('⚠️ Google Analytics ID 未設定')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)

// 🎯 React 應用掛載後隱藏初始載入動畫
setTimeout(() => {
  if (window.hideInitialLoader) {
    window.hideInitialLoader();
  }
}, 500); // 給一點延遲確保首屏渲染完成
