# backend/app.py (最終穩定版 - 延遲初始化)

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
    """在應用程式上下文中，初始化所有服務和快取資料"""
    global supabase, STATIC_DATA, CALENDAR_EVENTS
    
    if supabase is None:
        print("Initializing Supabase client and loading static data...")
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")
        
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables.")
        
        supabase = create_client(url, key)
        print("Supabase client initialized.")
        load_static_data()
        print("Static data loaded.")

def load_static_data():
    """抓取不常變動的資料並存入快取"""
    global STATIC_DATA, CALENDAR_EVENTS
    if STATIC_DATA: return
    
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
    except Exception as e:
        print(f"Warning: Failed to fetch calendar. Error: {e}")

# --- API 端點 ---
@app.route("/")
def index():
    return "NCNU Super Assistant Backend is alive! (v4 - Final)"

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
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route("/api/schedule", methods=['GET', 'POST'])
def handle_schedule():
    user_id = request.args.get('user_id')
    if not user_id: return jsonify({"error": "User ID is required"}), 400
    if request.method == 'POST':
        try:
            response = supabase.table('schedules').upsert({'user_id': user_id, 'schedule_data': request.json}, on_conflict='user_id').execute()
            return jsonify({"success": True, "data": response.data[0]})
        except Exception as e: return jsonify({"error": str(e)}), 500
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
    return jsonify(STATIC_DATA.get('course_deptId', []))

@app.route('/api/contacts')
def get_contacts():
    contacts = STATIC_DATA.get('contact_ncnu', [])
    unit_info = STATIC_DATA.get('unitId_ncnu', [])
    if contacts and unit_info:
        for contact in contacts:
            matching_unit = next((unit for unit in unit_info if unit['中文名稱'] == contact['title']), None)
            if matching_unit: contact['web'] = matching_unit.get('網站網址', contact.get('web'))
    return jsonify(contacts)

@app.route('/api/calendar')
def get_calendar():
    return jsonify(CALENDAR_EVENTS)

# --- 應用程式啟動 ---
with app.app_context():
    initialize_app()