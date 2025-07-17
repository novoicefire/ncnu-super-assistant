import json
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from icalendar import Calendar
from datetime import datetime

# --- 應用程式設定 ---
app = Flask(__name__)

# --- CORS 設定 ---
# 允許來自 Vercel 的部署網址和所有 Vercel 的預覽網址
CORS(
    app,
    resources={r"/api/*": {"origins": [
        "https://ncnu-super-assistant.vercel.app",  # 您 Vercel 網站的網址
        "http://localhost:5173",                     # 本地開發
        "https://*.vercel.app"                       # 允許所有 Vercel 的預覽部署
    ]}}
)

# --- 資料載入與快取 ---
DATA = {}
CALENDAR_EVENTS = []

def load_all_data():
    """在應用程式啟動時，從 data 資料夾載入所有 JSON 檔案。"""
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
        except Exception:
            DATA[key] = []

    ics_url = "https://www.google.com/calendar/ical/curricul%40mail.ncnu.edu.tw/public/basic.ics"
    try:
        response = requests.get(ics_url)
        response.raise_for_status()
        calendar = Calendar.from_ical(response.content)
        for component in calendar.walk():
            if component.name == "VEVENT":
                # 確保 dtstart 和 dtend 存在
                dtstart = component.get('dtstart')
                dtend = component.get('dtend')
                if dtstart and dtend:
                    CALENDAR_EVENTS.append({
                        "summary": str(component.get('summary')),
                        "start": dtstart.dt.isoformat() if hasattr(dtstart.dt, 'isoformat') else str(dtstart.dt),
                        "end": dtend.dt.isoformat() if hasattr(dtend.dt, 'isoformat') else str(dtend.dt)
                    })
        CALENDAR_EVENTS.sort(key=lambda x: x['start'])
    except Exception:
        pass

# --- API 端點 ---
@app.route("/")
def index():
    return "NCNU Super Assistant Backend is alive and well!"

@app.route('/api/courses')
def get_courses():
    courses = DATA.get('course_ncnu', [])
    params = request.args
    teacher_query = params.get('teacher')
    cname_query = params.get('course_cname')
    department_query = params.get('department')
    division_query = params.get('division')

    if teacher_query:
        courses = [c for c in courses if teacher_query in c.get('teacher', '')]
    if cname_query:
        courses = [c for c in courses if cname_query in c.get('course_cname', '')]
    if department_query:
        courses = [c for c in courses if department_query == c.get('department', '')]
    if division_query:
        if division_query == '通識':
            courses = [c for c in courses if c.get('department') == '通識']
        else:
            courses = [c for c in courses if division_query == c.get('division', '')]
    return jsonify(courses)

@app.route('/api/departments')
def get_departments():
    return jsonify(DATA.get('course_deptId', []))

@app.route('/api/contacts')
def get_contacts():
    contacts = DATA.get('contact_ncnu', [])
    unit_info = DATA.get('unitId_ncnu', [])
    for contact in contacts:
        matching_unit = next((unit for unit in unit_info if unit['中文名稱'] == contact['title']), None)
        if matching_unit:
            contact['web'] = matching_unit.get('網站網址', contact.get('web'))
    return jsonify(contacts)

@app.route('/api/calendar')
def get_calendar():
    return jsonify(CALENDAR_EVENTS)

@app.route('/api/required_courses')
def get_required_courses():
    params = request.args
    deptId = params.get('deptId')
    class_type = params.get('class')
    if deptId == '12' and class_type == 'B':
        return jsonify(DATA.get('course_require_ncnu', []))
    else:
        return jsonify({"error": "目前範例資料庫僅支援國企系(deptId=12)學士班(class=B)的必修課程查詢。"}), 404

# --- 應用程式啟動 ---
# 在 Flask 應用程式啟動時，預先載入所有資料
with app.app_context():
    load_all_data()

# Render 會使用 gunicorn 來運行這個 app 物件，所以不需要 __main__ 區塊