-- =============================================
-- NCNU Super Assistant - 通知系統資料庫設定
-- 請在 Supabase SQL Editor 中執行此腳本
-- =============================================

-- 1. 建立 notifications 表
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT,  -- NULL 表示全站通知
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,  -- 點擊後跳轉連結（可選）
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 建立 push_subscriptions 表 (瀏覽器推播訂閱)
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    keys JSONB NOT NULL,  -- { p256dh: "...", auth: "..." }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- 4. 啟用 Realtime（即時推送）
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 5. 設定 RLS (Row Level Security) 政策
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- notifications 政策：用戶只能看到自己的通知或全站通知
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id IS NULL OR user_id = current_setting('request.jwt.claim.sub', true));

-- notifications 政策：任何人都可以新增（由後端控制權限）
CREATE POLICY "Service can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- notifications 政策：用戶可以更新自己通知的已讀狀態
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id IS NULL OR user_id = current_setting('request.jwt.claim.sub', true));

-- push_subscriptions 政策：用戶只能管理自己的訂閱
CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions
    FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));

-- 給 anon 和 authenticated 角色完整權限（因為我們用 service key）
GRANT ALL ON notifications TO anon, authenticated;
GRANT ALL ON push_subscriptions TO anon, authenticated;

-- =============================================
-- 完成！請在 Supabase 控制台確認表已建立
-- =============================================
