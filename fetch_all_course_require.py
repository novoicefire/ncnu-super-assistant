# fetch_all_course_require.py
import os
import time
import json
import logging
from pathlib import Path
from typing import List
import requests
from requests.exceptions import RequestException

YEAR = os.getenv("NCNU_YEAR", "114")            # 可改成 CLI 參數
SAVE_DIR = Path("./course_require_data")
SAVE_DIR.mkdir(exist_ok=True)
LOG_FILE = SAVE_DIR / "fetch_log.txt"

# ───────────────────────── 日誌設定 ──────────────────────────
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    encoding="utf-8"
)

# ───────────────────────── 公用函式 ──────────────────────────
def fetch_json(url: str, retries: int = 3, sleep_sec: float = 1.0):
    """簡易 GET，失敗自動重試"""
    for attempt in range(1, retries + 1):
        try:
            res = requests.get(url, timeout=15)
            res.raise_for_status()
            return res.json()
        except RequestException as e:
            logging.warning(f"Attempt {attempt}/{retries} failed: {e}")
            if attempt == retries:
                raise
            time.sleep(sleep_sec)

def get_dept_ids() -> List[str]:
    """讀取所有 deptId（兩碼大小寫英數字）"""
    url = "https://api.ncnu.edu.tw/API/get.aspx?json=course_deptId"
    data = fetch_json(url)
    items = data.get("course_deptId", {}).get("item", [])
    return [item["開課單位代碼"].strip() for item in items if item.get("開課單位代碼")]

def save_course_require(dept_id: str, cls: str):
    """抓取並儲存單一系所+班別資料"""
    url = (f"https://api.ncnu.edu.tw/API/get.aspx?"
           f"json=course_require&year={YEAR}&deptId={dept_id}&class={cls}")
    try:
        data = fetch_json(url)
        fname = SAVE_DIR / f"course_require_{YEAR}_{dept_id}_{cls}.json"
        fname.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        logging.info(f"✔ Saved {fname.name}")
    except Exception as e:
        logging.error(f"✘ Failed {dept_id}-{cls}: {e}")

def main():
    dept_ids = get_dept_ids()
    class_types = ["B", "G", "P"]
    total = len(dept_ids) * len(class_types)
    logging.info(f"Start fetching {total} files for academic year {YEAR}")

    for idx, dept in enumerate(dept_ids, 1):
        for cls in class_types:
            save_course_require(dept, cls)
            time.sleep(1)          # 禮貌間隔
        if idx % 20 == 0:
            logging.info(f"Progress: {idx}/{len(dept_ids)} departments done")

    logging.info("All done!")

if __name__ == "__main__":
    main()
