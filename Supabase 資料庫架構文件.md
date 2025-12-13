# Supabase 資料庫架構文件

> 本文件記錄 NCNU Super Assistant 專案在 Supabase 中的完整資料庫架構，包含所有資料表、欄位定義、RLS 政策與初始化腳本。

## 📊 資料庫總覽

| 資料表 | 用途 | RLS | 設定檔 |
| :--- | :--- | :--- | :--- |
| `users` | 使用者資訊（Google 登入） | ✅ | 手動建立 |
| `schedules` | 課表資料（含彈性課程） | ✅ | 手動建立 |
| `notifications` | 站內通知 | ✅ | `supabase_notifications_setup.sql` |
| `notification_reads` | 已讀狀態追蹤 | ✅ | `notification_reads_setup.sql` |
| `push_subscriptions` | 推播訂閱資訊 | ✅ | `supabase_notifications_setup.sql` |
| `announcements` | 首頁公告 | ✅ | `announcements_setup.sql` |

---

## 1. users 表

**用途**：儲存透過 Google OAuth 登入的使用者資訊。

### 結構定義

```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    google_id TEXT NOT NULL UNIQUE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,  -- 管理員權限標記
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

### 欄位說明

| 欄位 | 類型 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| `id` | UUID | ✅ | 主鍵，自動生成 |
| `google_id` | TEXT | ✅ | Google OAuth 唯一識別碼 |
| `email` | TEXT | | 使用者 Email |
| `full_name` | TEXT | | 使用者全名 |
| `avatar_url` | TEXT | | 頭像網址 |
| `is_admin` | BOOLEAN | | 是否為管理員（預設 false） |
| `created_at` | TIMESTAMP | | 建立時間 |
| `updated_at` | TIMESTAMP | | 更新時間 |

### RLS 政策

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 使用者只能讀取自己的資料
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (google_id = current_setting('request.jwt.claim.sub', true));

-- 允許 upsert 操作（由後端 API 控制）
CREATE POLICY "Allow upsert" ON users
    FOR ALL USING (true) WITH CHECK (true);
```

---

## 2. schedules 表

**用途**：儲存使用者的課表資料，包含固定時間課程與彈性課程。

### 結構定義

```sql
CREATE TABLE IF NOT EXISTS schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    schedule_data JSONB DEFAULT '{}'::jsonb,      -- 固定時間課程
    flexible_courses JSONB DEFAULT '[]'::jsonb,   -- 彈性課程（v5.0+ 新增）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
```

### 欄位說明

| 欄位 | 類型 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| `id` | UUID | ✅ | 主鍵，自動生成 |
| `user_id` | TEXT | ✅ | 使用者 Google ID（唯一） |
| `schedule_data` | JSONB | | 固定時間課程資料 |
| `flexible_courses` | JSONB | | 彈性課程陣列（v5.0+） |
| `created_at` | TIMESTAMP | | 建立時間 |
| `updated_at` | TIMESTAMP | | 更新時間 |

### 資料格式範例

**schedule_data**（固定時間課程）：
```json
{
  "Mon-1": { "course_id": "ABC123", "course_name": "程式設計", "credits": 3 },
  "Mon-2": { "course_id": "ABC123", "course_name": "程式設計", "credits": 3 },
  "Wed-3": { "course_id": "DEF456", "course_name": "資料庫", "credits": 3 }
}
```

**flexible_courses**（彈性課程）：
```json
[
  { "course_id": "XYZ789", "course_name": "專題研究", "credits": 3, "teacher": "王教授" },
  { "course_id": "UVW012", "course_name": "校外實習", "credits": 2, "teacher": "李教授" }
]
```

### RLS 政策

```sql
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- 使用者只能存取自己的課表
CREATE POLICY "Users can manage own schedules" ON schedules
    FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true))
    WITH CHECK (user_id = current_setting('request.jwt.claim.sub', true));

-- 允許後端 API 存取（使用 service key）
CREATE POLICY "Service can access all schedules" ON schedules
    FOR ALL USING (true) WITH CHECK (true);
```

---

## 3. notifications 表

**用途**：儲存站內通知訊息，支援全站通知與個人通知。

**設定檔**：`backend/supabase_notifications_setup.sql`

### 結構定義

```sql
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT,  -- NULL 表示全站通知
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,  -- 點擊後跳轉連結（可選）
    read BOOLEAN DEFAULT FALSE,  -- 已棄用，改用 notification_reads 表
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
```

### 欄位說明

| 欄位 | 類型 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| `id` | UUID | ✅ | 主鍵 |
| `user_id` | TEXT | | NULL = 全站通知 |
| `type` | TEXT | ✅ | 類型：info/success/warning/error |
| `title` | TEXT | ✅ | 通知標題 |
| `message` | TEXT | ✅ | 通知內容 |
| `link` | TEXT | | 點擊跳轉連結 |
| `read` | BOOLEAN | | 已讀狀態（已棄用） |
| `created_at` | TIMESTAMP | | 建立時間 |

### 啟用 Realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

---

## 4. notification_reads 表

**用途**：追蹤每個使用者對每則通知的已讀狀態（多使用者已讀追蹤）。

**設定檔**：`backend/notification_reads_setup.sql`

### 結構定義

```sql
CREATE TABLE IF NOT EXISTS notification_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(notification_id, user_id)  -- 每個使用者對每則通知只有一筆
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_notification_reads_user_id ON notification_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_notification_id ON notification_reads(notification_id);
```

