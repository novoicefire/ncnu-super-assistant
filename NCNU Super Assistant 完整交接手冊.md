<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# NCNU Super Assistant 完整交接手冊

## 一、專案概覽

**NCNU Super Assistant** 為國立暨南大學學生量身打造的單頁式應用，整合了課程規劃（Course Planner）、畢業進度追蹤（Graduation Tracker）、校園單位導覽（Campus Directory）與校園行事曆（University Calendar）四大功能，並以 Google OAuth2 進行使用者驗證。

- 前端：React + Vite，部署於 Vercel（靜態資源與 CDN）
- 後端：Python Flask，部署於 Render（Gunicorn 啟動）
- 資料庫：Supabase（PostgreSQL，儲存使用者排課資料）
- 自動化：GitHub Actions（定時同步 NCNU API 課程資料）
- 版本管理：Git (main 與 develop 分支)


## 二、完整專案檔案結構

```
ncnu-super-assistant/
├─ .github/
│  └─ workflows/
│     dailydatasync.yml      # GitHub Actions：每日自動拉取課程 API
├─ backend/
│  ├─ .env                   # 環境變數範例
│  ├─ app.py                 # Flask 主程式（API 路由、CORS、安全設定）
│  └─ requirements.txt       # Python 套件依賴
├─ frontend/
│  ├─ public/
│  │  ├─ data/API.json       # 同步後的課程資料 JSON
│  │  └─ calendar.ics        # 同步後的校曆 ICS
│  ├─ src/
│  │  ├─ apiHelper.js        # axios 重試與喚醒後端邏輯
│  │  ├─ AuthContext.jsx     # Google OAuth 驗證上下文
│  │  └─ components/         # 四大核心元件及其 CSS
│  │     ├─ CoursePlanner.jsx     ─ CoursePlanner.css  
│  │     ├─ GraduationTracker.jsx ─ GraduationTracker.css  
│  │     ├─ CampusDirectory.jsx   ─ CampusDirectory.css  
│  │     └─ UniversityCalendar.jsx─ UniversityCalendar.css  
│  ├─ App.jsx                # 應用根元件（路由設定）  
│  ├─ index.html             # SPA entry  
│  └─ package.json           # npm 套件依賴與 script  
├─ scripts/
│  ├─ fetchcoursedata.py     # 同步 NCNU API 並輸出至 public/data/API.json  
│  └─ convertexcel.py        # Excel 轉 JSON 並推送 GitHub  
├─ .gitignore  
└─ vercel.json               # 前端 SPA rewrites 配置
```


## 三、系統架構與流程

```mermaid
flowchart LR
  subgraph Frontend (Vercel)
    A[User Browser] -->|HTTPS| B[React SPA]
    B -->|API_CALL| C[(Flask API)]
  end

  subgraph Backend (Render)
    C -->|Supabase Client| D[(Supabase Database)]
    C -->|外部 API| E[NCNU JSON API & Google Calendar ICS]
  end

  subgraph Automation
    F[GitHub Actions] -->|每日 18:00| G[scripts/fetchcoursedata.py]
    G -->|git push| H[GitHub main]
    H -->|觸發 Vercel 部署| Frontend
  end
```

1. **前端 React SPA**
    - 利用 `apiHelper.js` 在啟動時先 ping 後端（喚醒 Gunicorn），再發起 API 請求；
    - 主要元件：
        - **CoursePlanner**：檢視／篩選課程，並可儲存個人排課。
        - **GraduationTracker**：顯示學生畢業進度。
        - **CampusDirectory**：校內單位列表，對應 `departments`、`contacts` API。
        - **UniversityCalendar**：解析 ICS 顯示校曆事件。
    - 驗證：`AuthContext` 使用 Google OAuth2，登入後將 `profileObj` 上傳至 `/apiauthgoogle`。
