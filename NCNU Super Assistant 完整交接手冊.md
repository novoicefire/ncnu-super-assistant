# NCNU Super Assistant 完整維護與交接手冊

> 本手冊整合了技術交接與非技術背景維護指南，旨在讓任何接手者都能快速上手、順利維運。

## 1. 專案總覽

**NCNU Super Assistant** 為國立暨南大學學生設計的單頁式應用(SPA)，整合四大核心功能：

*   **課程規劃 (Course Planner)**
*   **智慧排課系統 (Smart Course Planner)**（v6.1.0 新增，含必修課追蹤與自動排課建議）
*   **校園單位導覽 (Campus Directory)**
*   **校園行事曆 (University Calendar)**

### 1.1. 技術架構速覽

| 面向 | 技術 / 平台 | 關鍵文件/位置 | 運維重點 |
| :--- | :--- | :--- | :--- |
| **前端** | React 19.2 + Vite 7.2 | `frontend/` | Vercel 自動化部署 |
| **後端** | Python 3.11 + Flask | `backend/app.py` | Render Web Service (Gunicorn) |
| **資料庫** | Supabase (PostgreSQL) | `users`, `schedules`, `notifications` 表 | RLS 安全策略、金鑰管理 |
| **身分驗證** | Google OAuth 2.0 | `frontend/src/AuthContext.jsx` | GCP OAuth 憑證需定期更新 |
| **推播通知** | Web Push + VAPID | `backend/push_service.py` | VAPID 金鑰管理 |
| **多國語系** | i18next | `frontend/src/i18n/` | 翻譯檔案維護 |
| **Edge 代理** | Cloudflare Workers | `workers/` | 宿舍包裹查詢加速 |
| **自動化任務** | GitHub Actions | `.github/workflows/` (3個工作流程) | 資料同步、服務保活、資料庫監控 |
| **版本管理** | Git (GitFlow) | `main` (生產), `develop` (開發) | PR 審核後自動部署 |

## 2. 系統架構與資料流程

```mermaid
flowchart LR
  subgraph Frontend (Vercel)
    A[User Browser] -->|HTTPS| B[React SPA]
    B -->|API Call| C[Backend API]
  end

  subgraph Backend (Render)
    C -->|Supabase Client| D[Supabase Database]
    C -->|Legacy API| E[NCNU API]
  end

  subgraph Edge (Cloudflare)
    K[Workers] -->|Proxy| E
  end

  subgraph Automation (GitHub)
    F[Weekly Sync] -->|每週一| G[scripts/fetch_course_data.py]
    L[Daily Sync] -->|每日| M[scripts/fetch_calendar/dept.py]
    G & M -->|git push| H[GitHub Repo]
    H -->|Webhook| B
    J[Supabase Keep-Alive] -->|定時| D
  end
```

### 資料流程說明

1.  **前端 (Vercel)**: 
    - 使用者在瀏覽器操作 React 單頁應用
    - 透過 `apiHelper.js` 呼叫後端 API
    - 自動喚醒休眠的後端服務
    - React.lazy() 實現組件懶加載，提升首次載入速度

2.  **後端 (Render)**: 
    - Flask 應用接收 API 請求
    - 透過 Supabase 客戶端存取使用者資料（課表、彈性課程）
    - **懶加載機制**：靜態資料（校園聯絡資訊、行事曆）僅在首次請求時載入
    - 快取 NCNU API 資料，避免重複呼叫外部服務

3.  **自動化機制 (GitHub Actions)**: 
    - **每週課程同步**：每週一 02:00 執行，抓取最新課程資料並推送到 GitHub，觸發 Vercel 自動部署
    - **Keep-Alive 保活**：每 5 分鐘 ping 後端服務（台灣時間 07:00-23:59），避免 Render 免費方案休眠
    - **Supabase 保活**：定時維持資料庫連線池活躍
    - **智能時段控制**：非選課期間（10-12月、3-6月）自動暫停課程資料同步

## 3. 專案檔案結構

```
ncnu-super-assistant/
├─ .github/
│  └─ workflows/
│     ├─ daily_data_sync.yml      # 每日課程與開課單位資料同步
│     ├─ update-calendar.yml      # 🆕 每日行事曆同步
│     ├─ supabase-keepalive.yml   # Supabase 資料庫保活
│     └─ keepalive.yml            # 備用保活腳本
├─ backend/
│  ├─ app.py                    # 後端 Flask API 主程式
│  ├─ dorm_mail.py              # 宿舍包裹查詢服務 (Legacy)
│  ├─ notifications.py          # 通知服務 API
│  ├─ push_service.py           # Web Push 推播服務
│  └─ requirements.txt          # Python 套件依賴
├─ workers/                     # 🆕 Cloudflare Workers
│  ├─ dorm-mail-worker.js       # 宿舍包裹代理服務
│  └─ wrangler.toml             # Worker 設定檔
├─ frontend/
│  ├─ public/
│  │  ├─ data/                  # 自動同步的靜態資料 (JSON)
│  │  │  ├─ calendar.json       # 🆕 靜態行事曆
│  │  │  └─ departments.json    # 🆕 靜態系所清單
│  │  ├─ icons/                 # PWA 應用圖標
...
├─ scripts/
│  ├─ convert_excel.py        # Excel 轉換腳本
│  ├─ fetch_course_data.py      # 抓取課程資料腳本
│  ├─ fetch_calendar.py         # 🆕 抓取行事曆腳本
│  ├─ fetch_departments.py      # 🆕 抓取系所腳本
│  └─ convert_images.js         # 🆕 圖片轉 WebP 腳本
├─ .gitignore
├─ README.md
└─ package.json                 # 專案級套件依賴
```

