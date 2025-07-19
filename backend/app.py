import os
import json
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv
from collections import Counter
import requests
import icalendar
from datetime import datetime
import threading

# --- 初始化 ---
load_dotenv()
app = Flask(__name__)

# --- 安全設定 ---
ALLOWED_ORIGINS = [
    "https://ncnu-super-assistant.vercel.app",
    "https://ncnu-super-assistant-git-develop-yoialexs-projects.vercel.app",
    "http://localhost:5173"
]
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})

# --- 全域變數宣告 ---
supabase: Client = None
STATIC_DATA = {}
CALENDAR_EVENTS = []
data_loaded = threading.Event()

def initialize_app():
    global supabase
    if supabase is None:
        print("Initializing Supabase client...")
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")
        if not url or not key:
            raise ValueError("FATAL: SUPABASE_URL and SUPABASE_KEY must be set in environment variables.")
        supabase = create_client(url, key)
        print("Supabase client initialized.")

def load_static_data_if_needed():
    if not data_loaded.is_set():
        print("Static data not loaded yet. Loading now...")
        global STATIC_DATA, CALENDAR_EVENTS
        api_urls = {
            'unitId_ncnu': 'https://api.ncnu.edu.tw/API/get.aspx?json=unitId_ncnu',
            'contact_ncnu': 'https://api.ncnu.edu.tw/API/get.aspx?json=contact_ncnu',
            'course_deptId': 'https://api.ncnu.edu.tw/API/get.aspx?json=course_deptId'
        }
        for key, data_url in api_urls.items():
            try:
                response = requests.get(data_url, timeout=15)
                response.raise_for_status()
                content = response.json()
                data_key = list(content.keys())[0]
                STATIC_DATA[key] = content[data_key].get('item', [])
            except Exception as e:
                print(f"Warning: Failed to fetch static data for '{key}'. Error: {e}")
                STATIC_DATA[key] = []
        try:
            ics_url = "https://www.google.com/calendar/ical/curricul%40mail.ncnu.edu.tw/public/basic.ics"
            response = requests.get(ics_url, timeout=15)
            response.raise_for_status()
            calendar = icalendar.Calendar.from_ical(response.content)
            temp_events = []
            for component in calendar.walk():
                if component.name == "VEVENT":
                    dtstart, dtend = component.get('dtstart'), component.get('dtend')
                    if dtstart and dtend:
                        temp_events.append({
                            "summary": str(component.get('summary')),
                            "start": dtstart.dt.isoformat() if hasattr(dtstart.dt, 'isoformat') else str(dtstart.dt),
                            "end": dtend.dt.isoformat() if hasattr(dtend.dt, 'isoformat') else str(dtend.dt)
                        })
            CALENDAR_EVENTS.extend(sorted(temp_events, key=lambda x: x['start']))
        except Exception as e:
            print(f"Warning: Failed to fetch calendar. Error: {e}")
        data_loaded.set()
        print("Static data loading finished.")

# --- API 端點 ---
@app.route("/")
def index():
    return "NCNU Super Assistant Backend is alive! (v14 - Raw Contacts)"

# --- 此處省略 auth, schedule, hotness, departments 等 API，它們保持不變 ---
@app.route("/api/auth/google", methods=['POST'])
def google_auth():
    user_info = request.json
    if not user_info or 'google_id' not in user_info: return jsonify({"error": "Invalid user info"}), 400
    try:
        supabase.table('users').upsert({
            'google_id': user_info['google_id'], 'email': user_info.get('email'),
            'full_name': user_info.get('full_name'), 'avatar_url': user_info.get('avatar_url')
        }, on_conflict='google_id').execute()
        return jsonify(user_info)
    except Exception as e:
        print(f"ERROR in google_auth: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/schedule", methods=['GET', 'POST'])
def handle_schedule():
    user_id = request.args.get('user_id')
    if not user_id: return jsonify({"error": "User ID is required"}), 400
    if request.method == 'POST':
        schedule_data = request.json
        try:
            response = supabase.table('schedules').select('id').eq('user_id', user_id).limit(1).execute()
            if response.data:
                update_response = supabase.table('schedules').update({'schedule_data': schedule_data}).eq('user_id', user_id).execute()
                return jsonify({"success": True, "action": "updated", "data": update_response.data[0]})
            else:
                insert_response = supabase.table('schedules').insert({'user_id': user_id, 'schedule_data': schedule_data}).execute()
                return jsonify({"success": True, "action": "inserted", "data": insert_response.data[0]})
        except Exception as e:
            print(f"!!!!!! FATAL ERROR during POST /api/schedule for user {user_id} !!!!!!")
            import traceback
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500
    if request.method == 'GET':
        try:
            response = supabase.table('schedules').select('schedule_data').eq('user_id', user_id).limit(1).execute()
            return jsonify(response.data[0]['schedule_data'] if response.data else {})
        except Exception as e: return jsonify({"error": str(e)}), 500

@app.route("/api/courses/hotness")
def get_course_hotness():
    try:
        response = supabase.table('schedules').select('schedule_data').execute()
        if not response.data: return jsonify({})
        all_schedules = [item['schedule_data'] for item in response.data if item.get('schedule_data')]
        course_counts = Counter()
        for schedule in all_schedules:
            unique_course_ids_in_schedule = {course['course_id'] for course in schedule.values()}
            course_counts.update(unique_course_ids_in_schedule)
        return jsonify(dict(course_counts))
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/api/departments')
def get_departments():
    load_static_data_if_needed()
    return jsonify(STATIC_DATA.get('course_deptId', []))

@app.route('/api/contacts')
def get_contacts():
    """
    修改點：這個 API 現在只做最基礎的清理，傳遞前端需要的原始欄位
    """
    load_static_data_if_needed()
    raw_contacts = STATIC_DATA.get('contact_ncnu', [])
    
    cleaned_contacts = []
    for raw_contact in raw_contacts:
        cleaned_contacts.append({
            "title": raw_contact.get("title", "無標題"),
            "phone1": raw_contact.get("phone1", ""),
            "phone2": raw_contact.get("phone2", ""),
            "fax": raw_contact.get("fax", ""),
            "email": raw_contact.get("email", "")
        })
        
    return jsonify(cleaned_contacts)

@app.route('/api/calendar')
def get_calendar():
    load_static_data_if_needed()
    return jsonify(CALENDAR_EVENTS)

# --- 應用程式啟動區塊 ---
with app.app_context():
    initialize_app()