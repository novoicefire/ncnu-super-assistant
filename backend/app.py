# backend/app.py

import json
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from icalendar import Calendar
from datetime import datetime

# --- 應用程式設定 ---
app = Flask(__name__)
# 允許所有來源的跨域請求，方便前後端分離開發
CORS(app)

# --- 資料載入與快取 ---
# 使用全域變數來模擬資料庫/快取
# 在真實應用中，這裡可以替換成 Redis 或資料庫
DATA = {}
CALENDAR_EVENTS = []

def load_json_data():
    """在應用程式啟動時，從 data 資料夾載入所有 JSON 檔案。"""
    global DATA
    data_path = Path(__file__).parent.parent / 'data'
    json_files = {
        'unitId_ncnu': '行政教學單位代碼API.json',
        'contact_ncnu': '校園聯絡資訊API.json',
        'course_ncnu': '本學期開課資訊API.json',
        'course_require_ncnu': '本學年某系所必修課資訊API(以國企系大學班為範例).json',
        'course_deptId': '開課單位代碼API.json'
    }

    for key, filename in json_files.items():
        file_path = data_path / filename
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                # 取得 JSON 檔案中 "item" 列表的資料
                content = json.load(f)
                data_key = list(content.keys())[0] # e.g., "deptId_ncnu"
                DATA[key] = content[data_key]['item']
            print(f"Successfully loaded {filename}")
        except Exception as e:
            print(f"Error loading {filename}: {e}")
            DATA[key] = []

def parse_university_calendar():
    """解析暨大行事曆 ICS 檔案。"""
    global CALENDAR_EVENTS
    ics_url = "https://www.google.com/calendar/ical/curricul%40mail.ncnu.edu.tw/public/basic.ics"
    try:
        response = requests.get(ics_url)
        response.raise_for_status()
        calendar = Calendar.from_ical(response.content)

        for component in calendar.walk():
            if component.name == "VEVENT":
                event = {
                    "summary": str(component.get('summary')),
                    "start": component.get('dtstart').dt.isoformat() if hasattr(component.get('dtstart').dt, 'isoformat') else str(component.get('dtstart').dt),
                    "end": component.get('dtend').dt.isoformat() if hasattr(component.get('dtend').dt, 'isoformat') else str(component.get('dtend').dt)
                }
                CALENDAR_EVENTS.append(event)
        
        # 排序事件
        CALENDAR_EVENTS.sort(key=lambda x: x['start'])
        print(f"Successfully parsed {len(CALENDAR_EVENTS)} calendar events.")

    except Exception as e:
        print(f"Error parsing calendar: {e}")

# --- API 端點 (Endpoints) ---

@app.route('/')
def index():
    return "<h1>歡迎來到暨大生超級助理後端 API！</h1>"

# 功能1 & 2 & 3 & 4 所需 API
@app.route('/api/courses')
def get_courses():
    """
    獲取本學期所有課程，並提供篩選功能。
    可選參數:
    - teacher (模糊)
    - course_cname (模糊)
    - faculty (精確)
    - department (精確)
    - division (精- 學士班/碩士班/博士班)
    """
    courses = DATA.get('course_ncnu', [])
    
    # 篩選邏輯
    teacher_query = request.args.get('teacher')
    cname_query = request.args.get('course_cname')
    faculty_query = request.args.get('faculty')
    department_query = request.args.get('department')
    division_query = request.args.get('division')

    if teacher_query:
        courses = [c for c in courses if teacher_query in c.get('teacher', '')]
    if cname_query:
        courses = [c for c in courses if cname_query in c.get('course_cname', '')]
    if faculty_query:
        courses = [c for c in courses if faculty_query == c.get('faculty', '')]
    if department_query:
        courses = [c for c in courses if department_query == c.get('department', '')]
    if division_query:
        # 通識課的 faculty 欄位為"水沙連學院"，但 department 可能是"通識"或"共同必"
        if division_query == '通識':
            courses = [c for c in courses if c.get('department') in ['通識']]
        else:
             courses = [c for c in courses if division_query == c.get('division', '')]


    return jsonify(courses)

# 功能1 & 2 所需 API
@app.route('/api/departments')
def get_departments():
    """獲取所有開課單位代碼與名稱。"""
    return jsonify(DATA.get('course_deptId', []))
    
# 功能 2 所需 API
@app.route('/api/required_courses')
def get_required_courses():
    """
    獲取指定系所班別的必修課。
    注意：目前僅能回傳範例檔案中的國企系學士班資料。
    參數:
    - deptId: 開課單位代碼 (e.g., 12)
    - class: 班別 (e.g., B)
    """
    # 這裡的邏輯是為了演示，因為我們只有一個範例檔
    # 在真實應用中，您需要根據傳入的參數去呼叫學校的 API
    deptId = request.args.get('deptId')
    class_type = request.args.get('class')

    if deptId == '12' and class_type == 'B':
        return jsonify(DATA.get('course_require_ncnu', []))
    else:
        # 回傳一個空的列表或錯誤訊息，表示目前沒有該系的資料
        return jsonify({
            "error": "目前範例資料庫僅支援國企系(deptId=12)學士班(class=B)的必修課程查詢。"
        }), 404

# 功能 3 所需 API
@app.route('/api/contacts')
def get_contacts():
    """獲取所有校園聯絡資訊。"""
    # 將行政單位代碼API的網站網址資訊，合併到聯絡資訊中
    unit_websites = {unit['行政教學單位代碼']: unit['網站網址'] for unit in DATA.get('unitId_ncnu', [])}
    
    contacts = DATA.get('contact_ncnu', [])
    # 由於 API 沒有提供單位代碼，我們用中文名稱來嘗試匹配
    for contact in contacts:
        # 尋找對應的行政單位中文名稱
        matching_unit = next((unit for unit in DATA.get('unitId_ncnu', []) if unit['中文名稱'] == contact['title']), None)
        if matching_unit:
            contact['web'] = matching_unit.get('網站網址', contact.get('web')) # 如果 contact 本身有 web 則優先使用

    return jsonify(contacts)

# 功能 4 所需 API
@app.route('/api/calendar')
def get_calendar():
    """獲取校園行事曆事件。"""
    return jsonify(CALENDAR_EVENTS)


# --- 主程式啟動 ---
if __name__ == '__main__':
    # 應用程式啟動時，先載入所有資料
    load_json_data()
    parse_university_calendar()
    # 啟動 Flask 伺服器，debug=True 會在程式碼變更時自動重啟
    app.run(debug=True, port=5001)