## 4. 環境設定與部署

### 4.1. 本地開發

**後端:**
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
pip install -r requirements.txt
# 設定環境變數 (參考 .env.example)
flask run
```

**前端:**
```bash
cd frontend
npm install
npm run dev
```

### 4.2. 雲端部署

| 服務 | 設定項 | 值 |
| :--- | :--- | :--- |
| **Render (後端)** | Build Command | `pip install -r requirements.txt` |
| | Start Command | `gunicorn app:app` |
| **Vercel (前端)** | Build Command | `npm install && npm run build` |
| | Output Directory | `dist` |
| | Root Directory | `frontend` |

### 4.3. 環境變數

#### 雲端服務環境變數

| 位置 | 變數 | 用途 |
| :--- | :--- | :--- |
| **Render** | `SUPABASE_URL` | Supabase 專案 URL |
| | `SUPABASE_KEY` | Supabase 專案 Public Key |
| | `VAPID_PRIVATE_KEY` | 🆕 Web Push 私鑰 |
| | `VAPID_PUBLIC_KEY` | 🆕 Web Push 公鑰 |
| | `VAPID_CLAIMS_EMAIL` | 🆕 VAPID 認證信箱 |
| **Vercel** | `VITE_API_URL` | 指向 Render 後端服務的 URL |
| | `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| | `VITE_VAPID_PUBLIC_KEY` | 🆕 Web Push 公鑰（前端用）|
| | `VITE_DORM_MAIL_WORKER_URL` | 🆕 Worker 代理網址（選填）|

#### GitHub Secrets (自動化任務用)

| 變數 | 用途 | 設定位置 |
| :--- | :--- | :--- |
| `DISCORD_WEBHOOK` | Discord 警報通知 URL | GitHub Repo Settings → Secrets |
| `GITHUB_TOKEN` | 自動生成，用於推送代碼 | 系統自動提供 |

※ 重要：`DISCORD_WEBHOOK` 需自行在 Discord 伺服器建立 Webhook 並設定至 GitHub Secrets

## 5. API 參考

### 5.1. API 端點列表

| 路由 | 方法 | 描述 | 認證 | 備註 |
| :--- | :--- | :--- | :--- | :--- |
| `/` | GET | 後端健康檢查 | 無 | 返回版本資訊 |
| `/api/auth/google` | POST | Google 登入驗證，新增/更新使用者 | Bearer Token | 使用 Google OAuth |
| `/api/schedule` | GET/POST | 讀取/儲存個人排課資料 | Supabase Auth | v5.0+ 支援彈性課程 |
| `/api/courses/hotness`| GET | 計算課程熱門度 | 公開 | 包含固定與彈性課程 |
| `/api/courses/hotness`| GET | 計算課程熱門度 | 公開 | 包含固定與彈性課程 |
| `/api/notifications` | GET | 🆕 取得所有通知 | 公開 | 支援分頁 |
| `/api/notifications` | POST | 🆕 發送新通知 | 管理員 | 需驗證管理員權限 |
| `/api/notifications/<id>` | DELETE | 🆕 刪除通知 | 管理員 | 需驗證管理員權限 |
| `/api/push/subscribe` | POST | 🆕 訂閱推播通知 | Bearer Token | Web Push 訂閱 |
| `/api/push/unsubscribe` | POST | 🆕 取消訂閱推播 | Bearer Token | 移除訂閱 |
| `/api/announcements` | GET/POST | 🆕 公告管理 | 管理員 | 首頁公告 CRUD |
| `/api/dorm-mail` | GET | 🆕 宿舍包裹查詢 | 公開 | 支援 department 或 name 參數 |
| `/api/graduation-progress` | GET/POST | 🆕 必修課進度存取 | Supabase Auth | 儲存/讀取必修課進度與已修課程 |
| `/api/graduation-progress/sync` | POST | 🆕 從課表同步進度 | Supabase Auth | 自動分析歷史課表並標記已修畢 |
| `Workers Proxy` | GET | 🆕 宿舍包裹查詢 (加速) | 公開 | 建議優先使用 Cloudflare Worker |

### 5.2. 重要 API 說明

#### `/api/schedule` 資料格式（v5.0+）

