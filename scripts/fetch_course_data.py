import requests
import json
from pathlib import Path

# --- 設定 ---
# 這是目前學期的設定，未來可以透過參數傳入
YEAR = "113"
SEMESTER = "2"

# 學校課程 API 的 URL
API_URL = f"https://api.ncnu.edu.tw/API/get.aspx?json=course_ncnu&year={YEAR}&semester={SEMESTER}&unitId=all"

# 輸出路徑：前端專案的 public/data 資料夾
OUTPUT_PATH = Path("frontend") / "public" / "data" / "本學期開課資訊API.json"

def fetch_and_save_courses():
    """從學校 API 抓取課程資料並儲存為 JSON 檔案"""
    print(f"正在從學校 API 獲取 {YEAR}-{SEMESTER} 的課程資料...")
    
    try:
        response = requests.get(API_URL, timeout=30)
        response.raise_for_status() # 如果 HTTP 狀態碼不是 200，則拋出錯誤
        
        content = response.json()
        
        # 確保 data 資料夾存在
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        
        # 將原始的 JSON 內容直接寫入檔案
        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=4)
            
        print(f"✔ 成功！課程資料已儲存至: {OUTPUT_PATH}")

    except requests.exceptions.RequestException as e:
        print(f"錯誤：無法從學校 API 獲取資料。網路錯誤: {e}")
        exit(1) # 帶錯誤碼退出，讓 GitHub Action 知道此步驟失敗
    except json.JSONDecodeError:
        print("錯誤：無法解析從學校 API 返回的 JSON 資料。可能是 API 暫時故障。")
        exit(1)

if __name__ == "__main__":
    fetch_and_save_courses()