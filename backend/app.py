import json
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from icalendar import Calendar
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["https://ncnu-super-assistant.vercel.app", "http://localhost:5173", "https://*.vercel.app"]}})

# --- 全域資料快取 ---
DATA = {}
CALENDAR_EVENTS = []

def load_all_data():
    """在應用程式啟動時，從網路 API 抓取資料。如果失敗，則從本地 data 資料夾讀取作為備份。"""
    global DATA, CALENDAR_EVENTS
    print("Attempting to fetch latest data from network APIs...")

    # --- JSON 資料 API 網址 ---
    API_URLS = {
        'unitId_ncnu': 'https://api.ncnu.edu.tw/API/get.aspx?json=unitId_ncnu',
        'contact_ncnu': 'https://api.ncnu.edu.tw/API/get.aspx?json=contact_ncnu',
        'course_ncnu': 'https://api.ncnu.edu.tw/API/get.aspx?json=course_ncnu&year=113&semester=2&unitId=all',
        'course_require_ncnu': 'https://api.ncnu.edu.tw/API/get.aspx?json=course_require&year=113&deptId=12&class=B',
        'course_deptId': 'https://api.ncnu.edu.tw/API/get.aspx?json=course_deptId'
    }

    # 本地備份檔案路徑
    local_data_path = Path(__file__).parent.parent / 'data'

    for key, url in API_URLS.items():
        try:
            # 優先從網路抓取
            response = requests.get(url, timeout=10) # 設定10秒超時
            response.raise_for_status() # 如果狀態碼不是 200，會拋出錯誤
            content = response.json()
            data_key = list(content.keys())[0]
            DATA[key] = content[data_key]['item']
            print(f"Successfully fetched '{key}' from network.")
        except Exception as e:
            # 如果網路抓取失敗，則嘗試讀取本地備份檔案
            print(f"Failed to fetch '{key}' from network: {e}. Falling back to local file.")
            try:
                filename = url.split('=')[-1] + 'API.json' # 簡易檔名推斷
                if 'course_require' in url:
                     filename = '本學年某系所必修課資訊API(以國企系大學班為範例).json'
                elif 'course_ncnu' in url:
                    filename = '本學期開課資訊API.json'
                elif 'contact_ncnu' in url:
                    filename = '校園聯絡資訊API.json'
                elif 'unitId_ncnu' in url:
                    filename = '行政教學單位代碼API.json'
                elif 'course_deptId' in url:
                    filename = '開課單位代碼API.json'

                with open(local_data_path / filename, 'r', encoding='utf-8') as f:
                    content = json.load(f)
                    data_key = list(content.keys())[0]
                    DATA[key] = content[data_key]['item']
                print(f"Successfully loaded '{key}' from local backup.")
            except Exception as backup_e:
                print(f"Failed to load local backup for '{key}': {backup_e}")
                DATA[key] = [] # 最壞情況下，給一個空列表

    # ... (行事曆的抓取邏輯與之前相同，本身就是自動化的) ...
    # ... (所有 API 端點 @app.route 的程式碼也與之前完全相同) ...

# --- 所有 API 端點 (與之前版本完全相同) ---
@app.route("/")
def index():
    return "NCNU Super Assistant Backend is alive and well! (Auto-updating)"

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
    # 這部分需要重新抓取，所以我們把它也放進 load_all_data
    # 這裡直接回傳快取的資料
    return jsonify(CALENDAR_EVENTS)

@app.route('/api/required_courses')
def get_required_courses():
    # 注意：這個API目前仍然是寫死的，因為學校API需要系所代碼
    # 如果要完全自動化，需要前端傳遞系所代碼給後端，後端再動態組合URL去抓取
    return jsonify(DATA.get('course_require_ncnu', []))


# 在 Flask 應用程式啟動時，預先載入所有資料
with app.app_context():
    load_all_data()