### 欄位說明

| 欄位 | 類型 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| `id` | UUID | ✅ | 主鍵 |
| `notification_id` | UUID | ✅ | 關聯的通知 ID（外鍵） |
| `user_id` | TEXT | ✅ | 使用者 ID |
| `read_at` | TIMESTAMP | | 標記已讀的時間 |

---

## 5. push_subscriptions 表

**用途**：儲存瀏覽器 Web Push 推播訂閱資訊。

**設定檔**：`backend/supabase_notifications_setup.sql`

### 結構定義

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    keys JSONB NOT NULL,  -- { p256dh: "...", auth: "..." }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
```

### 欄位說明

| 欄位 | 類型 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| `id` | UUID | ✅ | 主鍵 |
| `user_id` | TEXT | ✅ | 使用者 ID |
| `endpoint` | TEXT | ✅ | 推播端點 URL（唯一） |
| `keys` | JSONB | ✅ | 加密金鑰（p256dh, auth） |
| `created_at` | TIMESTAMP | | 訂閱時間 |

### keys 欄位格式

```json
{
  "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA...",
  "auth": "tBHItJI5svbpez7KI4CCXg=="
}
```

---

## 6. announcements 表

**用途**：儲存首頁公告內容，支援圖片、影片嵌入與自訂按鈕。

**設定檔**：`backend/announcements_setup.sql`

### 結構定義

```sql
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
    content TEXT NOT NULL DEFAULT '',
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    embeds JSONB NOT NULL DEFAULT '[]'::jsonb,
    buttons JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_date ON announcements(date DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);

-- 自動更新 updated_at 觸發器
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_announcements_updated_at();
```

### 欄位說明

| 欄位 | 類型 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | ✅ | 主鍵（自動遞增） |
| `title` | TEXT | ✅ | 公告標題 |
| `date` | DATE | ✅ | 公告日期 |
| `priority` | TEXT | ✅ | 優先級：high/normal/low |
| `content` | TEXT | | 公告內容（支援 HTML） |
| `images` | JSONB | | 圖片陣列 |
| `embeds` | JSONB | | 嵌入內容（iframe 等）|
| `buttons` | JSONB | | 自訂按鈕陣列 |
| `is_active` | BOOLEAN | ✅ | 是否啟用 |
| `created_at` | TIMESTAMP | | 建立時間 |
| `updated_at` | TIMESTAMP | | 更新時間（自動） |

### buttons 欄位格式

```json
[
  {
    "text": "按鈕文字",
    "url": "https://example.com",
    "style": "success",  // success, warning, danger, info
    "icon": "💬",
    "external": true
  }
]
```

### embeds 欄位格式

```json
[
  {
    "type": "link",
    "url": "https://www.dcard.tw/f/ncnu/p/123456",
    "title": "Dcard 貼文",
    "description": "貼文描述"
  }
]
```

---

## 🔧 初始化腳本執行順序

在 Supabase SQL Editor 中，依照以下順序執行 SQL 腳本：

1. **手動建立** `users` 表（參考上方結構）
2. **手動建立** `schedules` 表（參考上方結構）
3. **執行** `backend/supabase_notifications_setup.sql`（建立 notifications, push_subscriptions）
4. **執行** `backend/notification_reads_setup.sql`（建立 notification_reads）
5. **執行** `backend/announcements_setup.sql`（建立 announcements）
6. **修復 RLS**（如有需要）：
   - `backend/fix_rls_delete.sql`
   - `backend/fix_announcements_rls.sql`

---

## 🔐 RLS 政策總覽

| 資料表 | 讀取 | 寫入 | 刪除 |
| :--- | :--- | :--- | :--- |
| `users` | 自己 | 後端 API | 後端 API |
| `schedules` | 自己 | 自己 | 自己 |
| `notifications` | 自己/全站 | 後端 API | 後端 API |
| `notification_reads` | 所有 | 所有 | 所有 |
| `push_subscriptions` | 所有 | 所有 | 所有 |
| `announcements` | 所有 | 後端 API | 後端 API |

> **注意**：部分表使用寬鬆的 RLS 政策，實際權限控制由後端 API 處理。後端使用 `service_role` key 繞過 RLS。

---

## 📝 維護注意事項

### 新增欄位

如需新增欄位，執行 ALTER TABLE 語句：

```sql
ALTER TABLE 表名
ADD COLUMN 欄位名 資料類型 DEFAULT 預設值;
```

### 資料備份

Supabase 提供每日自動備份，也可手動匯出：

1. Supabase Dashboard → Settings → Database → Backups
2. 或使用 `pg_dump` 命令

### 效能監控

1. Supabase Dashboard → Database → Query Performance
2. 檢查慢查詢並新增適當索引

---

## 📚 相關檔案

| 檔案路徑 | 說明 |
| :--- | :--- |
| `backend/supabase_notifications_setup.sql` | 通知系統資料表設定 |
| `backend/notification_reads_setup.sql` | 已讀追蹤資料表設定 |
| `backend/announcements_setup.sql` | 公告系統資料表設定 |
| `backend/fix_rls_delete.sql` | RLS 政策修復（DELETE 權限）|
| `backend/fix_announcements_rls.sql` | 公告 RLS 政策修復 |
| `backend/notifications.py` | 通知 API 服務 |
| `backend/push_service.py` | Web Push 推播服務 |
| `backend/announcements.py` | 公告 API 服務 |

---

> **最後更新**：2025-12-13
