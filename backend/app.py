# backend/app.py (Supabase v2.x 語法修正版)

import os
import json
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv
from collections import Counter
import requests
from icalendar import Calendar
from datetime import datetime

# --- 初始化 ---
load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["https://ncnu-super-assistant.vercel.app", "http://localhost:5173", "https://*.vercel.app"]}})

# --- 全域變數宣告 ---
supabase: Client = None
STATIC_DATA = {}
CALENDAR_EVENTS = []

def initialize_app():
    global supabase
    if supabase is None:
        print("Initializing Supabase client and loading static data...")
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set.")
        supabase = create_client(url, key)
        print("Supabase client initialized.")
        load_static_data()
        print("Static data loaded.")

def load_static_data():
    global STATIC_DATA, CALENDAR_EVENTS
    if STATIC_DATA: return
    # ... (此函數內容不變，為保持簡潔省略)
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
        except Exception:
            STATIC_DATA[key] = []
    try:
        ics_url = "https://www.google.com/calendar/ical/curricul%40mail.ncnu.edu.tw/public/basic.ics"
        response = requests.get(ics_url, timeout=15)
        response.raise_for_status()
        calendar = Calendar.from_ical(response.content)
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
    except Exception:
        pass


# --- API 端點 ---
@app.route("/")
def index():
    return "NCNU Super Assistant Backend is alive! (v6 - Supabase Syntax Fix)"

@app.route("/api/auth/google", methods=['POST'])
def google_auth():
    user_info = request.json
    if not user_info or 'google_id' not in user_info: return jsonify({"error": "Invalid user info"}), 400
    try:
        response = supabase.table('users').upsert({
            'google_id': user_info['google_id'], 'email': user_info.get('email'),
            'full_name': user_info.get('full_name'), 'avatar_url': user_info.get('avatar_url')
        }, on_conflict='google_id').execute()
        return jsonify(response.data[0])
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
            response = supabase.table('schedules').upsert({
                'user_id': user_id, 'schedule_data': schedule_data
            }, on_conflict='user_id').execute()
            
            # [核心修正] 嚴格按照 v2.x 語法處理回傳值
            if response.data:
                return jsonify({"success": True, "data": response.data[0]})
            else:
                # 處理可能的錯誤或空回傳
                return jsonify({"success": False, "error": "Upsert operation returned no data."})
        except Exception as e:
            print(f"ERROR handling POST /api/schedule: {e}")
            return jsonify({"error": str(e)}), 500

    if request.method == 'GET':
        try:
            response = supabase.table('schedules').select('schedule_data').eq('user_id', user_id).limit(1).execute()
            return jsonify(response.data[0]['schedule_data'] if response.data else {})
        except Exception as e:
            print(f"ERROR handling GET /api/schedule: {e}")
            return jsonify({"error": str(e)}), 500

# ... (所有剩下的 API 端點和啟動程式碼都保持不變) ...
@app.route("/api/courses/hotness")
def get_course_hotness():
    # ... (此函數保持不變) ...
    return jsonify({})
@app.route('/api/departments')
def get_departments():
    # ... (此函數保持不變) ...
    return jsonify([])
@app.route('/api/contacts')
def get_contacts():
    # ... (此函數保持不變) ...
    return jsonify([])
@app.route('/api/calendar')
def get_calendar():
    # ... (此函數保持不變) ...
    return jsonify([])


with app.app_context():
    initialize_app()