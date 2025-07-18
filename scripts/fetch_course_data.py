# scripts/fetch_course_data.py (URL 修正 + 健壯版)

import requests
import json
from pathlib import Path
import sys
import os

# --- 設定 ---
YEAR = "113"
SEMESTER = "2"

# [核心修正] 使用了正確的 API 參數 "course_ncnu"
API_URL = f"https://api.ncnu.edu.tw/API/get.aspx?json=course_ncnu&year={YEAR}&semester={SEMESTER}&unitId=all"

# 使用 GITHUB_WORKSPACE 環境變數（在 Actions 中）或當前目錄（在本地）作為基礎路徑
# 這確保了無論在哪裡執行，路徑都是相對於專案根目錄
base_path = Path(os.getenv("GITHUB_WORKSPACE", "."))
OUTPUT_PATH = base_path / "frontend" / "public" / "data" / "本學期開課資訊API.json"

def fetch_and_save_courses():
    """從學校 API 抓取課程資料並儲存為 JSON 檔案"""
    print(f"--- 開始執行資料抓取腳本 ---")
    print(f"目標 API: {API_URL}")
    print(f"預計儲存至: {OUTPUT_PATH}")
    
    try:
        response = requests.get(API_URL, timeout=60) # 延長超時時間
        response.raise_for_status() # 確保請求成功 (HTTP 200)
        
        content = response.json()
        
        # 增加對 API 回傳內容的健壯性檢查
        if not isinstance(content, dict) or "course_ncnu" not in content or "item" not in content.get("course_ncnu", {}):
            print("錯誤：API 回傳的 JSON 格式不正確。")
            print("收到的內容:", str(content)[:500]) # 打印前 500 個字元以供除錯
            sys.exit(1)

        # 確保 data 資料夾存在
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        
        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=4)
            
        print(f"✔ 成功！課程資料已儲存。")
        print(f"--- 腳本執行完畢 ---")

    except requests.exceptions.RequestException as e:
        print(f"錯誤：網路請求失敗: {e}")
        sys.exit(1)
    except json.JSONDecodeError:
        print("錯誤：無法解析返回的 JSON。可能是 API 暫時故障或格式變更。")
        # 嘗試打印原始文字內容以幫助除錯
        try:
            print("收到的原始文字:", response.text[:500])
        except NameError:
            pass
        sys.exit(1)
    except Exception as e:
        print(f"發生未知錯誤: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fetch_and_save_courses()