2. **後端 Flask API**
    - 啟動：`gunicorn app:app`
    - CORS：設定 `ALLOWED_ORIGINS`（生產、預覽、localhost），保障跨域請求安全；
    - 靜態資料：首次載入時自動呼叫 NCNU JSON API (`unitId`, `contact`, `coursedeptId`) 與 Google Calendar ICS，快取於記憶體；
    - Supabase：使用 `python-dotenv` 讀取 `SUPABASE_URL`、`SUPABASE_KEY`，操作 `users`、`schedules` 資表；
    - 核心路由：
        - GET `/` → “Backend is alive!”
        - POST `/apiauthgoogle` → 使用者登入 upsert
        - GET/POST `/apischedule` → 讀寫排課資料
        - GET `/apicourseshotness` → 計算熱門課程（依各使用者選課次數）
        - GET `/apidepartments`、`/apicontacts`、`/apicalendar`
3. **資料同步與自動部署**
    - **同步腳本**：`scripts/fetchcoursedata.py` 依當前學期動態向 NCNU API 請求，輸出至 `frontend/public/data/API.json`；
    - **GitHub Actions**：檔案變更時自動 commit→push → 觸發 Vercel → 前端重建；
    - 每日定時（UTC 10:00）執行，確保課程資料最新。

## 四、環境設定與部署步驟

1. **前端 Vercel**
    - 建立專案並連結 GitHub `main` 分支；
    - 根目錄：`frontend`；
    - Build Command：`npm install && npm run build`
    - Output Directory：`dist`
    - Environment Variables：
        - VITE_API_URL = `https://<render-backend>.onrender.com`
        - VITE_GOOGLE_CLIENT_ID = `<OAuth2 Client ID>`
2. **後端 Render**
    - 建立 Web Service，選擇 GitHub `backend` 資料夾；
    - Runtime：Python 3.11；
    - Build Command：`pip install -r requirements.txt`
    - Start Command：`gunicorn app:app`
    - Env Variables：
        - SUPABASE_URL, SUPABASE_KEY
        - PORT（Render 自動設定）
        - ALLOWED_ORIGINS
3. **本地開發**
    - 前端：

```bash
cd frontend
npm install
npm run dev
```

    - 後端：

```bash
cd backend
python -m venv venv
source venv/bin/activate     # Linux/macOS
venv\Scripts\activate        # Windows
pip install -r requirements.txt
export SUPABASE_URL=…
export SUPABASE_KEY=…
flask run
```


## 五、運維與後續開發指南

- **資料更新**
    - 手動：執行 `python scripts/fetchcoursedata.py` → commit→push → 前端自動重建。
    - 自動：由 GitHub Actions 及時觸發，請勿變更 `.github/workflows/dailydatasync.yml` 內容。
- **部署驗證**

1. 後端健康檢查：GET `https://<render-backend>.onrender.com/` → `“Backend is alive!”`
2. 課程 API：GET `/apicourses` → 回傳課程 JSON
3. 前端驗證：在瀏覽器開啟 Vercel 網址，功能應能正常使用。
- **常見問題排除**
    - **CORS 錯誤**：確認後端 `ALLOWED_ORIGINS` 包含所有 Vercel 網域與 localhost；
    - **資料不同步**：檢查 GitHub Actions 執行紀錄與 `API.json` 最新時間；
    - **Google 登入失敗**：檢查 OAuth Client ID 是否對應 `VITE_GOOGLE_CLIENT_ID`。
- **未來開發規劃**

1. 深色主題（Dark Mode）切換
2. Popup Modal 支援
3. 課程圖示化排程
4. GitHub Actions：新增 Excel 轉換腳本
5. 單元測試與 CI/CD 增強


## 六、關鍵設計與決策

- **單頁式架構**：提升使用體驗，React Router 管理四大功能頁。
- **服務分離**：前後端獨立部署，各自擁有最適化環境。
- **動態快取**：首載即取靜態 JSON/ICS，後續由快取供應，減少外部 API 呼叫量。
- **Supabase**：輕量即時資料庫，簡化後端認證與資料儲存。
- **GitFlow**：`develop` 分支作為預設開發線，`main` 作為穩定生產線，Pull Request 審核後自動部署。

