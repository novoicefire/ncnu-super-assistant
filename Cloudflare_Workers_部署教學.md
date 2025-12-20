# Cloudflare Workers 部署教學

這份文件將引導你將剛建立的 `workers/dorm-mail-worker.js` 部署到 Cloudflare 平台上。

由於你的 `dorm-mail-worker.js` 已經準備好，你可以選擇 **網頁介面 (Web Dashboard)** 或是 **命令列工具 (Wrangler CLI)** 兩種方式進行部署。

---

## 方式一：使用 Cloudflare 網頁介面 (最直觀)

如果你不想安裝額外工具，這是最快的方式。

### 1. 建立 Worker
1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 在左側選單點擊 **Workers & Pages**。
3. 點擊 **Create application** (建立應用程式)。
4. 點擊 **Create Worker** (建立 Worker)。
5. **Name your Worker**: 輸入 `ncnu-dorm-mail-proxy` (或你喜歡的名字)。
6. 點擊 **Deploy** (部署)。

### 2. 貼上程式碼
1. 部署成功後，點擊 **Edit code** (編輯程式碼)。
2. 你會看到一個線上程式碼編輯器。
3. 打開你電腦上的 `workers/dorm-mail-worker.js` 檔案，**複製所有內容**。
4. 在線上編輯器中，全選並覆蓋 `worker.js` 的內容。
5. (重要) 確認左側檔案列表只有 `worker.js` (或是你剛剛貼上的檔案)。

### 3. 儲存並部署
1. 點擊右上角的 **Deploy**。
2. 再次確認並點擊 **Save and deploy**。
3. 部署完成後，畫面會顯示 Worker 的 URL (例如：`https://ncnu-dorm-mail-proxy.your-name.workers.dev`)。
4. **請複製這個 URL**，稍後前端需要用到。

---

## 方式二：使用 Wrangler CLI (推薦開發與自動化)

這是正規的開發方式，方便未來更新。

### 1. 安裝 Wrangler
在專案根目錄執行：
```bash
npm install -g wrangler
```

### 2. 登入 Cloudflare
```bash
wrangler login
```
瀏覽器會跳出視窗要求授權，請點擊 **Allow**。

### 3. 部署
在專案根目錄執行 (確保 `workers/wrangler.toml` 存在)：
```bash
# 切換到 workers 目錄
cd workers

# 執行部署
npx wrangler deploy
```

包含 `wrangler.toml` 設定檔也會一併生效。部署成功後，終端機一樣會顯示 Worker URL。

---

## 驗證 Worker 是否正常

假設你的 Worker URL 是 `https://ncnu-dorm-mail-proxy.user.workers.dev`。

1. **直接訪問 (使用瀏覽器)**：
   打開 `https://ncnu-dorm-mail-proxy.user.workers.dev`
   > 預期結果：你會看到 JSON 格式的宿舍包裹資料 `{ "success": true, "data": [...], ... }`。
   > 注意：第一次訪問可能會稍微慢一點 (Looking up cache...)，重新整理後應該會變快 (Cache hit!)。

2. **CORS 檢查**：
   Worker 已經設定好 CORS 標頭，允許任何來源 (`*`) 存取，所以前端可以直接呼叫。

---

## 下一步：更新前端

拿到 Worker URL 後，我們需要更新前端程式碼來使用這個新的代理服務。

### 修改 `frontend/src/components/0_Dashboard/DormMailCard.jsx`

找到原本呼叫 API 的地方：

```javascript
// 原本的寫法 (開發中/舊版)
// const response = await fetch('/api/dorm-mail?department=...');

// 修改為 (使用 Worker URL)
const WORKER_URL = "https://ncnu-dorm-mail-proxy.你的帳號.workers.dev";
const response = await fetch(`${WORKER_URL}?department=${encodeURIComponent(dept)}&name=${encodeURIComponent(name)}`);
```

*(注意：Worker 腳本目前是回傳完整清單，篩選功能建議在前端執行，或是我們需要更新 Worker 腳本來支援 Query Parameters 篩選)*

> **建議**：雖然我們在 Worker 實作了基本的緩存，但目前的 `dorm-mail-worker.js` 是回傳**所有**包裹，前端拿到資料後再用 JavaScript (filter) 進行篩選會比較靈活，也減輕後端負擔。
