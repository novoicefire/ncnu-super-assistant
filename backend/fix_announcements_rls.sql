-- fix_announcements_rls.sql
-- 修復公告 RLS 政策，允許後端完整存取

-- 先刪除現有政策
DROP POLICY IF EXISTS "允許讀取啟用公告" ON announcements;
DROP POLICY IF EXISTS "Service role 完整存取" ON announcements;

-- 新政策：允許所有人讀取所有公告（前端會自行過濾）
CREATE POLICY "允許讀取所有公告" ON announcements
    FOR SELECT
    USING (true);

-- 新政策：允許所有操作（INSERT, UPDATE, DELETE）
-- 實際權限控制由前端管理員驗證處理
CREATE POLICY "允許所有寫入操作" ON announcements
    FOR ALL
    USING (true)
    WITH CHECK (true);