本手冊涵蓋專案核心架構、設計思路、檔案結構、部署與運維要點，供接手開發或維運人員快速上手並持續迭代。祝專案推行順利。

<div style="text-align: center">⁂</div>

[^1_1]: Cheng-Shi-Ma-Fen-Duan-Chu-Li-Gong-Ju-Bao.md

[^1_2]: Wang-Zhan-Jian-Zhi-Ji-Lu-1.txt

[^1_3]: Wang-Zhan-Jian-Zhi-Ji-Lu-2.txt

[^1_4]: ncnu-super-assistantZi-Liao-Jia-Nei-Bu-Jie-Gou-Gai-Yao.txt

[^1_5]: vercel.json

[^1_6]: Wang-Zhan-She-Ji-Yu-APIJi-Ben-Zi-Xun.txt

[^1_7]: Ben-Xue-Qi-Kai-Ke-Zi-Xun-API.json

[^1_8]: Xing-Zheng-Jiao-Xue-Dan-Wei-Dai-Ma-API.json

[^1_9]: Kai-Ke-Dan-Wei-Dai-Ma-API.json

[^1_10]: Xiao-Yuan-Lian-Luo-Zi-Xun-API.json

[^1_11]: Wang-Zhan-Jian-Zhi-Ji-Lu-1.txt

[^1_12]: Wang-Zhan-Jian-Zhi-Ji-Lu-2.txt

[^1_13]: Ben-Xue-Qi-Kai-Ke-Zi-Xun-API.json


---

# NCNU Super Assistant 交接手冊（最終完整版）

> 本手冊以「**全景式系統設計圖 + 實務運維流程 + 擴充開發藍圖**」三層結構編寫，包含完整檔案樹、環境變數、CI/CD、資料同步、故障排除、資安備援、未來 Roadmap 及治理流程。針對每一模組皆附「核心職責」「關鍵程式」「測試腳本」「常見地雷」四欄說明，確保接手者零斷點。

## 1. 一分鐘鳥瞰

| 面向 | 技術 / 平台 | 關鍵文件 | 運維責任 |
| :-- | :-- | :-- | :-- |
| 前端 | React 19 + Vite 7 | `frontend/src` | Vercel 自動化部署 |
| 後端 | Flask 3 + Gunicorn | `backend/app.py` | Render Web Service |
| 資料庫 | Supabase (PostgreSQL) | `users` / `schedules` 表 | 金鑰保管、Row Level Security |
| 同步任務 | GitHub Actions | `.github/workflows/dailydatasync.yml` | 每日 18:00 UTC 抓 NCNU API |
| 身分驗證 | Google OAuth 2.0 | `AuthContext.jsx`、`/apiauthgoogle` | GCP OAuth 憑證更新 |
| 構建流程 | Git Flow | `main`、`develop` | PR 審核 + 自動化測試 |
| 法遵 | MIT + 免責聲明 | `DisclaimerModal.jsx` | 版本變動同步 |

## 2. 專案檔案樹（含行為註解）

