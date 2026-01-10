-- backend/graduation_progress_setup.sql
-- 畢業進度追蹤資料表設定

-- 1. 建立資料表
CREATE TABLE IF NOT EXISTS graduation_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    dept_id TEXT NOT NULL,           -- 系所代碼，如 "12"
    class_type TEXT NOT NULL,        -- 班別：B = 學士, G = 碩士, P = 博士
    completed_courses JSONB DEFAULT '[]'::jsonb,  -- 已完成課程 ID 陣列
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, dept_id, class_type)  -- 每個用戶對每個系所班別只有一筆
);

-- 2. 建立索引
CREATE INDEX IF NOT EXISTS idx_graduation_progress_user_id ON graduation_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_graduation_progress_dept_class ON graduation_progress(dept_id, class_type);

-- 3. 啟用 RLS
ALTER TABLE graduation_progress ENABLE ROW LEVEL SECURITY;

-- 4. RLS 政策（允許後端 API 存取）
CREATE POLICY "Allow all access for graduation_progress" ON graduation_progress
    FOR ALL USING (true) WITH CHECK (true);

-- 5. 自動更新 updated_at 觸發器
CREATE OR REPLACE FUNCTION update_graduation_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_graduation_progress_updated_at
    BEFORE UPDATE ON graduation_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_graduation_progress_updated_at();

-- 6. 註解說明
COMMENT ON TABLE graduation_progress IS '使用者畢業進度追蹤表';
COMMENT ON COLUMN graduation_progress.user_id IS '使用者 Google ID';
COMMENT ON COLUMN graduation_progress.dept_id IS '系所代碼（參照開課單位代碼API.json）';
COMMENT ON COLUMN graduation_progress.class_type IS '班別：B=學士班, G=碩士班, P=博士班';
COMMENT ON COLUMN graduation_progress.completed_courses IS '已完成課程 ID 陣列，格式為 ["120001", "120002", ...]';