**回傳格式：**
```json
{
  "schedule_data": {
    "Mon-1": { "course_id": "...", "course_name": "..." },
    ...
  },
  "flexible_courses": [
    { "course_id": "...", "course_name": "專題研究", "credits": 3 },
    ...
  ]
}
```

**說明：**
- `schedule_data`: 固定時間課程（按時段儲存）
- `flexible_courses`: 彈性課程陣列（無固定時間）
- 兩者學分會自動整合計算

#### `/api/courses/hotness` 熱度計算

同時計算固定課程和彈性課程的選課人數，回傳格式：
```json
{
  "course_id_1": 15,
  "course_id_2": 8,
  ...
}
```


## 6. 故障排除

| 症狀 | 可能原因 | 解決方案 |
| :--- | :--- | :--- |
| **CORS 錯誤** | 前端網域未被後端允許 | 檢查 Render `ALLOWED_ORIGINS` 環境變數。 |
| **網站很慢/無回應** | Render 免費方案休眠 | 重新整理頁面，`apiHelper.js` 會自動喚醒。Keep-Alive 機制應避免此問題。 |
| **Google 登入失敗** | OAuth Client ID 設定錯誤 | 檢查 Vercel `VITE_GOOGLE_CLIENT_ID` 與 GCP 設定。 |
| **課程資料過舊** | GitHub Actions 同步失敗 | 前往 GitHub Repo 的 Actions 頁面檢查執行紀錄。 |
| **Discord 警報未收到** | Webhook URL 設定錯誤 | 檢查 GitHub Secrets 中 `DISCORD_WEBHOOK` 設定。 |
| **彈性課程未同步** | 前端版本過舊 | 確認前端為 v5.0+，清除瀏覽器快取。 |

---

## 6.1. 🔧 自動化機制詳細說明

### GitHub Actions 工作流程解析

#### 1️⃣ 每週課程資料同步 (`daily_data_sync.yml`)

**執行時間**：每週一 18:00 UTC（台灣時間週二凌晨 02:00）

**智能時段控制**：
- 停止更新期間：10-12月、3-6月（非選課期間）
- 允許更新期間：1-2月、7-9月（選課期間）

**工作流程**：
1. 檢查當前月份是否在允許更新期間
2. 執行 `scripts/fetch_course_data.py` 抓取 NCNU API 課程資料
3. 同時更新 `main` 和 `develop` 分支
4. 推送至 GitHub，觸發 Vercel 自動部署

**手動觸發**：GitHub Actions 頁面點擊 "Run workflow"

#### 2️⃣ Render 後端保活 (`keep-render-alive.yml`)

**執行時間**：每 5 分鐘（台灣時間 07:00-23:59）

**功能**：
- 定時 ping `https://ncnu-assistant-backend.onrender.com`
- 避免 Render 免費方案因閒置 15 分鐘而休眠
- 確保使用者無需等待後端啟動（冷啟動需 30-60 秒）

**異常處理**：
- 如果服務回應異常（非 200）或連線失敗
- 自動發送 Discord 警報通知
- 超時情況不發送通知（正常現象）

#### 3️⃣ Supabase 資料庫保活 (`supabase-keepalive.yml`)

**執行時間**：定時執行

**功能**：保持 Supabase 連線池活躍，避免長時間無活動導致連線斷開

### 推播訂閱清理機制

#### 自動清理（內建）

當發送推播通知時，系統會自動清理失效的訂閱。
位於 `backend/push_service.py` 的 `send_push_notification` 函數中：

```python
# 當推播失敗時，檢查錯誤碼：
# - 404: 訂閱端點不存在（用戶可能清除了瀏覽器資料）
# - 410: 訂閱已過期（Gone）
# 這兩種情況表示訂閱已失效，自動從資料庫刪除
if e.response and e.response.status_code in [404, 410]:
    supabase.table('push_subscriptions').delete().eq(
        'endpoint', sub['endpoint']
    ).execute()
```

#### 手動清理

若需一次性清理所有失效訂閱，可使用 `scripts/cleanup_push_subscriptions.py`：

```bash
# 預覽模式（只顯示會刪除的訂閱，不實際執行）
python scripts/cleanup_push_subscriptions.py --dry-run

# 實際執行清理
python scripts/cleanup_push_subscriptions.py
```

**環境需求**：需從 `backend/.env` 讀取 Supabase 與 VAPID 設定

## 6.2. 📝 資料維護流程

### 更新日誌維護（手動流程）

**位置**：`frontend/src/components/5_UpdateLog/updateData.js`

**維護流程**：
1. 完成新功能開發或問題修復
2. 編輯 `updateData.js` 檔案
3. 在 `updateHistory` 陣列最前面新增版本記錄

**版本編號規則**：
- **Major (x.0.0)**：重大功能更新、架構改變（如 v5.0.0 彈性課程）
- **Minor (x.y.0)**：新功能新增、功能改善（如 v4.2.0 行事曆優化）
- **Patch (x.y.z)**：錯誤修復、小幅調整（如 v4.2.1 修復顯示問題）