```
ncnu-super-assistant/
├─ backend/                     # Flask API 服務
│  ├─ app.py                    # *唯一* 入口，集中路由/CORS/Supabase
│  ├─ requirements.txt          # Python 套件鎖；建議用 pip-tools 管理
│  └─ .env.example              # 本機開發範本
├─ frontend/                    # React SPA
│  ├─ public/
│  │  ├─ data/API.json          # 當期全部課程 (GitHub Action 覆寫)
│  │  └─ calendar.ics           # 校曆 (lazy-load 解析)
│  ├─ src/
│  │  ├─ apiHelper.js           # axios + 重試 + 喚醒 Render
│  │  ├─ AuthContext.jsx        # Google 登入 + localStorage
│  │  ├─ components/
│  │  │  ├─ 0Dashboard/         # 首頁儀表板
│  │  │  ├─ 1CoursePlanner/     # 智慧排課
│  │  │  ├─ 2GraduationTracker/ # 畢業追蹤
│  │  │  ├─ 3CampusDirectory/   # 校園通訊錄
│  │  │  ├─ 4UniversityCalendar/# 行事曆
│  │  │  └─ 5UpdateLog/         # 版本日誌（手動維護）
│  │  └─ utils/CacheManager.js  # 雙層快取（sessionStorage + in-mem）
│  ├─ vercel.json               # SPA rewrite 404 → index.html
│  └─ vite.config.js            # 別名、環境變數注入
├─ scripts/                     # 後處理工具
│  ├─ fetchcoursedata.py        # 依學年學期抓 API → JSON
│  └─ convertexcel.py           # Excel 批次轉課程 JSON
├─ .github/workflows/           # CI/CD
│  └─ dailydatasync.yml         # 定時 Job + Push → 觸發 Vercel
└─ README.md / LICENSE
```


## 3. 後端 API 詳表

| 路由 | 方法 | 描述 | 認證 | 來源資料 |
| :-- | :-- | :-- | :-- | :-- |
| `/` | GET | 健康檢查 “Backend is alive!” | 無 | N/A |
| `/apiauthgoogle` | POST | Google Profile → Supabase `users` *upsert* | Bearer(OAuth token) | Google API |
| `/apischedule` | GET | 取回個人排課(JSON) | Supabase Auth | `schedules` |
| 〃 | POST | 儲存個人排課 | Supabase Auth | `schedules` |
| `/apicourseshotness` | GET | 計算課程熱度 (Counter) | 公開 | `schedules` |
| `/apidepartments` | GET | 校內單位 list | 公開 | NCNU API `coursedeptId` |
| `/apicontacts` | GET | 單位電話/網址 | 公開 | NCNU API `contactncnu` + `unitIdncnu` |
| `/apicalendar` | GET | 校曆 events (排序完) | 公開 | Google ICS |

**擴充位**：若新增路由，請同步修改 `ALLOWED_ORIGINS`、Swagger (OpenAPI) 檔案 `/docs/openapi.yml`（目前待補）。

## 4. 環境變數與密鑰

| 位置 | 變數 | 用途 | 建議權限 |
| :-- | :-- | :-- | :-- |
| **Render** | `SUPABASE_URL` | Supabase REST endpoint | 只讀 |
|  | `SUPABASE_KEY` | anon public key | 只讀 |
|  | `PYTHON_VERSION` | 3.11.9 | 固定 |
| **Vercel** | `VITE_API_URL` | 指向 Render URL | 公開 |
|  | `VITE_GOOGLE_CLIENT_ID` | OAuth Client ID | 公開 |
| **GitHub Secret** | `GITHUB_TOKEN` | Action push 權限 | 私密 |

> **重要**：若要開 staging，Render 建議複製服務並設 `*_STAGING` 環境變數，並在 Vercel 預覽環境覆寫 `VITE_API_URL_STAGING`。

## 5. CI/CD Pipeline

1. **Push → GitHub**
    - PR 至 `develop` 先跑 ESLint / Jest（可加 Playwright）。
2. **Merge → `main`**
    - GitHub Action `dailydatasync.yml` 18:00 UTC 之外 **也會**在 merge 時執行一次 `fetchcoursedata.py`。
3. **Vercel**
    - 每次 `main` 變更自動重建；Preview URL 需在 Render CORS 白名單中加入 `https://*-git-*.vercel.app`。
4. **Render**
    - Webhook 追蹤 `backend/**` 檔案變化；成功部署後顯示 `Backend is alive! vX`。

## 6. 故障排除 SO-P (Standard Operating Procedure)

