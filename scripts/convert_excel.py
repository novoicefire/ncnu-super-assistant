# scripts/convert_excel.py (整合了 Git 自動推送與自動刪除功能)

import pandas as pd
import json
from pathlib import Path
import sys
import datetime
try:
    import git
except ImportError:
    print("錯誤：缺少 'GitPython' 函式庫。")
    print("請在您的虛擬環境中執行: pip install GitPython")
    sys.exit(1)

# --- 您需要設定的區域 ---
SOURCE_EXCEL_FILENAME = "Data Export.xlsx" 
ACADEMIC_YEAR = "114"
ACADEMIC_SEMESTER = "1"

# --- 自動化設定 ---
SCRIPT_DIR = Path(__file__).parent
INPUT_EXCEL_PATH = SCRIPT_DIR / SOURCE_EXCEL_FILENAME
REPO_PATH = SCRIPT_DIR.parent
TARGET_JSON_PATH = REPO_PATH / "frontend" / "public" / "data" / "本學期開課資訊API.json"

# [非常重要] Excel 欄位名稱 -> JSON Key 的對應字典
COLUMN_MAPPING = {
    "課號": "course_id", "班級": "class", "科目": "course_cname", "科目英文名稱": "course_ename",
    "學分": "course_credit", "系所": "department", "學制": "division", "任課教師": "teacher",
    "上課時間": "time", "上課教室": "location",
}
DEPT_TO_FACULTY_MAPPING = {
    "中文系": "人文學院", "外文系": "人文學院", "社工系": "人文學院", "公行系": "人文學院", "歷史系": "人文學院", "東南亞系": "人文學院",
    "國企系": "管理學院", "經濟系": "管理學院", "資管系": "管理學院", "財金系": "管理學院", "觀光餐旅系觀光": "管理學院", "管院": "管理學院",
    "土木系": "科技學院", "資工系": "科技學院", "電機系": "科技學院", "應化系": "科技學院", "應光系": "科技學院",
    "國比系": "教育學院", "教政系": "教育學院", "諮人系": "教育學院", "課科所": "教育學院",
    "護理系": "護理暨健康福祉學院", "高齡長照專班": "護理暨健康福祉學院",
    "通識": "水沙連學院", "共同必": "水沙連學院", "共同選": "水沙連學院"
}

def convert():
    """主轉換函數"""
    print("--- 1. 開始 Excel 轉換作業 ---")
    if not INPUT_EXCEL_PATH.exists():
        print(f"錯誤：找不到 Excel 檔案 '{SOURCE_EXCEL_FILENAME}'。")
        return False

    try:
        df = pd.read_excel(INPUT_EXCEL_PATH, engine='openpyxl', header=1)
        print(f"   成功讀取 {len(df)} 筆課程資料。")
        
        df.rename(columns=COLUMN_MAPPING, inplace=True)
        
        if 'department' not in df.columns:
            print("錯誤：'department' 欄位不存在。請檢查 COLUMN_MAPPING 中的鍵名是否與 Excel 標題完全匹配。")
            return False

        if 'faculty' not in df.columns:
            df['faculty'] = df['department'].map(DEPT_TO_FACULTY_MAPPING).fillna('')
        
        df['year'] = ACADEMIC_YEAR
        df['semester'] = ACADEMIC_SEMESTER
        
        required_keys = ["faculty", "year", "semester", "department", "course_id", "class", "course_cname", "course_ename", "time", "location", "teacher", "division", "course_credit"]
        for key in required_keys:
            if key not in df.columns: df[key] = ""
        for col in ['edepartment', 'eteacher', 'edivision']: df[col] = ""
            
        df['course_credit'] = pd.to_numeric(df['course_credit'], errors='coerce').fillna(0.0)
        df['course_id'] = df['course_id'].astype(str)
        for col in df.columns:
            if df[col].dtype == 'object':
                df[col].fillna("", inplace=True)

        final_df = df[required_keys]
        course_list = final_df.to_dict(orient='records')
        output_json = {"course_ncnu": {"item": course_list}}

        TARGET_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(TARGET_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(output_json, f, ensure_ascii=False, indent=4)
            
        print(f"✔ 轉換成功！資料已儲存至: {TARGET_JSON_PATH}")
        return True
    except Exception as e:
        print(f"在轉換過程中發生錯誤: {e}")
        return False

def git_commit_and_push():
    """自動執行 git add, commit, push，並在成功後刪除 Excel 檔案"""
    print("\n--- 2. 開始自動推送到 GitHub ---")
    try:
        repo = git.Repo(REPO_PATH)
        
        if not repo.is_dirty(untracked_files=True):
            print("資料轉換前後沒有任何變更，無需推送。")
            # 即使沒有推送，也要刪除 Excel 檔案
            delete_source_excel()
            return

        print("正在將更新的課程資料加入版本控制...")
        repo.index.add([str(TARGET_JSON_PATH)])
        
        commit_message = f"Data: 自動更新 {ACADEMIC_YEAR}-{ACADEMIC_SEMESTER} 課程資料 (來自 {SOURCE_EXCEL_FILENAME})"
        repo.index.commit(commit_message)
        print(f"   已建立 Commit: '{commit_message}'")

        origin = repo.remote(name='origin')
        print("   正在推送到遠端倉庫...")
        origin.push()
        print("✔ 推送成功！Vercel 將會開始自動部署新版本的網站。")
        
        # [新增功能] 推送成功後，執行刪除
        delete_source_excel()

    except git.exc.InvalidGitRepositoryError:
        print("錯誤：指定的路徑不是一個 Git 倉庫。")
    except Exception as e:
        print(f"Git 操作失敗: {e}")
        print("請檢查您的 Git 憑證設定或手動執行 'git add', 'commit', 和 'push'。")

def delete_source_excel():
    """刪除來源的 Excel 檔案"""
    print("\n--- 3. 開始清理作業 ---")
    try:
        if INPUT_EXCEL_PATH.exists():
            INPUT_EXCEL_PATH.unlink()
            print(f"✔ 成功刪除來源 Excel 檔案: {SOURCE_EXCEL_FILENAME}")
        else:
            print(f"警告：找不到來源 Excel 檔案 {SOURCE_EXCEL_FILENAME}，可能已被刪除。")
    except OSError as e:
        print(f"錯誤：刪除 Excel 檔案失敗: {e}")

# --- 主執行區 ---
if __name__ == "__main__":
    if convert():
        git_commit_and_push()