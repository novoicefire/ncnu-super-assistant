// frontend/src/components/5_UpdateLog/updateData.js

export const updateHistory = [
  {
    version: "v2.2.0",
    date: "2025-01-21", 
    type: "major",
    title: "全校系所畢業進度追蹤支援",
    description: "重大功能擴展！現在支援全校所有系所的畢業進度查詢，並新增了自動化資料管理機制。",
    features: [
      "🎓 支援全校100+系所的畢業進度查詢",
      "🤖 自動化課程資料爬取與更新機制",
      "🧹 智慧空資料檢測與清理功能",
      "💾 完全獨立的各系所進度儲存",
      "📱 優化手機端畢業進度查詢體驗"
    ],
    technical: [
      "實現動態 JSON 檔案載入機制",
      "建立標準化的資料檔案命名規則",
      "優化錯誤處理與使用者回饋"
    ]
  },
  {
    version: "v2.1.0", 
    date: "2025-01-15",
    type: "feature",
    title: "動態按鈕與通知系統",
    description: "大幅提升課程操作的使用者體驗，新增即時通知反饋。",
    features: [
      "🎨 全新動態加入/移除課程按鈕設計",
      "🔔 完整的課表變動通知系統",
      "🎯 智慧按鈕狀態切換（綠色加號 ↔ 紅色減號）",
      "🌐 Safari 和 iOS 瀏覽器完整相容性",
      "⚡ 優化課程熱度顯示邏輯"
    ],
    technical: [
      "實現毛玻璃效果通知系統",
      "加入 WebKit 瀏覽器前綴支援",
      "優化按鈕動畫與視覺反饋"
    ]
  },
  {
    version: "v2.0.0",
    date: "2025-01-10", 
    type: "major",
    title: "UI 寬度修復與內容調整",
    description: "解決關鍵的版面問題，提供一致的使用者介面體驗。",
    features: [
      "🔧 修復選單寬度隨內容變化的問題", 
      "📝 移除「通識」選項，精簡班別選擇",
      "📅 簡化畢業進度介面，移除學年度欄位",
      "🎯 統一輸入框和下拉選單寬度",
      "📱 優化響應式設計，改善手機端體驗"
    ],
    technical: [
      "實現固定寬度約束機制",
      "加入文字自動換行控制",
      "優化 CSS box-sizing 一致性"
    ]
  },
  {
    version: "v1.5.0",
    date: "2024-12-20",
    type: "feature", 
    title: "雙系所畢業進度支援",
    description: "擴展畢業進度追蹤功能至觀餐系觀光組。",
    features: [
      "🎓 新增觀餐系觀光組學士班支援",
      "💾 獨立的系所進度儲存機制",
      "🔄 系所間流暢切換功能",
      "📊 45學分完整課程追蹤"
    ]
  },
  {
    version: "v1.0.0",
    date: "2024-12-01",
    type: "major",
    title: "暨大生超級助理正式上線",
    description: "🎉 系統正式發布！為暨南大學學生提供全方位的校園服務。",
    features: [
      "📚 智慧排課系統 - 課程搜尋、篩選與課表管理",
      "🎓 畢業進度追蹤 - 國企系學士班必修課程管理", 
      "📞 校園通訊錄 - 完整的校園單位聯絡資訊",
      "📅 暨大行事曆 - 垂直滾動式事件列表設計",
      "🔐 Google 登入整合 - 雲端課表同步",
      "🔥 課程熱度顯示 - 社群智慧功能"
    ],
    technical: [
      "React + Vite 前端架構",
      "Flask + Python 後端服務", 
      "Supabase PostgreSQL 資料庫",
      "Vercel + Render 雲端部署",
      "GitHub Actions 自動化同步"
    ]
  }
];