**更新類型**：
- `major`: 重大更新
- `feature`: 新功能
- `improvement`: 改進優化
- `fix`: 錯誤修復

**範例記錄格式**：
```javascript
{
  version: "v5.1.0",
  date: "2025-11-20",
  type: "feature",
  title: "新功能標題",
  description: "詳細說明...",
  features: [
    "✅ 功能點1",
    "✅ 功能點2"
  ],
  technical: [
    "技術細節1",
    "技術細節2"
  ]
}
```

### 必修課進度資料管理

**位置**：`frontend/public/data/`

**檔案命名規則**：`course_require_114_XX_Y.json`
- `114`：學年度
- `XX`：系所代碼（00-99）
- `Y`：學制（B=學士、G=碩士、P=博士）

**目前涵蓋**：100+ 個系所與學程的必修課程資料

**更新方式**：
1. 從學校教務系統取得最新必修科目表
2. 使用 `scripts/convert_excel.py` 轉換 Excel 為 JSON
3. 放入 `frontend/public/data/` 目錄
4. 推送至 GitHub，Vercel 自動部署

**資料格式**：
```json
{
  "department": "系所名稱",
  "degree": "學士班",
  "courses": [
    {
      "course_name": "課程名稱",
      "credits": 3,
      "category": "必修"
    }
  ]
}
```

## 6.3. 🆕 重要功能更新說明

### 🆕 必修課追蹤整合與同步 (2026-01)

**功能說明**：
- **整合至 CoursePlanner**：不再是獨立頁面，而是作為排課頁面的 `GraduationPanel` 面板，方便對照。
- **一鍵同步功能**：後端 `/api/graduation-progress/sync` 自動掃描使用者歷史課表，比對課程名稱/代碼，自動勾選已修畢的必修課。
- **多語言與搜尋優化**：課程篩選器支援中英雙語搜尋，並新增 Course ID 搜尋功能。

**技術實作**：
- **Hook 重構**：`useCourseData` 統一管理課程資料流，減少分散的 API 呼叫。
- **後端同步邏輯**：使用 `difflib` 進行課程名稱模糊比對，並結合 Course ID 精確比對，提高自動標記準確度。
- **I18n 增強**：解決了教師與系所名稱在英文模式下的顯示問題。

### 🆕 排課系統 UI 優化（2026-01）

**功能說明**：
- **手機版體驗升級**：搜尋按鈕改為懸浮按鈕 (FAB)，操作更順手；BottomSheet 面板新增「上課時間」篩選。
- **衝堂顯示模式**：支援「顯示全部」、「灰色標示」、「完全隱藏」三種模式，讓使用者更彈性地處理衝堂課程。
- **介面佈局調整**：手機版將已選課表置頂，彈性課程在下，優化閱讀動線。
- **學年設定優化**：移至頁首卡片內，改為行內顯示，減少頁面占用空間。

**技術實作**：
- **CSS Order**：利用 Flexbox `order` 屬性在不改變 DOM 結構下調整手機版佈局。
- **Conflict Mode**：重構過濾邏輯，將原本的 boolean `hideConflicting` 升級為 enum `conflictMode`。
- **Responsive Design**：針對 FAB 與 BottomSheet 進行細緻的 RWD 調整。

### v5.0.0 - 彈性課程功能（2025-11-16）

**背景**：許多課程沒有固定上課時間（專題研究、校外實習、線上非同步課程等），舊版系統無法管理這類課程。

**解決方案**：
- 新增 `flexible_courses` 資料欄位（JSONB 陣列）
- 前端新增獨立的彈性課程管理區塊
- 學分計算自動整合固定課程與彈性課程

**資料庫變更**：
```sql
-- Supabase schedules 表新增欄位
ALTER TABLE schedules 
ADD COLUMN flexible_courses JSONB DEFAULT '[]'::jsonb;
```

**API 變更**：
- `/api/schedule` GET: 回傳包含 `flexible_courses` 陣列
- `/api/schedule` POST: 接收並儲存 `flexible_courses`
- `/api/courses/hotness`: 同時計算固定與彈性課程熱度

**前端使用**：
- 課程規劃頁面下方新增「彈性課程」區塊
- 支援新增、刪除彈性課程
- 學分統計自動包含彈性課程

**向後相容**：舊版前端（v4.x）仍可正常使用，只是看不到彈性課程功能

### 🆕 推播通知系統（2025-12）

**功能說明**：
- Web Push 通知，支援 Chrome、Firefox、Safari
- iOS Safari 推播完整支援（需 iOS 16.4+）
- 管理員可透過後台發送通知給所有訂閱用戶

**技術實作**：
- 前端：`usePushNotification.js` Hook 處理訂閱邏輯
- 後端：`push_service.py` 使用 pywebpush 發送通知
- 認證：VAPID 金鑰對（公鑰/私鑰）