| 症狀 | 快速判斷 | 解法 |
| :-- | :-- | :-- |
| 404 + CORS | Console 顯示 404 → 先 hit Render `/` | Render 服務名稱/路徑錯；`VITE_API_URL` 指錯 |
| Network Error | Render log 無輸出 | Render free plan 休眠；apiHelper.js 已自動喚醒，重刷即可 |
| Google 登入失敗 | POST `/apiauthgoogle` 403 | 檢查 GCP OAuth 網域白名單 |
| Course 資料過舊 | `API.json` 時戳 < 1 day | 手動執行 `scripts/fetchcoursedata.py` + push |
| 行事曆空白 | Google ICS 503 | 再試，或 fallback `calendar_cache.json` |

## 7. 測試 \& 監控

- **單元測試**：Jest + React Testing Library (`/frontend/__tests__`)；Flask 使用 `pytest` + `pytest-flask`。
- **E2E**：Playwright 行走 /courseplanner → add→save→reload。
- **監控**：免費 pingdom or Freshping 指向 `/`；500 ms 即視為 Down。
- **日誌**：Render 提供 1000 lines；必要時接 Logtail。


## 8. 安全與備援

| 項目 | 防護措施 |
| :-- | :-- |
| CORS Injection | 嚴格 `ALLOWED_ORIGINS` + 預覽網域 regex |
| Supabase RLS | `users.googleid = auth.uid()`；`schedules.userid = auth.uid()` |
| OAuth | GCP 限制 redirect URL；Vercel env 不 commit |
| 資料備份 | Supabase 每日自動快照；`API.json` 透過 Git 留歷史 |
| Secrets | Render / Vercel / GitHub 皆採 Encrypted Secret，勿置於 .env |

## 9. 未來 Roadmap（12 個月）

1. Dark Mode + ThemeContext 改寫為 Tailwind Variant
2. 課表拖曳排課、iCal 匯出
3. Notification Center（講座/加退選截止推播）
4. Supabase Edge Functions → Serverless 分流
5. Terraform 管理 Render + Vercel 資源
6. 完整 OpenAPI 3.1 文件 + Swagger UI → `/docs`
7. 單元/端對端覆蓋率 ≥ 80%
8. 多校支援：API 抽象化、動態學校 Adapter
9. Sentry APM 導入前後端
10. Lighthouse 分數 ≥ 95

## 10. 接手流程 Checklist

1. [ ] Fork or transfer GitHub repo，確認 CI 權限。
2. [ ] 在 Render 建立 **backend-prod** 與 **backend-staging**。
3. [ ] 在 Vercel 新增 **prod** 與 **preview** 環境變數。
4. [ ] 將 Supabase 專案添加接手者帳號；複查 RLS policy。
5. [ ] 執行 `npm install && npm run dev` + `flask run` 本地驗收。
6. [ ] 手動 trigger GitHub Action `dailydatasync`，驗證 API.json 改動。
7. [ ] 在 Jira / Notion 建立 Roadmap 里程碑，對應本文件第 9 節。

> **結語**：本手冊已涵蓋 **架構設計 → 環境配置 → 流程自動化 → 安全治理 → 未來擴充** 全生命週期細節，足以支援 0-Day 交接與長期維運。若有疑問，請先查此文，再於 GitHub Issues 標註 `@maintainers`。祝開發順利。

<div style="text-align: center">⁂</div>

[^2_1]: README.md


---

# NCNU Super Assistant 完整交接手冊（含AI維護指南）

> 本手冊專為**非資訊科技背景**的維護者設計，讓國企系、管理系等商學院學生也能輕鬆使用AI工具維護網站。

## 🤖 AI維護概念篇

### 為什麼非技術背景也能維護網站？

想像一下：

- **以前**：維護網站需要學會寫程式（就像要學會修車才能開車）
- **現在**：有了AI助手，就像有了專業技師在旁邊指導，你只需要：
    - 會描述問題
    - 會複製貼上
    - 會按照步驟操作


### AI在網站維護中的角色

