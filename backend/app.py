# backend/app.py (最終極簡版)

import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv
from collections import Counter
# 不再需要 requests 和 icalendar，因為後端不再抓取外部資料

# --- 初始化 ---
load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["https://ncnu-super-assistant.vercel.app", "http://localhost:5173", "https://*.vercel.app"]}})

# --- Supabase 連線 ---
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# --- API 端點 ---
@app.route("/")
def index():
    return "NCNU Super Assistant Backend is alive! (User-Data Only)"

@app.route("/api/auth/google", methods=['POST'])
def google_auth():
    user_info = request.json
    if not user_info or 'google_id' not in user_info:
        return jsonify({"error": "Invalid user info"}), 400
    try:
        response = supabase.table('users').upsert({
            'google_id': user_info['google_id'], 'email': user_info.get('email'),
            'full_name': user_info.get('full_name'), 'avatar_url': user_info.get('avatar_url')
        }, on_conflict='google_id').execute()
        return jsonify(response.data[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/schedule", methods=['GET', 'POST'])
def handle_schedule():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    if request.method == 'POST':
        try:
            response = supabase.table('schedules').upsert({'user_id': user_id, 'schedule_data': request.json}, on_conflict='user_id').execute()
            return jsonify({"success": True, "data": response.data[0]})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    if request.method == 'GET':
        try:
            response = supabase.table('schedules').select('schedule_data').eq('user_id', user_id).limit(1).execute()
            return jsonify(response.data[0]['schedule_data'] if response.data else {})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route("/api/courses/hotness")
def get_course_hotness():
    try:
        response = supabase.table('schedules').select('schedule_data').execute()
        if not response.data:
            return jsonify({})
        
        all_schedules = [item['schedule_data'] for item in response.data if item.get('schedule_data')]
        
        course_counts = Counter()
        for schedule in all_schedules:
            unique_course_ids_in_schedule = {course['course_id'] for course in schedule.values()}
            course_counts.update(unique_course_ids_in_schedule)
            
        return jsonify(dict(course_counts))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- 不再需要 load_static_data 和 /api/departments, /api/contacts, /api/calendar 等端點 ---