# clean_frontend_course_files.py
import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Any

# 🎯 修改：指向前端專案的 data 資料夾
DATA_DIR = Path(r"C:\Users\ofire\Desktop\ncnu-super-assistant\frontend\public\data")
LOG_FILE = DATA_DIR / "cleanup_log.txt"

# 設定日誌
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler()  # 同時顯示在控制台
    ]
)

def is_empty_course_file(file_path: Path) -> tuple[bool, str]:
    """
    檢查檔案是否為空課程資料
    
    Returns:
        (is_empty: bool, reason: str)
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 取得 course_require_ncnu.item
        item = data.get("course_require_ncnu", {}).get("item")
        
        if not item:
            return True, "item為空"
        
        # 情況1: item是物件且包含 "合計: 0 門課程"
        if isinstance(item, dict):
            course_cname = item.get("course_cname", "")
            if "合計: 0 門課程" in course_cname:
                return True, f"合計0門課程: {course_cname}"
            if course_cname.startswith("合計:") and ("0 門" in course_cname or "0門" in course_cname):
                return True, f"合計0門課程變體: {course_cname}"
            # 🎯 新增：檢查 course_id 為 "必修課程" 的單項資料
            course_id = item.get("course_id", "").strip()
            if course_id == "必修課程" and ("合計:" in course_cname or course_cname == ""):
                return True, f"僅有必修課程標題: {course_cname}"
        
        # 情況2: item是陣列但為空
        elif isinstance(item, list):
            if len(item) == 0:
                return True, "課程陣列為空"
            
            # 情況3: 陣列只有一個元素且為 "必修課程" 標題
            if len(item) == 1:
                course = item[0]
                if isinstance(course, dict):
                    course_id = course.get("course_id", "").strip()
                    course_cname = course.get("course_cname", "")
                    
                    # 檢查是否為標題行或合計行
                    if course_id == "必修課程" or "合計:" in course_cname:
                        return True, f"僅含標題或合計: {course_cname}"
            
            # 情況4: 陣列中所有課程都是無效的
            valid_courses = []
            for course in item:
                if isinstance(course, dict):
                    course_id = course.get("course_id", "").strip()
                    course_cname = course.get("course_cname", "")
                    # 過濾掉標題行和合計行
                    if course_id != "必修課程" and "合計:" not in course_cname and course_cname:
                        valid_courses.append(course)
            
            if len(valid_courses) == 0:
                return True, "無有效課程資料"
        
        return False, "有效課程資料"
        
    except (json.JSONDecodeError, KeyError, FileNotFoundError) as e:
        logging.warning(f"讀取檔案失敗 {file_path}: {e}")
        return False, f"讀取失敗: {e}"

def clean_empty_files() -> Dict[str, List[str]]:
    """
    掃描並清理空的課程檔案
    
    Returns:
        {"deleted": [...], "kept": [...], "errors": [...]}
    """
    if not DATA_DIR.exists():
        logging.error(f"資料目錄不存在: {DATA_DIR}")
        return {"deleted": [], "kept": [], "errors": []}
    
    # 找出所有 course_require_*.json 檔案
    pattern = "course_require_*.json"
    course_files = list(DATA_DIR.glob(pattern))
    
    if not course_files:
        logging.warning(f"在 {DATA_DIR} 中找不到符合 {pattern} 的檔案")
        return {"deleted": [], "kept": [], "errors": []}
    
    results = {"deleted": [], "kept": [], "errors": []}
    
    logging.info(f"開始掃描 {len(course_files)} 個檔案...")
    
    for file_path in course_files:
        try:
            is_empty, reason = is_empty_course_file(file_path)
            
            if is_empty:
                # 刪除空檔案
                file_path.unlink()
                results["deleted"].append(f"{file_path.name} - {reason}")
                logging.info(f"✘ 刪除: {file_path.name} ({reason})")
            else:
                # 保留有效檔案
                results["kept"].append(f"{file_path.name} - {reason}")
                logging.debug(f"✔ 保留: {file_path.name}")  # 改為 debug 減少輸出
                
        except Exception as e:
            results["errors"].append(f"{file_path.name} - {e}")
            logging.error(f"❌ 處理失敗: {file_path.name} - {e}")
    
    return results

def generate_summary_report(results: Dict[str, List[str]]):
    """生成清理摘要報告"""
    total_deleted = len(results["deleted"])
    total_kept = len(results["kept"])
    total_errors = len(results["errors"])
    total_processed = total_deleted + total_kept + total_errors
    
    print("\n" + "="*60)
    print("📋 前端檔案清理摘要報告")
    print("="*60)
    print(f"📁 掃描路徑: {DATA_DIR}")
    print(f"📁 處理檔案總數: {total_processed}")
    print(f"🗑️  刪除空檔案數: {total_deleted}")
    print(f"✅ 保留有效檔案: {total_kept}")
    print(f"❌ 處理失敗檔案: {total_errors}")
    
    if results["deleted"]:
        print(f"\n🗑️  已刪除的檔案 (顯示前10個):")
        for item in results["deleted"][:10]:
            print(f"   • {item}")
        if len(results["deleted"]) > 10:
            print(f"   ... 及其他 {len(results['deleted']) - 10} 個檔案")
    
    if results["errors"]:
        print(f"\n❌ 處理失敗的檔案:")
        for item in results["errors"]:
            print(f"   • {item}")
    
    print("="*60)
    
    # 將詳細報告寫入檔案
    report_file = DATA_DIR / "cleanup_report.txt"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("前端課程檔案清理詳細報告\n")
        f.write("="*40 + "\n")
        f.write(f"掃描路徑: {DATA_DIR}\n")
        f.write(f"掃描時間: {logging.Formatter().formatTime(logging.LogRecord('', 0, '', 0, '', (), None))}\n\n")
        
        f.write(f"已刪除檔案 ({total_deleted}):\n")
        for item in results["deleted"]:
            f.write(f"  {item}\n")
        
        f.write(f"\n保留檔案 ({total_kept}):\n")
        for item in results["kept"]:
            f.write(f"  {item}\n")
            
        if results["errors"]:
            f.write(f"\n處理失敗 ({total_errors}):\n")
            for item in results["errors"]:
                f.write(f"  {item}\n")
    
    print(f"📄 詳細報告已儲存至: {report_file}")

def preview_files_to_delete():
    """預覽將要刪除的檔案"""
    print("🔍 預覽模式：檢查將要刪除的檔案...")
    
    if not DATA_DIR.exists():
        print(f"❌ 資料目錄不存在: {DATA_DIR}")
        return
    
    course_files = list(DATA_DIR.glob("course_require_*.json"))
    if not course_files:
        print("❌ 找不到課程檔案")
        return
    
    to_delete = []
    to_keep = []
    
    for file_path in course_files:
        is_empty, reason = is_empty_course_file(file_path)
        if is_empty:
            to_delete.append((file_path.name, reason))
        else:
            to_keep.append(file_path.name)
    
    print(f"\n📊 預覽結果:")
    print(f"🗑️  將刪除: {len(to_delete)} 個檔案")
    print(f"✅ 將保留: {len(to_keep)} 個檔案")
    
    if to_delete:
        print(f"\n🗑️  將刪除的檔案 (顯示前15個):")
        for name, reason in to_delete[:15]:
            print(f"   • {name} - {reason}")
        if len(to_delete) > 15:
            print(f"   ... 及其他 {len(to_delete) - 15} 個檔案")

def main():
    import sys
    
    # 檢查命令列參數
    if len(sys.argv) > 1 and sys.argv[1] == "--preview":
        preview_files_to_delete()
        return
    
    logging.info(f"開始清理前端專案中的空課程資料檔案...")
    logging.info(f"目標路徑: {DATA_DIR}")
    
    # 確認路徑存在
    if not DATA_DIR.exists():
        print(f"❌ 錯誤：目標路徑不存在")
        print(f"   路徑: {DATA_DIR}")
        print(f"   請確認路徑是否正確")
        return
    
    # 執行清理
    results = clean_empty_files()
    
    # 生成報告
    generate_summary_report(results)
    
    # 🎯 給出下一步提示
    if results["kept"]:
        print(f"\n🚀 下一步操作:")
        print(f"   • 現在您可以重新啟動前端專案")
        print(f"   • 畢業進度頁面將自動支援所有有資料的系所")
        print(f"   • 建議測試幾個不同的系所確認功能正常")
    
    logging.info("清理作業完成!")

if __name__ == "__main__":
    main()