| 你的角色 | AI的角色 | 實際工作分配 |
| :-- | :-- | :-- |
| 網站管理員 | 技術顧問 | 你：發現問題、描述需求、執行操作 |
| 決策者 | 方案提供者 | AI：診斷問題、生成代碼、提供步驟 |
| 品質控制 | 技術實現 | 共同：測試結果、優化效果 |

## 🛠️ AI工具箱

### 必備工具（免費）

1. **ChatGPT** (推薦 GPT-4)
    - 用途：程式碼生成、問題診斷、步驟指導
    - 優點：回答詳細、支援中文、理解上下文
    - 網址：https://chat.openai.com
2. **Claude** (Anthropic)
    - 用途：長文件分析、複雜問題解決
    - 優點：可以處理大量程式碼、分析能力強
    - 網址：https://claude.ai
3. **GitHub Copilot**（學生免費）
    - 用途：自動完成程式碼
    - 優點：直接在編輯器中提供建議
    - 申請：https://education.github.com

### 輔助工具

4. **GitHub Desktop**
    - 用途：版本管理（像雲端硬碟的進階版）
    - 優點：圖形化介面，不需要記指令
    - 下載：https://desktop.github.com
5. **Visual Studio Code**
    - 用途：編輯程式碼（像Word，但專門給程式用）
    - 優點：AI外掛支援、語法高亮
    - 下載：https://code.visualstudio.com

## 📋 AI維護工作清單

### 每日例行工作（10分鐘）

```markdown
□ 開啟網站確認正常運作
□ 檢查 GitHub Desktop 是否有自動更新
□ 查看是否有用戶反饋或問題回報
□ 用AI檢查網站效能（使用下方模板）
```

**AI模板**：

```
請幫我檢查這個網站的健康狀態：https://ncnu-super-assistant.vercel.app

我需要知道：
1. 網站載入速度如何？
2. 有沒有明顯的錯誤？
3. 使用者體驗方面有什麼建議？

請用簡單的話解釋，我不是程式設計師。
```


### 每週維護工作（30分鐘）

```markdown
□ 測試所有主要功能（排課、畢業追蹤、行事曆、聯絡簿）
□ 檢查課程資料是否為最新
□ 回應用戶問題和建議
□ 用AI分析網站使用數據
```

**AI模板**：

```
我想分析我網站的使用情況，以下是本週的數據：
[貼上 Vercel 或 Google Analytics 的資料]

請幫我：
1. 找出最受歡迎的功能
2. 發現使用上的問題
3. 給出改善建議
4. 預測未來需求

用商業分析的角度，像做市場報告一樣。
```


### 每月功能更新（2-4小時）

```markdown
□ 收集用戶反饋，規劃新功能
□ 使用AI設計和實現新功能
□ 測試新功能並修正問題
□ 更新使用說明和幫助文件
```


## 🎯 實戰場景：用AI解決常見問題

### 場景一：網站突然很慢

**第1步：描述問題**

```
我的網站 NCNU Super Assistant 今天變得很慢，以前2秒就載入完成，現在要10秒以上。

網站資訊：
- 前端：Vercel 部署的 React 應用
- 後端：Render 部署的 Flask API
- 昨天還正常，今天開始變慢
- 用戶反映課程查詢功能特別慢

請幫我診斷可能的原因和解決方法，我不懂程式設計。
```

**第2步：跟著AI指示操作**
AI會給你類似這樣的步驟：

1. 先檢查 Render 後端是否休眠
2. 查看 Vercel 部署狀態
3. 檢查資料庫連線
4. 優化圖片和資源載入

**第3步：應用解決方案**
根據AI提供的具體代碼或設定，直接複製貼上到對應位置。

### 場景二：想新增「課程評價」功能

**第1步：需求描述**

```
我想在 NCNU Super Assistant 新增課程評價功能：

需求：
- 學生可以對已修課程評分（1-5星）
- 可以寫文字評論
- 可以看到課程的平均評分
- 評價需要登入才能寫，但可以匿名顯示

技術背景：
- 前端：React + JavaScript
- 後端：Flask + Python
- 資料庫：Supabase
- 目前已有 Google 登入功能

請給我完整的實作步驟和程式碼，我會複製貼上但不太懂原理。
```

