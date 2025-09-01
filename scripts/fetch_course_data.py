# scripts/fetch_course_data.py (強制更新版)

import requests
import json
from pathlib import Path
import sys
import os
from datetime import datetime

def get_current_academic_year_semester():
    """根據當前日期自動判斷學年和學期"""
    now = datetime.utcnow()
    year = now.year
    month = now.month
    day = now.day
    
    if month > 6 or (month == 6 and day >= 24):
        academic_year = year - 1911
    else:
        academic_year = year - 1912
    
    if month >= 1 and month < 6:
        semester = "2"
    elif month == 6 and day < 24:
        semester = "2"  
    else:
        semester = "1"
    
    return str(academic_year), semester

def fetch_and_save_courses():
    """強制從 API 獲取並更新課程資料"""
    YEAR, SEMESTER = get_current_academic_year_semester()
    
    print(f"--- 週期性課程資料同步 ---")
    print(f"執行時間 (UTC): {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"目標學年期: {YEAR}-{SEMESTER}")
    print(f"---------------------------")
    
    API_URL = f"https://api.ncnu.edu.tw/API/get.aspx?json=course_ncnu&year={YEAR}&semester={SEMESTER}&unitId=all"
    base_path = Path(os.getenv("GITHUB_WORKSPACE", "."))
    OUTPUT_PATH = base_path / "frontend" / "public" / "data" / "本學期開課資訊API.json"
    
    print(f"正在從學校 API 獲取課程資料...")
    print(f"API URL: {API_URL}")
    print(f"儲存路徑: {OUTPUT_PATH}")
    
    try:
        response = requests.get(API_URL, timeout=60)
        response.raise_for_status()
        content = response.json()
        
        # 檢查資料完整性
        data_key = list(content.keys())[0]
        if content[data_key].get('item') is None:
            print("⚠️ 警告：API 返回空資料，但仍將強制更新檔案")
        
        # 強制建立目錄並儲存檔案
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        
        # 添加更新時間戳記
        content['_last_updated'] = datetime.utcnow().isoformat()
        content['_update_source'] = 'weekly_auto_sync'
        
        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=4)
        
        print(f"✔ 強制更新完成！資料已儲存到 {OUTPUT_PATH}")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ 網路請求錯誤: {e}")
        # 建立錯誤標記檔案
        error_content = {
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
            "message": "API請求失敗，請檢查網路連線"
        }
        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(error_content, f, ensure_ascii=False, indent=4)
        sys.exit(1)
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON解析錯誤: {e}")
        sys.exit(1)
        
    except Exception as e:
        print(f"❌ 未知錯誤: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fetch_and_save_courses()
