# 🎓 暨大生超級助理 (NCNU Super Assistant)

為國立暨南國際大學學生打造的全方位校園服務平台，提供智慧排課、畢業進度追蹤、校園資訊查詢、推播通知等核心功能。

## ✨ 主要功能

### 📚 智慧排課系統

- **課程搜尋與篩選**：支援課程名稱、授課教師、開課系所等多維度搜尋
- **視覺化課表**：直觀的時間表格顯示，支援課程新增/移除
- **衝堂檢測**：自動檢測時間衝突，可選擇隱藏衝堂課程
- **雲端同步**：Google 登入整合，課表資料雲端儲存
- **社群智慧**：顯示課程熱度，了解其他同學的選課趨勢

### 🎓 畢業進度追蹤

- **全校系所支援**：涵蓋100+個系所與學程
- **多學制支援**：學士班、碩士班、博士班完整支援  
- **進度視覺化**：清楚顯示已修課程與剩餘必修
- **獨立儲存**：各系所進度獨立管理，支援轉系需求

### 🏋️ 體育館時間卡片

- **即時開放狀態**：游泳池、健身房、SPA 開放時間一目瞭然
- **橫向日曆選擇器**：可視化選擇日期查看時段
- **實時進度條**：顯示當前時段剩餘時間
- **冬季閉館提醒**：自動判斷特殊閉館日期

### 🔔 推播通知系統

- **即時通知**：接收校園重要公告與活動資訊
- **Safari 推播支援**：完整支援 iOS Safari 推播通知
- **訂閱管理**：可隨時開啟或關閉通知訂閱
- **通知中心**：集中管理已讀/未讀通知

### 🛡️ 管理中心

- **公告管理 (AdminAnnouncements)**：新增、編輯、刪除首頁公告
- **通知推播管理 (AdminNotifications)**：發送與管理推播通知
- **管理儀表板 (AdminDashboard)**：集中式管理介面入口

### 📞 校園服務整合

- **暨大行事曆**：重要校園活動與考試日程
- **常用連結**：Moodle、圖書館門禁系統 QRCode 等快速連結
- **更新日誌**：系統功能更新與改進記錄

### 📦 宿舍包裹查詢

- **即時查詢**：即時查詢學校宿舍未領取包裹（資料來源：學校宿舍包裹系統）
- **多元查詢**：支援依學系或依姓名兩種查詢方式
- **剩餘天數提醒**：根據學校 5 日未領退件規定，顯示剩餘可領天數
- **緊急程度標示**：以顏色區分緊急程度（綠色：安全、黃色：警告、紅色：緊急/逾期）
- **詳細資訊**：顯示包裹編號、到達時間、物流公司、追蹤號碼等完整資訊

### 🌤️ 天氣小工具

- **即時天氣**：顯示埔里地區當前天氣狀況
- **氣溫顯示**：當前溫度與體感溫度
- **天氣圖標**：動態天氣圖標呈現

## 🛠️ 技術架構

### 前端技術

- **框架**：React 19.2.3 + Vite 7.2.7
- **路由**：React Router DOM 7.7.0
- **狀態管理**：React Hooks + Context API
- **國際化**：i18next + react-i18next（多國語系支援）
- **UI 組件**：自定義組件系統
- **樣式**：CSS3 + 響應式設計
- **通知系統**：React Hot Toast 2.5.2
- **PWA**：Service Worker + Web Push API
- **Proxy**: Cloudflare Workers (宿舍包裹查詢代理)

### 後端服務

- **API 服務**：Flask + Python
- **資料庫**：Supabase PostgreSQL
- **身份驗證**：Google OAuth 2.0
- **推播通知**：pywebpush + VAPID 認證
- **資料同步**：RESTful API + Axios

### 部署與CI/CD

- **前端部署**：Vercel (自動化部署)
- **後端部署**：Render (容器化服務)
- **Edge 網路**：Cloudflare Workers
- **版本控制**：GitHub + Git Flow
- **自動化**：GitHub Actions (測試與部署)

## 📁 專案結構

```
ncnu-super-assistant/
├── frontend/                    # React 前端應用
│   ├── public/                  # 靜態資源（圖標、manifest）
│   ├── src/
│   │   ├── components/          # React 元件
│   │   │   ├── 0_Dashboard/     # 首頁儀表板（公告、天氣、體育館時間）
│   │   │   ├── 1_CoursePlanner/ # 智慧排課系統
│   │   │   ├── 2_GraduationTracker/ # 畢業進度追蹤
│   │   │   ├── 4_UniversityCalendar/ # 校園行事曆
│   │   │   ├── 5_UpdateLog/     # 更新日誌
│   │   │   └── Admin/           # 管理中心
│   │   ├── contexts/            # React Context（主題、通知、認證）
│   │   ├── hooks/               # 自定義 Hook
│   │   ├── i18n/                # 多國語系翻譯檔案
│   │   ├── services/            # API 服務
│   │   └── styles/              # 全域樣式
│   └── package.json
├── backend/                     # Flask 後端 API
│   ├── app.py                   # 主應用程式
│   ├── dorm_mail.py             # 宿舍包裹查詢服務 (Legacy)
│   ├── notifications.py         # 通知服務
│   ├── push_service.py          # 推播服務
│   └── requirements.txt
├── workers/                     # Cloudflare Workers
│   ├── dorm-mail-worker.js      # 宿舍包裹代理服務
│   └── wrangler.toml            # Worker 設定檔
├── scripts/                     # 資料處理腳本
│   ├── fetch_calendar.py        # 行事曆同步
│   ├── fetch_departments.py     # 開課單位同步
│   └── ...
└── README.md
```

