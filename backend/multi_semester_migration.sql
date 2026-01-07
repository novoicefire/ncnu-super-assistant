-- ============================================
-- 智慧排課系統 v2.0 - 資料庫遷移腳本
-- 執行於 Supabase SQL Editor
-- ============================================

-- Step 1: schedules 表新增 semester 欄位
-- 預設值確保既有資料向後相容
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT '114-1';

-- Step 2: 移除舊的唯一約束（如果存在）
ALTER TABLE schedules 
DROP CONSTRAINT IF EXISTS schedules_user_id_key;

-- Step 3: 建立新的複合唯一約束
-- 允許同一使用者有多個學期的課表
ALTER TABLE schedules 
ADD CONSTRAINT schedules_user_semester_unique UNIQUE (user_id, semester);

-- Step 4: 建立索引提升查詢效能
CREATE INDEX IF NOT EXISTS idx_schedules_semester ON schedules(semester);

-- Step 5: users 表新增入學年/畢業年欄位
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS enrollment_year TEXT,
ADD COLUMN IF NOT EXISTS graduation_year TEXT;

-- ============================================
-- 驗證遷移結果
-- ============================================
-- 執行以下查詢確認欄位已新增：
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'schedules';
-- 
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'users';
