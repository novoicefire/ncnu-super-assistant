-- announcements_setup.sql
-- 公告系統資料表設定
-- 與 AnnouncementCard.jsx 和 AnnouncementButton.jsx 完全相容

-- 建立公告資料表
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

-- 建立索引以優化查詢效能
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_date ON announcements(date DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);

-- 建立更新時間觸發器
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_announcements_updated_at ON announcements;
CREATE TRIGGER trigger_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_announcements_updated_at();

-- RLS 政策設定
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 允許所有人讀取啟用的公告
DROP POLICY IF EXISTS "允許讀取啟用公告" ON announcements;
CREATE POLICY "允許讀取啟用公告" ON announcements
    FOR SELECT
    USING (is_active = true);

-- 允許 service_role 完整存取（後端 API 使用）
DROP POLICY IF EXISTS "Service role 完整存取" ON announcements;
CREATE POLICY "Service role 完整存取" ON announcements
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 範例資料（對應現有 announcementData.js 的資料）
-- 可選擇性執行以遷移現有資料

INSERT INTO announcements (id, title, date, priority, content, images, embeds, buttons, is_active) VALUES
(1, '友情提示🫶不是廣告', '2025-11-27', 'high', 
 '有需要【免費諮詢升學或職涯規劃】的人，可以找我要聯繫方式，而且他們在學校也有駐點，有興趣可以去問問看，反正問不用錢，祝大家學業順利💪大展鴻圖😎',
 '[]'::jsonb,
 '[]'::jsonb,
 '[{"text": "加我IG跟我拿聯絡資訊", "url": "https://www.instagram.com/ncnu_super_assistant/", "style": "success", "icon": "💬", "external": true}]'::jsonb,
 true),
(2, '開學了，但一切尚未結束~', '2025-09-07', 'normal',
 '<iframe src="https://embed.dcard.tw/post/259732091" style=''border:none'' width="100%" height="372px"></iframe>',
 '[]'::jsonb,
 '[]'::jsonb,
 '[]'::jsonb,
 true),
(3, '🎓 暨大生使用回饋', '2025-07-27', 'low',
 '感謝所有使用暨大生超級助理的同學們！您的支持是我們持續改進的動力。

歡迎在使用過程中提供寶貴建議，讓我們一起打造更好的校園服務平台。',
 '[]'::jsonb,
 '[{"type": "link", "url": "https://www.dcard.tw/f/ncnu/p/259365158", "title": "Dcard 網站介紹貼文", "description": "在下方留言或回報幫助我修復BUG與改進服務品質"}]'::jsonb,
 '[{"text": "追蹤IG", "url": "https://www.instagram.com/ncnu_super_assistant/", "style": "success", "icon": "💬", "external": true}]'::jsonb,
 true);

-- 重設序列值
SELECT setval('announcements_id_seq', (SELECT MAX(id) FROM announcements));


-- 驗證資料表結構
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'announcements';
