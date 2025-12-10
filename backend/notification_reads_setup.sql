-- =============================================
-- 多使用者已讀追蹤 - 資料庫設定
-- 請在 Supabase SQL Editor 中執行此腳本
-- =============================================

-- 1. 建立 notification_reads 表（追蹤每個使用者的已讀狀態）
CREATE TABLE IF NOT EXISTS notification_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(notification_id, user_id)  -- 每個使用者對每則通知只有一筆
);

-- 2. 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_notification_reads_user_id ON notification_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_notification_id ON notification_reads(notification_id);

-- 3. 設定 RLS 政策
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

-- 允許所有操作（因為我們用後端 API 控制權限）
CREATE POLICY "Allow all operations on notification_reads" ON notification_reads
    FOR ALL USING (true) WITH CHECK (true);

-- 給 anon 和 authenticated 角色完整權限
GRANT ALL ON notification_reads TO anon, authenticated;

-- 4. (可選) 刪除 notifications 表中的 read 欄位
-- 注意：如果有舊資料，請先備份
-- ALTER TABLE notifications DROP COLUMN IF EXISTS read;

-- =============================================
-- 完成！
-- =============================================
