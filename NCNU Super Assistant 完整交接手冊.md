# NCNU Super Assistant 完整維護與交接手冊

> 本手冊整合了技術交接與非技術背景維護指南，旨在讓任何接手者都能快速上手、順利維運。

## 1. 專案總覽

**NCNU Super Assistant** 為國立暨南大學學生設計的單頁式應用(SPA)，整合四大核心功能：

*   **課程規劃 (Course Planner)**
*   **畢業進度追蹤 (Graduation Tracker)**
*   **校園單位導覽 (Campus Directory)**
*   **校園行事曆 (University Calendar)**

### 1.1. 技術架構速覽

| 面向 | 技術 / 平台 | 關鍵文件/位置 | 運維重點 |
| :--- | :--- | :--- | :--- |
| **前端** | React 19 + Vite | `frontend/` | Vercel 自動化部署 |
| **後端** | Python 3.11 + Flask | `backend/app.py` | Render Web Service (Gunicorn) |
| **資料庫** | Supabase (PostgreSQL) | `users`, `schedules` 表 | RLS 安全策略、金鑰管理 |
| **身分驗證** | Google OAuth 2.0 | `frontend/src/AuthContext.jsx` | GCP OAuth 憑證需定期更新 |
| **自動化任務** | GitHub Actions | `.github/workflows/daily_data_sync.yml` | 每日定時同步課程資料 |
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
    C -->|Fetch| E[NCNU API & Google Calendar]
  end

  subgraph Automation (GitHub)
    F[GitHub Actions] -->|Daily Cron| G[scripts/fetch_course_data.py]
    G -->|git push| H[GitHub Repo]
    H -->|Webhook| A
  end
```

1.  **前端 (Vercel)**: 使用者在瀏覽器操作 React 應用，透過 `apiHelper.js` 呼叫後端 API。此 Helper 會在閒置過久後自動喚醒後端服務。
2.  **後端 (Render)**: Flask 應用接收請求，透過 Supabase 客戶端存取使用者資料，或讀取快取的校園公開資訊。
3.  **自動化 (GitHub Actions)**: 每日定時執行 `fetch_course_data.py` 腳本，抓取最新的課程資料並推送到 GitHub，此舉會觸發 Vercel 重新部署前端，確保資料即時更新。

## 3. 專案檔案結構

```
ncnu-super-assistant/
├─ .github/
│  └─ workflows/
│     └─ daily_data_sync.yml      # GitHub Actions: 每日資料同步
├─ backend/
│  ├─ app.py                    # 後端 Flask API 主程式
│  └─ requirements.txt          # Python 套件依賴
├─ frontend/
│  ├─ public/
│  │  ├─ data/                  # 自動同步的課程資料 (JSON)
│  │  └─ calendar.ics           # 校曆 .ics 檔案
│  ├─ src/
│  │  ├─ App.jsx                # React 主應用元件與路由
│  │  ├─ main.jsx               # React 應用程式進入點
│  │  ├─ apiHelper.js           # API 呼叫工具
│  │  ├─ AuthContext.jsx        # Google 登入驗證
│  │  └─ components/            # 各功能UI元件
│  │     ├─ 0_Dashboard/         # 首頁儀表板
│  │     │  ├─ Dashboard.jsx
│  │     │  ├─ WelcomeBanner.jsx
│  │     │  └─ ...
│  │     ├─ 1_CoursePlanner/     # 課程規劃
│  │     │  ├─ CoursePlanner.jsx
│  │     │  └─ CourseTable.jsx
│  │     ├─ 2_GraduationTracker/ # 畢業進度
│  │     │  └─ GraduationTracker.jsx
│  │     ├─ 3_CampusDirectory/   # 校園單位導覽
│  │     │  └─ CampusDirectory.jsx
│  │     ├─ 4_UniversityCalendar/# 校園行事曆
│  │     │  └─ UniversityCalendar.jsx
│  │     ├─ 5_UpdateLog/         # 更新日誌
│  │     │  └─ UpdateLog.jsx
│  │     ├─ common/              # 共用元件 (錯誤邊界、載入指示器)
│  │     │  ├─ ErrorBoundary.jsx
│  │     │  └─ LazyLoader.jsx
│  │     ├─ DisclaimerModal.jsx  # 免責聲明
│  │     └─ Navbar.jsx           # 導覽列
│  ├─ index.html               # SPA 進入點 HTML
│  ├─ package.json             # 前端套件依賴
│  ├─ vite.config.js           # Vite 設定檔
│  └─ vercel.json              # Vercel 部署設定
├─ scripts/
│  ├─ convert_excel.py        # Excel 轉換腳本
│  └─ fetch_course_data.py      # 抓取課程資料腳本
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

| 位置 | 變數 | 用途 |
| :--- | :--- | :--- |
| **Render** | `SUPABASE_URL` | Supabase 專案 URL |
| | `SUPABASE_KEY` | Supabase 專案 Public Key |
| | `ALLOWED_ORIGINS` | 允許跨域請求的來源 (Vercel 網址) |
| **Vercel** | `VITE_API_URL` | 指向 Render 後端服務的 URL |
| | `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID |

## 5. API 參考

| 路由 | 方法 | 描述 | 認證 |
| :--- | :--- | :--- | :--- |
| `/` | GET | 後端健康檢查 | 無 |
| `/apiauthgoogle` | POST | Google 登入驗證，新增/更新使用者 | Bearer Token |
| `/apischedule` | GET/POST | 讀取/儲存個人排課資料 | Supabase Auth |
| `/apicourseshotness`| GET | 計算課程熱門度 | 公開 |
| `/apidepartments` | GET | 取得所有開課單位 | 公開 |
| `/apicontacts` | GET | 取得校園聯絡資訊 | 公開 |
| `/apicalendar` | GET | 取得校曆事件 | 公開 |

## 6. 故障排除

| 症狀 | 可能原因 | 解決方案 |
| :--- | :--- | :--- |
| **CORS 錯誤** | 前端網域未被後端允許 | 檢查 Render `ALLOWED_ORIGINS` 環境變數。 |
| **網站很慢/無回應** | Render 免費方案休眠 | 重新整理頁面，`apiHelper.js` 會自動喚醒。 |
| **Google 登入失敗** | OAuth Client ID 設定錯誤 | 檢查 Vercel `VITE_GOOGLE_CLIENT_ID` 與 GCP 設定。 |
| **課程資料過舊** | GitHub Actions 同步失敗 | 前往 GitHub Repo 的 Actions 頁面檢查執行紀錄。 |

---

## 🤖 AI 維護指南 (非技術背景適用)

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

## 8. 未來開發藍圖

*   **短期目標**:
    *   深色主題 (Dark Mode) 切換。
    *   課表拖曳排課與 iCal 匯出。
    *   建立完整的單元測試與 E2E 測試。
*   **長期願景**:
    *   支援多校區或多學校。
    *   整合 AI 推薦課程或學習路徑。
    *   開發 PWA 或原生 App。

## 9. 接手流程 Checklist

1.  [ ] 取得 GitHub Repo、Vercel、Render、Supabase、GCP 的管理者權限。
2.  [ ] 在本地電腦成功執行前端與後端專案。
3.  [ ] 檢查所有環境變數是否已正確設定。
4.  [ ] 手動觸發一次 GitHub Action，確認資料同步流程正常。
5.  [ ] 閱讀本手冊，特別是 AI 維護指南。

> **結語**: 本專案的自動化程度很高，日常維護成本低。對於非技術背景的接手者，善用 AI 工具將是您最得力的助手。祝維運順利！
