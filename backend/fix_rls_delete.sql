-- =============================================
-- 修正 RLS 政策 - 新增 DELETE 權限和 push_subscriptions 權限
-- 請在 Supabase SQL Editor 中執行此腳本
-- =============================================

-- 1. notifications 表 - 新增 DELETE 政策
CREATE POLICY "Service can delete notifications" ON notifications
    FOR DELETE USING (true);

-- 2. push_subscriptions 表 - 修正權限問題
-- 先刪除原有的過於嚴格的政策
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON push_subscriptions;

-- 新增允許所有操作的政策（因為我們用後端 API 控制權限）
CREATE POLICY "Allow all operations on push_subscriptions" ON push_subscriptions
    FOR ALL USING (true) WITH CHECK (true);

-- 或者更簡單的方式：直接關閉 RLS
-- ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;