**資料庫**：
```sql
-- Supabase 新增 push_subscriptions 表
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**環境變數**：
- `VAPID_PUBLIC_KEY`：公鑰（前後端共用）
- `VAPID_PRIVATE_KEY`：私鑰（僅後端）
- `VAPID_CLAIMS_EMAIL`：聯絡信箱

### 🆕 管理中心（2025-12）

**位置**：`frontend/src/components/Admin/`

**功能模組**：
- `AdminDashboard.jsx`：管理首頁，功能入口
- `AdminAnnouncements.jsx`：首頁公告 CRUD 管理
- `AdminNotifications.jsx`：推播通知發送與管理

**權限控制**：
- 管理員帳號由 Supabase `users` 表的 `is_admin` 欄位決定
- 非管理員無法進入 `/admin` 路由

### 🆕 多國語系（2025-12）

**位置**：`frontend/src/i18n/`

**支援語言**：
- 繁體中文（`zh-TW.json`）- 預設
- 英文（`en.json`）

**使用方式**：
```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('nav.dashboard')}</h1>;
}
```

**新增翻譯步驟**：
1. 在 `zh-TW.json` 新增中文鍵值
2. 在 `en.json` 新增對應英文翻譯
3. 在元件中使用 `t('key')` 取得翻譯

### 🆕 PWA 支援（2025-12）

**功能**：
- 離線存取（Service Worker 快取）
- 桌面/手機安裝為獨立 App
- iOS Safe Area 完整支援

**關鍵檔案**：
- `frontend/public/manifest.json`：PWA 設定
- `frontend/public/service-worker.js`：Service Worker
- `frontend/src/components/PWAInstallPrompt.jsx`：安裝引導

### 🆕 響應式導航（2025-12）

**元件**：
- `SideNav.jsx`：桌面版左側固定導航
- `MobileHeader.jsx`：行動版頂部導航（含用戶選單）
- `BottomNavBar.jsx`：行動版底部導航列

### 🆕 宿舍包裹查詢（2025-12）

**功能說明**：
- 即時查詢學校宿舍未領取包裹
- 支援依學系或依姓名兩種查詢方式
- 根據學校「5 日未領退件」規定，顯示剩餘可領天數
- 緊急程度以顏色標示（綠色：≥3天、黃色：2天、紅色：≤1天或逾期）

**技術實作**：
- 前端：`DormMailCard.jsx` + `DormMailCard.css`
- 後端：`dorm_mail.py` 模組
- 資料來源：爬取 `https://ccweb.ncnu.edu.tw/dormmail/Default.asp`

**後端 API**：
- `/api/dorm-mail?department=資工` - 依學系查詢
- `/api/dorm-mail?name=武星星` - 依姓名查詢

**注意事項**：
- 網頁使用 Big5 編碼，程式已自動處理編碼轉換
- 姓名查詢支援智慧匹配（如「武星星」會自動轉換為「武Ｏ星」進行比對）

### v4.0.0 - Dashboard 首頁與深色模式（2025-08-03）

**重大更新**：
- 全新 Dashboard 儀表板首頁設計
- 深色模式系統（支援全站主題切換）
- 多媒體公告區（支援圖片、影片、自訂按鈕）
- 今日狀態卡片（顯示今日課程、總學分、今日活動）

**技術實作**：
- CSS 變數系統實現主題切換
- 新增 `0_Dashboard/` 組件目錄
- LocalStorage 儲存主題偏好設定

### 安全機制與法律保護

#### CORS 白名單機制

**位置**：`backend/app.py` 第 20-25 行

```python
ALLOWED_ORIGINS = [
    "https://ncnu-super-assistant.vercel.app",  # 正式版
    "https://ncnu-super-assistant-git-develop-yoialexs-projects.vercel.app", # 測試版
    "http://localhost:5173"  # 本地開發
]
```

**說明**：
- 後端硬編碼允許的前端來源
- 防止未經授權的網站呼叫 API
- 新增部署環境需更新此列表

#### 服務條款系統（DisclaimerModal）

**位置**：`frontend/src/components/DisclaimerModal.jsx`

**功能**：
- 8 章節完整服務條款（服務性質、免責聲明、使用者義務、隱私、智財權、條款變更、法律管轄、聯絡方式）
- 版本控制機制（`DISCLAIMER_VERSION` 於 `App.jsx`，更新版本號強制重新顯示）
- 使用者同意記錄儲存於 localStorage（版本號 + 同意日期）
- 可從側邊欄/底部導覽列隨時重新開啟查看

**顯示模式**：
- 首次訪問：雙按鈕（同意/不同意），必須同意才能使用
- 被動開啟（從導航欄）：單按鈕（關閉），顯示上次同意日期

**相關元件**：使用統一的 `BottomSheet` 元件（`frontend/src/components/common/BottomSheet.jsx`）

**觸發時機**：首次訪問或條款版本更新時自動顯示；使用者可從導航欄手動開啟

### 效能優化機制

