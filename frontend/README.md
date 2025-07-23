# 🎓 暨大生超級助理 (NCNU Super Assistant)

為國立暨南國際大學學生打造的全方位校園服務平台，提供智慧排課、畢業進度追蹤、校園資訊查詢等核心功能。

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

### 📞 校園服務整合

- **校園通訊錄**：完整的校園單位聯絡資訊
- **暨大行事曆**：重要校園活動與考試日程
- **更新日誌**：系統功能更新與改進記錄

## 🛠️ 技術架構

### 前端技術

- **框架**：React 19.1.0 + Vite 7.0.4
- **路由**：React Router DOM 7.7.0
- **狀態管理**：React Hooks + Context API
- **UI 組件**：自定義組件系統
- **樣式**：CSS3 + 響應式設計
- **通知系統**：React Hot Toast 2.5.2

### 後端服務

- **API 服務**：Flask + Python
- **資料庫**：Supabase PostgreSQL
- **身份驗證**：Google OAuth 2.0
- **資料同步**：RESTful API + Axios

### 部署與CI/CD

- **前端部署**：Vercel (自動化部署)
- **後端部署**：Render (容器化服務)
- **版本控制**：GitHub + Git Flow
- **自動化**：GitHub Actions (測試與部署)

## 🚀 開發環境設置

### 前置需求

- Node.js 18+
- npm 或 yarn
- Git

### 安裝步驟

- **複製專案**：
- git clone <https://github.com/novoicefire/ncnu-super-assistant.git>
- cd ncnu-super-assistant

- **安裝前端依賴**：
- cd frontend
- npm install

啟動開發伺服器
npm run dev

### 環境變數設置

創建 `.env` 檔案並設置以下變數：
VITE_API_BASE_URL=your_backend_api_url
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id

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

### 🤖 智能化功能

- **課程資料處理**：自動分類和標準化課程資訊
- **智能搜尋**：支援模糊搜尋和同義詞匹配
- **個人化推薦**：基於使用行為的智能建議

### 📱 跨平台支援

- **響應式設計**：完美適配桌面、平板、手機
- **PWA 功能**：支援離線使用和桌面安裝
- **跨瀏覽器**：支援 Chrome、Firefox、Safari、Edge

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

### 開發分支策略

- `main`：正式版本分支
- `develop`：開發分支
- `feature/*`：功能開發分支
- `fix/*`：問題修復分支

### 提交規範

type(scope): description

feat: 新功能
fix: 錯誤修復
docs: 文件更新
style: 程式碼格式
refactor: 重構
test: 測試相關
chore: 其他修改

## 📞 聯絡資訊

- **專案維護**：novoicefire
- **GitHub**：[https://github.com/novoicefire/ncnu-super-assistant](https://github.com/novoicefire/ncnu-super-assistant)
- **問題回報**：[GitHub Issues](https://github.com/novoicefire/ncnu-super-assistant/issues)

## 📜 授權條款

本專案採用 MIT 授權條款，詳見 [LICENSE](LICENSE) 檔案。

---

**⚠️ 重要聲明**：本專案為非官方學生自主開發，所有資訊請以學校正式公告為準。

**🎓 獻給所有暨大學子**：希望這個工具能讓您的大學生活更加便利
    