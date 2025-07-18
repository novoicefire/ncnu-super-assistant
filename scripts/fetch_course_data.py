# scripts/fetch_course_data.py (智慧日期判斷版)

import requests
import json
from pathlib import Path
import sys
import os
from datetime import datetime

def get_current_academic_year_semester():
    """
    根據當前日期自動判斷應該抓取的學年和學期。
    - 學年切換點: 6 月 24 日
    - 學期切換點: 1 月 1 日 (關注下學期), 6 月 24 日 (關注新學年第一學期)
    """
    now = datetime.utcnow() # 使用 UTC 時間以匹配 GitHub Actions 的伺服器時間
    
    # 判斷學年度 (民國年)
    year = now.year
    month = now.month
    day = now.day
    
    academic_year = 0
    if month > 6 or (month == 6 and day >= 24):
        # 6月24日之後，屬於新的學年度
        academic_year = year - 1911
    else:
        # 6月24日之前，屬於舊的學年度
        academic_year = year - 1912
        
    # 判斷學期
    semester = ""
    if month >= 1 and month < 6:
        # 1月到5月，關注的是當前學年的第二學期
        semester = "2"
    elif month == 6 and day < 24:
        # 6月24日前，仍然關注第二學期
        semester = "2"
    else:
        # 6月24日後，進入新學年，關注第一學期
        semester = "1"
        
    return str(academic_year), semester

def fetch_and_save_courses():
    """從學校 API 抓取課程資料並儲存為 JSON 檔案"""
    
    YEAR, SEMESTER = get_current_academic_year_semester()
    
    print(f"--- 自動日期判斷 ---")
    print(f"當前日期 (UTC): {datetime.utcnow().strftime('%Y-%m-%d')}")
    print(f"判斷應抓取學年期: {YEAR}-{SEMESTER}")
    print(f"--------------------")

    API_URL = f"https://api.ncnu.edu.tw/API/get.aspx?json=course_ncnu&year={YEAR}&semester={SEMESTER}&unitId=all"
    
    # [核心修正] 使用 GITHUB_WORKSPACE 環境變數來確保路徑絕對正確
    base_path = Path(os.getenv("GITHUB_WORKSPACE", "."))
    OUTPUT_PATH = base_path / "frontend" / "public" / "data" / "本學期開課資訊API.json"

    print(f"正在從學校 API 獲取課程資料...")
    print(f"目標 URL: {API_URL}")
    print(f"將會儲存到: {OUTPUT_PATH}")
    
    try:
        response = requests.get(API_URL, timeout=60)
        response.raise_for_status()
        content = response.json()
        
        # 檢查 API 是否真的返回了課程資料
        data_key = list(content.keys())[0]
        if content[data_key].get('item') is None:
            # 這種情況通常是學校 API 還沒準備好新學期的資料
            print("警告：學校 API 返回了空的課程列表 (item is null)。")
            print("這可能是正常的，因為新學期課表尚未公布。腳本將不會更新現有檔案。")
            # 我們在這裡正常退出，而不是報錯，這樣就不會用空資料覆蓋掉舊的有效資料
            sys.exit(0)

        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=4)
        print(f"✔ 成功！課程資料已儲存。")

    except requests.exceptions.RequestException as e:
        print(f"錯誤：網路請求失敗: {e}")
        sys.exit(1)
    except json.JSONDecodeError:
        print("錯誤：無法解析返回的 JSON。")
        print("收到的原始文字:", response.text)
        sys.exit(1)
    except Exception as e:
        print(f"發生未知錯誤: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fetch_and_save_courses()