#### 懶加載（Lazy Loading）

**後端懶加載**：`backend/app.py` 第 47-88 行

```python
def load_static_data_if_needed():
    """首次使用時才載入靜態資料"""
    if not data_loaded.is_set():
        # 載入校園聯絡資訊、開課單位、行事曆等
        ...
```

**優點**：
- 後端啟動快速（不等待外部 API）
- 靜態資料僅在首次請求時載入
- 避免 NCNU API 或 Google Calendar 超時影響啟動

**前端懶加載**：React.lazy() + Suspense

```javascript
const CoursePlanner = lazy(() => import('./components/1_CoursePlanner/CoursePlanner'));
```

**優點**：
- 減少初始載入檔案大小
- 改善首次渲染速度
- 按需載入各功能模組

#### 課程熱度快取機制

- 熱度計算在後端進行，避免前端重複計算
- 統計所有使用者的選課資料
- 即時反映課程受歡迎程度

---

## 7. 🤖 AI 維護指南 (非技術背景適用)

本章節專為**非資訊科技背景**的維護者設計，讓商管學院的同學也能輕鬆用 AI 工具維護網站。

### 7.1. 核心概念

把 AI 當作你的**隨身技術顧問**。你只需要描述問題、複製貼上、並按照步驟操作，就能完成大部分的維護工作。

### 7.2. AI 工具箱

1.  **ChatGPT / Claude**: 用於問題診斷、程式碼生成、步驟指導。
2.  **GitHub Desktop**: 圖形化介面，用來同步與管理程式碼，操作像雲端硬碟一樣簡單。
3.  **Visual Studio Code**: 程式碼編輯器，搭配 AI 外掛（如 GitHub Copilot）可自動完成程式碼。

### 7.3. 實戰場景：用 AI 解決問題

#### 場景一：網站突然變得很慢

**你的提問 (Prompt):**
```
我的網站 NCNU Super Assistant 今天變得很慢。
- 網站資訊：前端在 Vercel，後端在 Render。
- 問題：課程查詢功能特別慢。
請幫我診斷可能的原因和解決方法，我不懂程式設計，請給我簡單的步驟。
```

**AI 可能的回答與你的操作：**
1.  **AI 建議**: 「請先確認後端服務是否因閒置而休眠。」
2.  **你的操作**: 重新整理網頁。如果恢復正常，問題解決。
3.  **AI 建議**: 「如果問題持續，請檢查 Render 後台的日誌(Log)是否有錯誤訊息。」
4.  **你的操作**: 登入 Render，複製日誌並貼給 AI 分析。

#### 場景二：想新增「課程評價」功能

**你的提問 (Prompt):**
```
我想在 NCNU Super Assistant 新增課程評價功能。
- 需求：讓學生能對課程評分(1-5星)和寫評論。
- 技術背景：前端 React，後端 Flask，資料庫 Supabase。
請給我完整的實作步驟和需要修改的程式碼，我會複製貼上。
```

**AI 可能的回答與你的操作：**
1.  **AI**: 提供 Supabase 新增資料表的 SQL 指令。
2.  **你**: 複製指令到 Supabase 的 SQL Editor 執行。
3.  **AI**: 提供後端 `app.py` 新增的 API 路由程式碼。
4.  **你**: 在 VS Code 中打開 `app.py`，貼上程式碼。
5.  **AI**: 提供前端 React 元件的程式碼。
6.  **你**: 在 `frontend/src/components/` 資料夾下新增檔案並貼上程式碼。
7.  **你**: 使用 GitHub Desktop 提交(Commit)並推送(Push)變更。

### 7.4. 與 AI 協作的最佳實踐

*   **提供充足背景**: 每次提問都附上網站的技術架構。
*   **分階段提問**: 先問「原因」，再問「解法」，最後問「如何預防」。
*   **要求 AI 自我檢查**: 「請檢查你剛才提供的代碼，是否有安全隱患或寫錯的地方？」

## 8. 未來開發藍圖：打造暨大師生的超級助理

### 🎯 願景：一站式校園生活輔助平台

> **目標**：從「選課工具」進化為「校園生活不可或缺的超級平台」，串聯大學生的學習、生活、社交、資訊等各種需求，成為暨南大學師生每天都會打開的 App。

### 已實現功能 ✅

- ✅ **智慧選課系統**（v1.0-v5.0）：課程規劃、彈性課程、課表管理
- ✅ **必修課追蹤**（v2.2）：全校 100+ 系所必修課程追蹤
- ✅ **校園資訊整合**（v1.0）：行事曆、更新日誌、常用連結
- ✅ **Dashboard 首頁**（v4.0.0）：儀表板設計與深色模式
- ✅ **自動化監控**（2025）：Keep-Alive 機制確保服務穩定
- ✅ **🆕 推播通知系統**（2025-12）：Web Push 通知、Safari 推播支援
- ✅ **🆕 管理中心**（2025-12）：公告管理、通知推播管理
- ✅ **🆕 多國語系**（2025-12）：繁體中文、英文介面
- ✅ **🆕 PWA 支援**（2025-12）：離線使用、桌面安裝、安裝引導
- ✅ **🆕 響應式導航**（2025-12）：桌面側邊導航、行動版頁首與底部導航
- ✅ **🆕 體育館時間卡片**（2025-12）：游泳池、健身房、SPA 開放時間
- ✅ **🆕 天氣小工具**（2025-12）：埔里地區即時天氣
- ✅ **🆕 宿舍包裹查詢**（2025-12）：查詢未領包裹、剩餘天數提醒、緊急程度標示