**第2步：按步驟實作**
AI會提供：

1. 資料庫表格設計
2. 後端 API 程式碼
3. 前端元件程式碼
4. 完整的檔案修改清單

**第3步：測試和上線**
跟著AI的測試指南，確保功能正常運作。

### 場景三：修復錯誤

**問題**：網站出現「500 Internal Server Error」

**AI對話**：

```
緊急求助！我的網站出現 500 錯誤，用戶無法使用。

錯誤資訊：
- 錯誤代碼：500 Internal Server Error
- 出現時間：今天下午2點開始
- 影響範圍：整個網站都無法使用
- 最近變更：昨天我修改了課程搜尋功能

網站架構：
- 前端：https://ncnu-super-assistant.vercel.app
- 後端：https://my-backend.onrender.com
- 資料庫：Supabase

我需要：
1. 立即的臨時解決方案
2. 根本原因分析
3. 預防措施

請給我具體的操作步驟，我不是工程師但會用GitHub Desktop。
```

**AI回應會包括**：

1. 緊急回復步驟（通常是回滾到前一版本）
2. 錯誤診斷方法
3. 修復代碼
4. 未來預防措施

## 📖 AI Prompt 範本集

## 💻 GitHub Desktop 操作指南

## 🔧 進階AI協作技巧

### 與AI對話的最佳實踐

1. **提供充足背景資訊**

```
❌ 不好的問法：網站壞了怎麼辦？
✅ 好的問法：我的NCNU Super Assistant網站出現登入問題，用戶點擊Google登入按鈕後沒有反應，錯誤訊息是...
```

2. **分階段詢問**

```
第一輪：診斷問題原因
第二輪：要求具體解決方案  
第三輪：詢問預防措施
```

3. **要求非技術性解釋**

```
在每個問題後加上：「請用非技術性的語言解釋，我是商學院學生。」
```


### AI代碼審查

在應用AI生成的代碼前，請AI自己檢查：

```
請檢查你剛才提供的代碼：
1. 是否有安全隱患？
2. 是否符合我們網站的架構？
3. 會不會影響其他功能？
4. 有沒有更簡單的實現方法？

如果有問題請提供修正版本。
```


### 建立AI知識庫

定期整理對話記錄，建立你的「AI助手使用手冊」：

```markdown
## 我的網站AI維護記錄

### 2024年1月 - 效能優化
問題：網站載入慢
AI方案：圖片壓縮 + CDN設定
結果：載入時間從8秒降到3秒

### 2024年2月 - 新增功能
需求：課程提醒功能
AI方案：[貼上完整對話]
結果：成功上線，用戶反饋良好

### 常用AI指令
- 健康檢查：[貼上常用prompt]
- 錯誤診斷：[貼上常用prompt]
- 功能開發：[貼上常用prompt]
```


## 🚨 緊急應變程序

### 當AI也無法解決問題時

1. **立即降級方案**
    - 使用GitHub Desktop回滾到最後正常版本
    - 在網站上顯示維護公告
    - 通知用戶預計修復時間
2. **尋求人力支援**
    - 聯繫原開發者
    - 發布技術支援請求到相關論壇
    - 考慮聘請短期技術顧問
3. **危機溝通**
    - 在社交媒體發布狀態更新
    - 回應用戶關切
    - 提供替代解決方案

### 預防性措施

1. **定期備份**

```
每週日晚上：
- GitHub Desktop 檢查所有變更已同步
- Supabase 資料庫匯出備份
- Vercel 部署狀態截圖
```

2. **建立監控預警**

```
使用AI設定簡單監控：
- 網站可用性檢查（每小時）
- 效能指標追蹤（每日）
- 錯誤日誌分析（每週）
```


## 📈 進階應用：AI驅動的網站優化

