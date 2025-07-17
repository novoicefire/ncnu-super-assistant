import json
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from icalendar import Calendar
from datetime import datetime

# --- 應用程式設定 ---
app = Flask(__name__)

# --- CORS 設定 (優化) ---
# 明確允許來自 Vercel 的部署網址和所有 Vercel 的預覽網址
# *.vercel.app 是一個萬用字元，可以匹配所有 Vercel 的子網域
CORS(
    app,
    resources={r"/api/*": {"origins": [
        "https://ncnu-super-assistant.vercel.app", # 您的主要網站
        "http://localhost:5173",                 # 本地開發
        "https://*.vercel.app"                   # 允許所有 Vercel 的預覽部署
    ]}}
)

# --- 資料載入與快取 (優化) ---
# 移除了 _data_loader.py，將所有邏輯集中在 app.py
DATA = {}
CALENDAR_EVENTS = []

def load_all_data():
    global DATA, CALENDAR_EVENTS
    # 這裡的路徑是相對於 app.py 的位置
    data_path = Path(__file__).parent.parent / 'data'
    json_files = {
        'unitId_ncnu': '行政教學單位代碼API.json',
        'contact_ncnu': '校園聯絡資訊API.json',
        'course_ncnu': '本學期開課資訊API.json',
        'course_require_ncnu': '本學年某系所必修課資訊API(以國企系大學班為範例).json',
        'course_deptId': '開課單位代碼API.json'
    }
    for key, filename in json_files.items():
        try:
            with open(data_path / filename, 'r', encoding='utf-8') as f:
                content = json.load(f)
                data_key = list(content.keys())[0]
                DATA[key] = content[data_key]['item']
        except Exception as e:
            DATA[key] = []

    ics_url = "https://www.google.com/calendar/ical/curricul%40mail.ncnu.edu.tw/public/basic.ics"
    try:
        response = requests.get(ics_url)
        response.raise_for_status()
        calendar = Calendar.from_ical(response.content)
        for component in calendar.walk():
            if component.name == "VEVENT":
                CALENDAR_EVENTS.append({
                    "summary": str(component.get('summary')),
                    "start": component.get('dtstart').dt.isoformat(),
                    "end": component.get('dtend').dt.isoformat()
                })
        CALENDAR_EVENTS.sort(key=lambda x: x['start'])
    except Exception:
        pass

# --- API 端點 ---
# 健康檢查端點，用於喚醒服務
@app.route("/")
def index():
    return "NCNU Super Assistant Backend is alive!"

@app.route('/api/courses')
def get_courses():
    courses = DATA.get('course_ncnu', [])
    # ... (篩選邏輯與之前相同) ...
    params = request.args
    if params.get('teacher'):
        courses = [c for c in courses if params.get('teacher') in c.get('teacher', '')]
    # ... 添加其他篩選條件 ...
    return jsonify(courses)

# ... (將您之前在 functions/*.py 中的其他端點邏輯複製過來) ...
@app.route('/api/departments')
def get_departments():
    return jsonify(DATA.get('course_deptId', []))

@app.route('/api/contacts')
def get_contacts():
    # ... (整合邏輯與之前相同) ...
    return jsonify(DATA.get('contact_ncnu', []))

@app.route('/api/calendar')
def get_calendar():
    return jsonify(CALENDAR_EVENTS)

@app.route('/api/required_courses')
def get_required_courses():
    # ... (邏輯與之前相同) ...
    return jsonify(DATA.get('course_require_ncnu', []))


# --- 應用程式啟動 ---
# 在檔案被載入時就讀取資料
load_all_data()

# if __name__ == '__main__':
#     app.run(debug=True, port=5001)
# (在 Render 上運行時，我們使用 gunicorn，所以不需要 main 區塊)