# fix_code.py (版本 2 - 已修復)
import os
import re
import shutil
from pathlib import Path

# --- 設定 ---
# 假設此腳本放在專案根目錄
APP_PY_PATH = Path("backend/app.py")
API_HELPER_JS_PATH = Path("frontend/src/apiHelper.js")

# --- 要新增和替換的程式碼 ---

# 1. 要在 app.py 新增的 API 端點
NEW_APP_PY_API_ENDPOINT = """
@app.route('/api/events/today')
def get_today_events():
    \"\"\"
    篩選並回傳今天的行事曆活動。
    \"\"\"
    from datetime import datetime
    load_static_data_if_needed()
    
    today_str = datetime.now().strftime('%Y-%m-%d')
    today_events = []

    for event in CALENDAR_EVENTS:
        # 確保 event['start'] 是字串且至少有10個字元 (YYYY-MM-DD)
        if isinstance(event.get('start'), str) and len(event['start']) >= 10:
            event_date_str = event['start'][:10]
            if event_date_str == today_str:
                today_events.append(event)
    
    return jsonify(today_events)
"""

# 2. 要替換 apiHelper.js 的新函式
NEW_API_HELPER_JS_FUNCTION = """// 🎯 新增：獲取今日行事曆活動 (修正版)
export const getTodayEvents = async () => {
  try {
    // 修正點 1：呼叫正確的 API 路徑
    const response = await robustRequest('get', '/api/events/today');
    
    // 修正點 2：後端已完成篩選，直接回傳 response 即可
    return response || [];
  } catch (error) {
    console.warn('無法載入今日活動:', error);
    // 修正點 3：API 失敗時回傳空陣列，而不是模擬資料
    return [];
  }
};"""

def backup_file(file_path):
    """備份一個檔案（使用複製而不是移動）。"""
    if not file_path.exists():
        return False
    backup_path = file_path.with_suffix(f"{file_path.suffix}.bak")
    try:
        shutil.copy2(file_path, backup_path)
        print(f"✅  已將原檔案備份至: {backup_path}")
        return True
    except Exception as e:
        print(f"❌ 備份失敗: {e}")
        return False

def fix_app_py():
    """修復 backend/app.py"""
    print("\n--- 正在處理 backend/app.py ---")
    if not APP_PY_PATH.exists():
        print(f"❌ 錯誤: 找不到檔案 {APP_PY_PATH}。請確認腳本是否在專案根目錄執行。")
        return

    # 先備份
    if not backup_file(APP_PY_PATH):
        return

    content = APP_PY_PATH.read_text(encoding='utf-8')
    modified_content = content
    
    # 步驟 1: 確保 `datetime` 已被匯入
    if "from datetime import datetime" not in modified_content and "import datetime" not in modified_content:
        # 找到 'import icalendar' 並在其後加入
        modified_content = modified_content.replace(
            "import icalendar",
            "import icalendar\nfrom datetime import datetime",
            1
        )
        print("✅  已自動加入 `datetime` 匯入。")

    # 步驟 2: 插入 .clear()
    target_line = "            temp_events = []"
    insertion = "\n            CALENDAR_EVENTS.clear()"
    if target_line in modified_content and (target_line + insertion) not in modified_content:
        modified_content = modified_content.replace(target_line, target_line + insertion, 1)
        print("✅  成功在 `load_static_data_if_needed` 中插入 `CALENDAR_EVENTS.clear()`。")
    elif (target_line + insertion) in modified_content:
        print("☑️  `CALENDAR_EVENTS.clear()` 已存在，跳過。")
    else:
        print("⚠️  警告: 未找到 'temp_events = []' 特徵，無法插入 .clear()。")

    # 步驟 3: 附加新的 API 端點
    if "def get_today_events():" in modified_content:
        print("☑️  偵測到 `get_today_events` API 已存在，跳過新增。")
    else:
        modified_content += "\n\n" + NEW_APP_PY_API_ENDPOINT.strip()
        print("✅  成功新增 `/api/events/today` API 端點。")

    APP_PY_PATH.write_text(modified_content, encoding='utf-8')
    print("🚀 backend/app.py 修改完成！")

def fix_api_helper_js():
    """修復 frontend/src/apiHelper.js"""
    print("\n--- 正在處理 frontend/src/apiHelper.js ---")
    if not API_HELPER_JS_PATH.exists():
        print(f"❌ 錯誤: 找不到檔案 {API_HELPER_JS_PATH}。")
        return

    # 先備份
    if not backup_file(API_HELPER_JS_PATH):
        return
        
    content = API_HELPER_JS_PATH.read_text(encoding='utf-8')
    
    # 使用正則表達式尋找並替換整個 getTodayEvents 函式
    pattern = re.compile(r"export const getTodayEvents = async \(\) => \{[\s\S]*?};", re.MULTILINE)
    
    if pattern.search(content):
        modified_content = pattern.sub(NEW_API_HELPER_JS_FUNCTION, content, 1)
        API_HELPER_JS_PATH.write_text(modified_content, encoding='utf-8')
        print("✅  成功替換 `getTodayEvents` 函式。")
        print("🚀 frontend/src/apiHelper.js 修改完成！")
    else:
        print("⚠️  警告: 在檔案中找不到 `getTodayEvents` 函式，未進行任何修改。")

if __name__ == "__main__":
    print("🚀 開始執行自動化程式碼修復腳本 (版本 2)...")
    
    # 執行修復
    fix_app_py()
    fix_api_helper_js()
    
    print("\n🎉 全部修復流程已完成！")
    print("請檢查 'backend/app.py' 和 'frontend/src/apiHelper.js' 的變更。")
    print("原始檔案已備份為 .bak 檔案。")

