# backend/app.py (完整動態版)

import json
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from icalendar import Calendar
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["https://ncnu-super-assistant.vercel.app", "http://localhost:5173", "https://*.vercel.app"]}})

# --- 全域快取 (只快取不變的資料) ---
STATIC_DATA = {}
CALENDAR_EVENTS = []

def load_static_data():
    """只載入不會頻繁變動的資料，例如單位代碼、聯絡資訊等"""
    global STATIC_DATA, CALENDAR_EVENTS
    
    # 避免在重啟時重複載入
    if STATIC_DATA:
        return

    print("Loading static data (contacts, departments, calendar)...")
    
    # API 網址
    api_urls = {
        'unitId_ncnu': 'https://api.ncnu.edu.tw/API/get.aspx?json=unitId_ncnu',
        'contact_ncnu': 'https://api.ncnu.edu.tw/API/get.aspx?json=contact_ncnu',
        'course_deptId': 'https://api.ncnu.edu.tw/API/get.aspx?json=course_deptId'
    }

    for key, url in api_urls.items():
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            content = response.json()
            data_key = list(content.keys())[0]
            STATIC_DATA[key] = content[data_key]['item']
        except Exception as e:
            print(f"Warning: Failed to fetch static data for '{key}'. Error: {e}")
            STATIC_DATA[key] = []
    
    # 載入行事曆
    try:
        ics_url = "https://www.google.com/calendar/ical/curricul%40mail.ncnu.edu.tw/public/basic.ics"
        response = requests.get(ics_url, timeout=10)
        response.raise_for_status()
        calendar = Calendar.from_ical(response.content)
        for component in calendar.walk():
            if component.name == "VEVENT":
                dtstart = component.get('dtstart')
                dtend = component.get('dtend')
                if dtstart and dtend:
                    CALENDAR_EVENTS.append({
                        "summary": str(component.get('summary')),
                        "start": dtstart.dt.isoformat(),
                        "end": dtend.dt.isoformat()
                    })
        CALENDAR_EVENTS.sort(key=lambda x: x['start'])
    except Exception as e:
        print(f"Warning: Failed to fetch calendar. Error: {e}")
        pass

# --- API 端點 ---

@app.route("/")
def index():
    return "NCNU Super Assistant Backend is alive! (Dynamic API version)"

@app.route('/api/courses')
def get_courses():
    """根據前端傳來的參數，動態抓取學期課程"""
    year = request.args.get('year', '113')
    semester = request.args.get('semester', '2')
    unitId = request.args.get('unitId', 'all')

    url = f"https://api.ncnu.edu.tw/API/get.aspx?json=course_ncnu&year={year}&semester={semester}&unitId={unitId}"
    
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        content = response.json()
        data_key = list(content.keys())[0]
        courses = content[data_key].get('item', [])
        return jsonify(courses if courses is not None else [])
    except Exception as e:
        print(f"Error fetching courses from {url}. Error: {e}")
        return jsonify({"error": f"Failed to fetch courses: {e}"}), 500

@app.route('/api/required_courses')
def get_required_courses():
    """根據前端傳來的參數，動態抓取必修課"""
    year = request.args.get('year')
    deptId = request.args.get('deptId')
    class_type = request.args.get('class')

    if not all([year, deptId, class_type]):
        return jsonify({"error": "Missing required parameters: year, deptId, class"}), 400

    url = f"https://api.ncnu.edu.tw/API/get.aspx?json=course_require&year={year}&deptId={deptId}&class={class_type}"
    
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        content = response.json()
        data_key = list(content.keys())[0]
        required_courses = content[data_key].get('item', [])
        return jsonify(required_courses if required_courses is not None else [])
    except Exception as e:
        print(f"Error fetching required courses from {url}. Error: {e}")
        return jsonify({"error": f"Failed to fetch required courses: {e}"}), 500

# --- 不變的靜態 API 端點 ---

@app.route('/api/departments')
def get_departments():
    return jsonify(STATIC_DATA.get('course_deptId', []))

@app.route('/api/contacts')
def get_contacts():
    contacts = STATIC_DATA.get('contact_ncnu', [])
    unit_info = STATIC_DATA.get('unitId_ncnu', [])
    
    if not contacts or not unit_info:
        return jsonify(contacts) # 如果有資料缺失，直接回傳原始資料

    for contact in contacts:
        matching_unit = next((unit for unit in unit_info if unit['中文名稱'] == contact['title']), None)
        if matching_unit:
            contact['web'] = matching_unit.get('網站網址', contact.get('web'))
    return jsonify(contacts)

@app.route('/api/calendar')
def get_calendar():
    return jsonify(CALENDAR_EVENTS)

# --- 應用程式啟動 ---
with app.app_context():
    load_static_data()