## 🚀 開發環境設置

### 前置需求

- Node.js 18+
- npm 或 yarn
- Git

### 安裝步驟

**1. 複製專案**

```bash
git clone https://github.com/novoicefire/ncnu-super-assistant.git
cd ncnu-super-assistant
```

**2. 安裝前端依賴**

```bash
cd frontend
npm install
```

**3. 啟動開發伺服器**

```bash
npm run dev
```

### 環境變數設置

- **直接寫在了vercel跟render的環境變數設定中**

- **Vercel (Frontend)**：
  - `VITE_GOOGLE_CLIENT_ID`：Google OAuth 客戶端 ID
  - `VITE_API_URL`：後端 API 網址
  - `VITE_VAPID_PUBLIC_KEY`：推播通知公鑰
  - `VITE_DORM_MAIL_WORKER_URL`：Cloudflare Worker 代理網址 (選填，加速用)

- **Render (Backend)**：
  - `PYTHON_VERSION = 3.11.9`
  - `SUPABASE_KEY`：Supabase 服務金鑰
  - `SUPABASE_URL`：Supabase 專案網址
  - `VAPID_PRIVATE_KEY`：推播通知私鑰
  - `VAPID_PUBLIC_KEY`：推播通知公鑰
  - `VAPID_CLAIMS_EMAIL`：VAPID 認證信箱

## 📈 版本管理

### 手動更新日誌維護

本專案採用手動維護更新日誌的方式，確保每個版本記錄的準確性和完整性。

#### 更新流程

1. **開發完成**：完成新功能開發或問題修復
2. **編輯更新記錄**：在 `frontend/src/components/5_UpdateLog/updateData.js` 新增版本記錄
3. **版本發布**：提交變更並推送到 main 分支
4. **用戶通知**：更新記錄即時顯示在網站上

#### 版本編號規則

- **Major (x.0.0)**：重大功能更新、架構改變
- **Minor (x.y.0)**：新功能新增、功能改善
- **Patch (x.y.z)**：錯誤修復、小幅調整

## 🎯 專案特色

### 🔒 法律保護機制

- **免責聲明系統**：每次載入顯示重要聲明
- **非官方性質**：明確說明與學校官方的關係
- **用戶同意機制**：確保使用者了解服務性質

### 🌐 多國語系支援

- **中文（繁體）**：預設語言
- **英文**：完整英語介面翻譯
- **語言切換**：即時切換，無需刷新頁面

### 🤖 智能化功能

- **課程資料處理**：自動分類和標準化課程資訊
- **智能搜尋**：支援模糊搜尋和同義詞匹配
- **個人化推薦**：基於使用行為的智能建議

### 📱 跨平台支援

- **響應式設計**：完美適配桌面、平板、手機
- **響應式導航**：桌面版側邊導航、行動版頁首與底部導航列
- **深色/淺色主題**：支援主題切換，自動跟隨系統設定
- **PWA 功能**：支援離線使用和桌面安裝
- **PWA 安裝引導**：智能引導用戶安裝應用程式
- **iOS Safe Area 支援**：完整適配 iPhone 瀏海與 Home Indicator
- **跨瀏覽器**：支援 Chrome、Firefox、Safari、Edge

### 🔗 SEO 與社群分享

- **Open Graph 標籤**：社群平台分享預覽優化
- **Meta 描述**：完整的 SEO 元資料設定

## 🛠️ 維護腳本

| 腳本 | 用途 | 執行方式 |
|------|------|----------|
| `scripts/fetch_course_data.py` | 抓取最新課程資料 | GitHub Actions 自動執行 |
| `scripts/fetch_calendar.py` | 同步行事曆資料 | GitHub Actions 每日執行 |
| `scripts/fetch_departments.py` | 同步開課單位資料 | GitHub Actions 每日執行 |
| `scripts/cleanup_push_subscriptions.py` | 清理失效推播訂閱 | 手動執行（見下方說明） |
| `scripts/convert_images.js` | 圖片轉 WebP 格式 | 手動執行 |

### 推播訂閱自動清理

系統內建自動清理機制：當發送推播通知時，若訂閱回傳 **404/410** 錯誤，會自動從資料庫刪除該失效訂閱。

若需手動清理所有失效訂閱，可執行：
```bash
# 預覽模式（不實際刪除）
python scripts/cleanup_push_subscriptions.py --dry-run

# 實際清理
python scripts/cleanup_push_subscriptions.py
```

## 🤝 貢獻指南

歡迎提交 Issue ！

### 開發分支策略

- `main`：正式版本分支
- `develop`：開發分支

### 提交規範

```
type(scope): description
```

**類型說明：**

- `feat`: 新功能
- `fix`: 錯誤修復
- `docs`: 文件更新
- `style`: 程式碼格式
- `refactor`: 重構
- `test`: 測試相關
- `chore`: 其他修改

## 📞 聯絡資訊

- **專案維護**：novoicefire
- **GitHub**：[https://github.com/novoicefire/ncnu-super-assistant](https://github.com/novoicefire/ncnu-super-assistant)
- **問題回報**：[GitHub Issues](https://github.com/novoicefire/ncnu-super-assistant/issues)

## 📜 授權條款

本專案採用 [MIT 授權條款](https://opensource.org/licenses/MIT)，詳見 [LICENSE](https://github.com/novoicefire/ncnu-super-assistant/blob/main/LICENSE) 檔案。
---

**⚠️ 重要聲明**：本專案為非官方學生自主開發，所有資訊請以學校正式公告為準。

**🎓 獻給所有暨大學子**：希望這個工具能讓您的大學生活更加便利！