### 數據分析與決策

使用AI分析用戶行為，優化網站功能：

```
我想分析用戶在我網站上的行為模式，以下是過去一個月的數據：

頁面瀏覽量：
- 課程規劃頁：15,000次
- 畢業追蹤頁：8,000次  
- 校園聯絡簿：3,000次
- 行事曆：5,000次

用戶停留時間：
- 課程規劃：平均5分鐘
- 畢業追蹤：平均2分鐘
- 其他頁面：平均30秒

請幫我：
1. 分析哪些功能最有價值
2. 找出可能的改善點
3. 提供具體的優化建議
4. 預測未來功能需求

請用商業分析的角度回答。
```


### 個性化功能開發

讓AI幫你設計個性化體驗：

```
基於用戶行為數據，我想為不同類型的學生提供個性化體驗：

用戶類型分析：
- 大一新生：主要使用課程規劃和校園聯絡簿
- 大三大四：主要使用畢業追蹤和課程規劃
- 研究生：主要使用行事曆和聯絡簿

請幫我設計：
1. 不同的首頁佈局
2. 個性化推薦功能
3. 客製化提醒設定
4. 實作的技術方案

我的技術架構是React前端+Flask後端+Supabase資料庫。
```


## 🎓 學習資源與社群

### 推薦學習資源

1. **AI工具學習**
    - ChatGPT官方教學
    - Claude使用指南
    - GitHub Copilot文檔
2. **基礎網站知識**
    - MDN Web開發教學（中文）
    - React官方教學
    - JavaScript基礎課程
3. **商業思維**
    - Google Analytics教學
    - 使用者體驗設計原則
    - 產品管理基礎

### 技術支援社群

1. **官方社群**
    - GitHub Community
    - Stack Overflow
    - Reddit r/webdev
2. **中文社群**
    - iTHome技術文章
    - CSDN程式設計社群
    - 知乎技術話題
3. **校內資源**
    - 資工系學長姐支援
    - 校內技術社團
    - 教授辦公時間諮詢

## 🔮 未來發展藍圖

### 短期目標（3個月）

1. **AI輔助客服系統**
    - 整合ChatGPT API
    - 自動回答常見問題
    - 24/7在線支援
2. **智能推薦引擎**
    - 基于歷史選課推薦課程
    - 個性化學習路徑建議
    - 同儕選課分析

### 中期目標（6個月）

1. **多校園支援**
    - 架構模組化改造
    - 動態配置系統
    - 品牌客製化
2. **移動端優化**
    - PWA功能完善
    - 離線模式支援
    - 推播通知系統

### 長期願景（1年）

1. **AI驅動的學習助手**
    - 學習進度追蹤
    - 智能學習建議
    - 成績預測分析
2. **生態系統建設**
    - 開放API平台
    - 第三方應用整合
    - 學校官方合作

## 📞 支援與聯繫

### 緊急聯繫

- **技術緊急事件**：GitHub Issues @ 標註 `@emergency`
- **用戶服務問題**：網站內建回饋系統
- **商業合作**：透過GitHub聯繫管理員


### 定期檢討會議

建議每月舉行維護檢討會：

1. 回顧當月問題和解決方案
2. 分析AI使用效率和效果
3. 規劃下月維護重點
4. 用戶反饋整理和回應策略

**🎉 結語**：透過AI的協助，網站維護不再是技術人員的專利。只要有耐心學習、勇於嘗試，每個人都能成為優秀的網站管理員。記住：AI是你的技術夥伴，但你才是決策者和品質把關者！

<div style="text-align: center">⁂</div>

[^3_1]: https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/bcf173fa8e0722d9e72b72baeec40bee/fd1a0cf6-7795-4978-aa2d-f335b7f040a9/ede19920.md

[^3_2]: https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/bcf173fa8e0722d9e72b72baeec40bee/a21538d0-70da-4f8b-9f71-27ca818f626b/59c60e83.md