---

## 第一階段：深化學習管理功能（1-3 個月）

### 📚 選課與課表強化

*   **智能選課助手**
    *   課程衝堂自動檢測與替代方案建議
    *   拖曳排課功能（直覺化課表安排）
    *   課表匯出 iCal（同步至 Google Calendar、Apple 日曆）
    *   選課推薦系統（基於畢業要求、興趣標籤、同學選課）

*   **課程資訊深化**
    *   課程評價與評論系統（匿名/實名雙模式）
    *   歷年成績分布統計（A/B/C 比例、平均成績）
    *   授課方式標籤（實體/線上/混合、中文/英文）
    *   課程大綱與教材預覽

### 🤖 AI 智能選課規劃

*   **AI 畢業路徑規劃師**
    *   **智能分析**：AI 自動解析系所畢業條件（必修、選修、通識、學分門檻）
    *   **歷史數據**：分析過去 3-5 年各課程開課時間與頻率
    *   **路徑規劃**：自動生成 4 年選課時間表，確保順利畢業
    *   **動態調整**：根據已修課程即時更新剩餘修課建議
    *   **風險預警**：標示稀有課程（2年才開一次）、停開風險課程
    *   **多方案比較**：提供 2-3 種不同畢業路徑（速成、均衡、輕鬆）

*   **智能選課建議**
    *   課程修課順序建議（先修課程檢查）
    *   學期學分負擔預測（根據課程難度）
    *   最佳修課時機提醒（大二修、大三修建議）
    *   跨領域學習路徑（輔系、雙主修、學程規劃）

### 🗺️ 校園精細導航系統

*   **3D 室內導航**
    *   **教學樓層平面圖**：每棟建築每一層樓的詳細地圖
    *   **教室定位**：精確到每間教室（如「人文學院 205 教室」）
    *   **辦公室導航**：系所辦公室、行政單位、教授研究室
    *   **便利設施**：廁所、飲水機、電梯、樓梯位置標示

*   **校園生活地圖**
    *   **餐飲店家**：餐廳、咖啡廳、小吃攤位置與營業時間
    *   **服務設施**：ATM、影印店、書局、郵局、超商
    *   **休憩空間**：自習室、休息區、戶外座椅
    *   **運動場地**：籃球場、網球場、健身房、操場

*   **智能路線規劃**
    *   **課間導航**：上課前 10 分鐘自動規劃最快路線
    *   **步行時間預估**：考慮建築間距離與樓層
    *   **無障礙路線**：電梯優先、坡道指引
    *   **AR 實景導航**（未來）：手機攝影機即時箭頭指引

*   **地圖資料維護**
    *   眾包更新系統（學生回報新店家、設施變動）
    *   照片與 360° 實景（讓新生快速熟悉校園）
    *   多語言支援（中文、英文，友善外籍生）

### 🎓 學習歷程管理

*   **個人學習儀表板**
    *   已修課程視覺化（學分統計、成績趨勢圖）
    *   學習進度儀表板（必修/選修完成度）
    *   GPA 計算器與成績預測
    *   畢業倒數計時與學分缺口提醒

*   **學業輔助工具**
    *   考試倒數提醒（期中考、期末考）
    *   作業與報告截止日期管理
    *   讀書計畫制定與追蹤
    *   學習時數統計與分析

---

## 第二階段：校園生活全方位整合（3-6 個月）

### 🏫 校園生活服務

*   **校園交通**
    *   校園公車即時動態（GPS 定位）
    *   埔里市區公車時刻表與路線圖
    *   台中/高鐵/台北客運時刻表整合
    *   共乘媒合平台（週末返鄉、校外活動）

*   **餐飲與生活**
    *   校園美食地圖與評價系統
    *   餐廳營業時間與菜單查詢
    *   便利商店、影印店位置與服務資訊
    *   失物招領公告板

*   **設施預約**
    *   圖書館座位預約系統
    *   運動場地預約（籃球場、羽球場）
    *   討論室、會議室借用整合
    *   設備借用（投影機、相機等）

### 🏠 住宿與安全

*   **宿舍服務**
    *   宿舍公告與報修系統整合
    *   洗衣機使用狀態即時查詢
    *   宿舍門禁時間提醒
    *   室友配對與交流平台

*   **校園安全**
    *   校安中心聯絡快速鍵
    *   夜間護送服務申請
    *   校園危險區域標示地圖
    *   緊急求助一鍵通報

