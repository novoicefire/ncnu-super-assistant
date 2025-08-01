// frontend/src/components/5_UpdateLog/updateData.js (手動維護版)

export const updateHistory = [
  {
    version: "v3.2.0",
    date: "2025-07-25",
    type: "feature",
    title: "導航欄新增LOGO與IBS專區整合",
    description:"新增自訂Logo支援，國企系學士班手冊Notion連結按鈕"+
                "\n"+
                "(畢竟我是國企的，加個IBS資訊專區的按鈕方便系上學弟妹沒問題的吧)",
    features: [
      "🎨 新增自訂SVG Logo",
      "🎓 整合國企系IBS學士班手冊專區連結",
      "💫 Logo互動效果優化，hover時放大旋轉動畫"
    ],
    technical: [
      "實作SVG Logo動態載入與錯誤處理機制",
      "設計漸層色彩IBS專區按鈕，區別內外部連結",
      "整合React狀態管理控制動畫觸發時機",
      "優化導航欄品牌區域佈局與間距設計",
      "新增多層次動畫效果：發光、光澤、圖示特效"
    ]
  },
  {
    version: "v3.1.0",
    date: "2025-07-24",
    type: "feature",
    title: "智慧排課截圖功能與顯示優化",
    description: "新增課表截圖下載功能，修復班級顯示與課程熱度問題",
    features: [
      "📷 新增課表截圖下載功能，一鍵保存PNG圖片",
      "🔥 調整課程熱度指示器功能，僅在被加進課表的累計人數>0時才顯示",
      "📱 截圖按鈕完美適配響應式設計，支援各種裝置"
    ],
    technical: [
      "整合 html2canvas 套件實現高品質課表截圖",
      "新增截圖狀態管理與使用者回饋機制"
    ]
  },
  {
    version: "v3.0.0",
    date: "2025-07-23",
    type: "major",
    title: "免責聲明系統與AI更新優化",
    description: "重大更新！新增法律保護機制，並全面優化智能更新系統，提供更穩定可靠的服務體驗",
    features: [
      "⚖️ 新增免責聲明公告系統，確保用戶了解服務性質",
      "🔒 每次載入必讀聲明，強化法律保護機制", 
      "🎨 專業公告欄設計，支援響應式全螢幕顯示",
      "🤖 AI 更新日誌系統深度優化，提升生成品質",
      "🔧 API 介面穩定性改善，減少服務中斷問題",
      "📱 手機版免責聲明完美適配，確保所有設備正常顯示"
    ],
    technical: [
      "實作 DisclaimerModal 元件與完整樣式系統",
      "修復前端依賴衝突導致的部署緩慢問題", 
      "改善 Gemini API 調用機制與錯誤處理邏輯",
      "優化 GitHub Actions 工作流程配置"
    ]
  },
  {
    version: "v2.5.0",
    date: "2025-07-22",
    type: "fix",
    title: "課程資訊顯示問題修復",
    description: "修復通識課程分類顯示異常，並優化課程搜尋篩選功能",
    features: [
      "🔧 修復「中文思辨與表達」課程開課單位顯示問題",
      "📚 所有通識課程現在正確歸類至「通識領域課程」",
      "🔍 改善課程篩選功能，確保通識課程可正常搜尋",
      "✨ 智能課程分類機制，自動處理資料不完整的課程",
      "📊 提升課程資訊準確性與完整性"
    ]
  },
  {
    version: "v2.4.0",
    date: "2025-07-22",
    type: "improvement",
    title: "導航欄用戶體驗優化",
    description: "全面改善用戶介面設計，提供更直覺的個人化功能顯示",
    features: [
      "🎨 圓形用戶頭像設計優化",
      "📱 響應式顯示完美適配",
      "🌐 跨瀏覽器相容性提升",
      "✨ 個人資訊區域美化"
    ],
    technical: [
      "修復 CSS backdrop-filter 前綴順序",
      "優化響應式設計斷點",
      "統一 hover 動畫效果"
    ]
  },
  {
    version: "v2.3.0",
    date: "2025-07-22",
    type: "feature",
    title: "AI 智能更新記錄系統",
    description: "導入 Google Gemini AI 自動分析程式變更，生成簡潔易懂的更新說明",
    features: [
      "🤖 Google Gemini AI 內容分析",
      "📝 自動生成用戶友善更新說明",
      "🔄 技術描述智能簡化轉換",
      "⚡ 重複內容自動合併處理"
    ],
    technical: [
      "整合 Gemini API 自然語言處理",
      "建立本地智能後備機制",
      "優化 GitHub Actions 自動化流程"
    ]
  },
  {
    version: "v2.2.0",
    date: "2025-07-22",
    type: "major",
    title: "全校系所畢業進度追蹤",
    description: "重大功能擴展！支援全校所有系所的畢業進度查詢與自動化資料管理",
    features: [
      "🎓 全校 100+ 系所畢業進度支援",
      "🤖 自動化課程資料爬取更新",
      "🧹 智能空資料檢測清理功能",
      "💾 各系所獨立進度儲存機制",
      "📱 手機端查詢體驗優化"
    ],
    technical: [
      "實現動態 JSON 檔案載入",
      "建立標準化檔案命名規則",
      "優化錯誤處理與用戶回饋"
    ]
  },
  {
    version: "v2.1.0",
    date: "2025-07-21",
    type: "feature",
    title: "智能按鈕與通知系統",
    description: "大幅提升課程操作體驗，新增即時反饋與動態視覺設計",
    features: [
      "🎨 動態加入移除課程按鈕",
      "🔔 完整課表變動通知系統",
      "🎯 智能按鈕狀態切換功能",
      "🌐 Safari iOS 完整相容支援",
      "⚡ 課程熱度顯示邏輯優化"
    ],
    technical: [
      "實現毛玻璃效果通知系統",
      "加入 WebKit 瀏覽器前綴支援",
      "優化按鈕動畫與視覺反饋"
    ]
  },
  {
    version: "v2.0.0",
    date: "2025-07-21",
    type: "improvement",
    title: "UI 版面全面優化",
    description: "解決關鍵版面問題，提供一致美觀的使用者介面體驗",
    features: [
      "🔧 修復選單寬度變化問題",
      "📝 精簡班別選擇選項",
      "📅 簡化畢業進度介面設計",
      "🎯 統一輸入框選單寬度",
      "📱 大幅改善手機端操作"
    ],
    technical: [
      "實現固定寬度約束機制",
      "加入文字自動換行控制",
      "優化 CSS box-sizing 一致性"
    ]
  },
  {
    version: "v1.5.0",
    date: "2025-07-21",
    type: "feature",
    title: "雙系所畢業進度支援",
    description: "擴展畢業進度追蹤功能，新增觀餐系觀光組學士班支援",
    features: [
      "🎓 觀餐系觀光組學士班支援",
      "💾 獨立系所進度儲存機制",
      "🔄 系所間流暢切換功能",
      "📊 45 學分完整課程追蹤"
    ],
    technical: [
      "多系所資料檔案管理",
      "獨立 localStorage 儲存邏輯"
    ]
  },
  {
    version: "v1.0.0",
    date: "2025-07-21",
    type: "major",
    title: "暨大生超級助理正式上線",
    description: "🎉 系統正式發布！為暨南大學學生提供全方位校園服務平台",
    features: [
      "📚 智慧排課系統完整功能",
      "🎓 畢業進度追蹤管理系統",
      "📞 校園通訊錄整合服務",
      "📅 暨大行事曆事件列表",
      "🔐 Google 登入雲端同步",
      "🔥 課程社群智慧推薦"
    ],
    technical: [
      "React + Vite 前端架構建立",
      "Flask + Python 後端服務",
      "Supabase PostgreSQL 資料庫",
      "Vercel + Render 雲端部署",
      "GitHub Actions 自動化同步"
    ]
  }
];
