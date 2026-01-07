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
    
    # 🆕 v2.0：儲存至學期專屬檔案
    SEMESTER_OUTPUT_PATH = base_path / "frontend" / "public" / "data" / f"開課資訊_{YEAR}_{SEMESTER}.json"
    # 同時保留原檔案（向後相容）
    LEGACY_OUTPUT_PATH = base_path / "frontend" / "public" / "data" / "本學期開課資訊API.json"
    
    print(f"正在從學校 API 獲取課程資料...")
    print(f"API URL: {API_URL}")
    print(f"儲存路徑: {SEMESTER_OUTPUT_PATH}")
    
    try:
        response = requests.get(API_URL, timeout=60)
        response.raise_for_status()
        content = response.json()
        
        # 檢查資料完整性
        data_key = list(content.keys())[0]
        if content[data_key].get('item') is None:
            print("⚠️ 警告：API 返回空資料，但仍將強制更新檔案")
        
        # 強制建立目錄並儲存檔案
        SEMESTER_OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        
        # 添加更新時間戳記
        content['_last_updated'] = datetime.utcnow().isoformat()
        content['_update_source'] = 'weekly_auto_sync'
        content['_semester'] = f"{YEAR}-{SEMESTER}"
        
        # 🆕 儲存至學期專屬檔案
        with open(SEMESTER_OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=4)
        print(f"✔ 學期檔案更新完成！{SEMESTER_OUTPUT_PATH}")
        
        # 🆕 同時更新舊版檔案（向後相容）
        with open(LEGACY_OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=4)
        print(f"✔ 舊版檔案同步更新！{LEGACY_OUTPUT_PATH}")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ 網路請求錯誤: {e}")
        # 建立錯誤標記檔案
        error_content = {
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
            "message": "API請求失敗，請檢查網路連線"
        }
        with open(SEMESTER_OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(error_content, f, ensure_ascii=False, indent=4)
        sys.exit(1)
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON解析錯誤: {e}")
        sys.exit(1)
        
    except Exception as e:
        print(f"❌ 未知錯誤: {e}")
        sys.exit(1)

if __name__ == "__main__":
    import argparse
    
    # 動態計算當前學年（每年自動更新）
    current_year, _ = get_current_academic_year_semester()
    current_year = int(current_year)
    default_start = current_year - 4  # 4 年前
    default_end = current_year + 4    # 4 年後
    
    parser = argparse.ArgumentParser(description='下載暨大開課資料')
    parser.add_argument('--historical', action='store_true', help='下載歷史學期資料')
    parser.add_argument('--start-year', type=int, default=default_start, 
                        help=f'起始學年 (預設 {default_start}，動態計算)')
    parser.add_argument('--end-year', type=int, default=default_end, 
                        help=f'結束學年 (預設 {default_end}，動態計算)')
    args = parser.parse_args()
    
    if args.historical:
        print("=" * 50)
        print("[BATCH] 批次下載歷史學期開課資料")
        print("=" * 50)
        
        base_path = Path(os.getenv("GITHUB_WORKSPACE", "."))
        output_dir = base_path / "frontend" / "public" / "data"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        success_count = 0
        fail_count = 0
        
        for year in range(args.start_year, args.end_year + 1):
            for sem in ['1', '2']:
                semester_id = f"{year}-{sem}"
                output_path = output_dir / f"開課資訊_{year}_{sem}.json"
                
                # 跳過已存在的檔案
                if output_path.exists():
                    print(f"[SKIP] {semester_id} 已存在")
                    continue
                
                api_url = f"https://api.ncnu.edu.tw/API/get.aspx?json=course_ncnu&year={year}&semester={sem}&unitId=all"
                
                try:
                    print(f"[DOWNLOAD] {semester_id}...", end=" ")
                    response = requests.get(api_url, timeout=60)
                    response.raise_for_status()
                    content = response.json()
                    
                    # 檢查是否有資料
                    data_key = list(content.keys())[0] if content else None
                    if data_key and content[data_key].get('item'):
                        item_count = len(content[data_key]['item'])
                        content['_last_updated'] = datetime.utcnow().isoformat()
                        content['_semester'] = semester_id
                        
                        with open(output_path, 'w', encoding='utf-8') as f:
                            json.dump(content, f, ensure_ascii=False, indent=4)
                        print(f"[OK] {item_count} courses")
                        success_count += 1
                    else:
                        print(f"[EMPTY] No data")
                        fail_count += 1
                        
                except Exception as e:
                    print(f"[FAIL] {e}")
                    fail_count += 1
        
        print("=" * 50)
        print(f"[DONE] Success: {success_count}, Failed: {fail_count}")
    else:
        fetch_and_save_courses()