---

## 第三階段：社群互動與資訊共享（6-9 個月）

### 👥 學生社群

*   **同學交流**
    *   課程討論區（問答、筆記分享）
    *   系所同學圈（班級公告、活動揪團）
    *   興趣社團媒合（找到志同道合的夥伴）
    *   學長姐諮詢平台（科系選擇、實習經驗）

*   **二手交易**
    *   校園二手市場（教科書、生活用品）
    *   租屋資訊分享（校外租屋、雅房資訊）
    *   物品借用共享（腳踏車、電器）

*   **活動與競賽**
    *   校園活動日曆整合
    *   社團招生與活動報名
    *   競賽資訊聚合（學術、運動、藝文）
    *   志工機會與服務學習時數追蹤

### 📢 資訊推播

*   **智能通知系統**
    *   選課開放提醒（加退選時程）
    *   獎學金申請截止通知
    *   重要公告推播（停課、颱風假）
    *   個人化推薦（根據興趣與需求）

*   **校園新聞**
    *   學校公告彙整（教務、學務、總務）
    *   校園新聞快報
    *   演講與工作坊資訊
    *   就業與實習機會

---

## 第四階段：智能化與數據驅動（9-12 個月）

### 🤖 AI 智能助手

*   **AI 課程顧問**
    *   ChatGPT 整合：智能選課諮詢
    *   學習路徑規劃建議（根據職涯目標）
    *   課程難度與時間成本預測
    *   跨領域學習推薦（輔系、學程）

*   **個人化推薦引擎**
    *   基於選課歷史的智能推薦
    *   同學選課模式分析與建議
    *   熱門課程趨勢預測
    *   時間表最佳化演算法

### 📊 數據分析與洞察

*   **校園數據儀表板**
    *   選課趨勢統計（熱門課程、冷門課程）
    *   學習時間分布分析
    *   校園活動參與度統計
    *   學生需求與痛點洞察

*   **個人數據分析**
    *   四年學習歷程回顧
    *   成長軌跡可視化
    *   技能樹與能力雷達圖
    *   畢業紀念冊自動生成

---

## 第五階段：平台擴展與生態系統（12 個月以上）

### 🌐 多平台支援

*   **行動優先**
    *   PWA 完整支援（離線可用、推播通知）
    *   原生 App 開發（iOS/Android）
    *   Apple Watch / 智慧手錶 Widget
    *   桌面小工具（快速查看課表、公車）

*   **跨校整合**
    *   暨大多校區支援（埔里、水里、台中）
    *   其他大學整合可能性探索
    *   大專院校聯盟平台（共享資源）

### 🔗 開放生態系統

*   **API 開放平台**
    *   開發者文檔與 SDK
    *   第三方應用整合（社團管理、活動報名）
    *   校園創業團隊支援
    *   學生開發者社群建立

*   **商業合作**
    *   校園商家優惠整合
    *   學生專屬折扣平台
    *   實習與就業媒合
    *   校友資源對接

---

## 策略與原則

### 💡 核心策略

1. **使用者至上**：每個功能都解決真實痛點
2. **數據驅動**：基於使用統計優化功能優先順序
3. **漸進式改進**：小步快跑，持續迭代
4. **社群驅動**：鼓勵學生貢獻想法與代碼
5. **開放透明**：公開開發路線圖，接受社群監督

### ⚖️ 平衡考量

- **功能豐富 vs 簡潔易用**：避免功能臃腫，保持介面清爽
- **隱私保護 vs 功能便利**：嚴格遵守個資法，用戶資料加密
- **創新突破 vs 穩定運行**：新功能在測試環境充分驗證
- **免費服務 vs 永續經營**：探索校友捐贈、學校補助等模式

### 🎯 成功指標

- **日活躍用戶**：3,000+ （暨大學生數約 5,000-6,000）
- **平台黏著度**：平均每週使用 3+ 次
- **功能覆蓋率**：80% 學生使用 2+ 項核心功能
- **社群參與**：500+ 活躍貢獻者（評價、討論、分享）
- **校園影響**：成為新生入學必裝 App

---

**🚀 讓暨大超級助理，成為每位暨大人大學生活中不可或缺的夥伴！**

## 9. 接手流程 Checklist

- [ ] 取得 GitHub Repo、Vercel、Render、Supabase、GCP 的管理者權限
- [ ] 在本地電腦成功執行前端與後端專案
- [ ] 檢查所有環境變數是否已正確設定（包含 GitHub Secrets）
- [ ] 手動觸發所有 GitHub Actions，確認 4 個工作流程正常運作
- [ ] 測試 Discord 警報通知是否正常接收
- [ ] 閱讀本手冊，特別是自動化機制與 AI 維護指南

> **結語**: 本專案的自動化程度很高，日常維護成本低。對於非技術背景的接手者，善用 AI 工具將是您最得力的助手。祝維運順利！
