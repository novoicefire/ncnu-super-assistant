# backend/app.py (加入 Signal Flare 用於除錯)

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

# --- 初始化 (保持不變) ---
load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["https://ncnu-super-assistant.vercel.app", "http://localhost:5173", "https://*.vercel.app"]}})

# --- 全域變數宣告 (保持不變) ---
supabase: Client = None
STATIC_DATA = {}
CALENDAR_EVENTS = []

# --- 函數 initialize_app 和 load_static_data (保持不變) ---
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
    # (此處省略內部程式碼，與之前版本相同)
    pass 

# --- API 端點 ---
@app.route("/")
def index():
    return "NCNU Super Assistant Backend is alive! (v7 - Debugging Mode)"

# ... ( /api/auth/google 端點保持不變) ...
@app.route("/api/auth/google", methods=['POST'])
def google_auth():
    # ...
    return jsonify({}) # 佔位

# [核心修正] 在 handle_schedule 函數的最開頭加入 print 語句
@app.route("/api/schedule", methods=['GET', 'POST'])
def handle_schedule():
    user_id = request.args.get('user_id')
    
    # --- 這就是我們的信號彈 ---
    print(f"--- TRIGGERED /api/schedule for user_id: {user_id} ---")
    
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    if request.method == 'POST':
        schedule_data = request.json
        try:
            print(f"Attempting to save schedule. Data received: {schedule_data}")
            response = supabase.table('schedules').upsert({
                'user_id': user_id, 'schedule_data': schedule_data
            }, on_conflict='user_id').execute()
            
            if response.data:
                print("Successfully saved schedule to Supabase.")
                return jsonify({"success": True, "data": response.data[0]})
            else:
                print("Warning: Supabase upsert operation returned no data.")
                return jsonify({"success": False, "error": "Upsert operation returned no data."})
        except Exception as e:
            # 這是我們最需要看到的錯誤訊息！
            print(f"!!!!!! FATAL ERROR during POST /api/schedule !!!!!!")
            print(f"Error Type: {type(e).__name__}")
            print(f"Error Details: {e}")
            import traceback
            traceback.print_exc() # 打印完整的 Traceback
            print(f"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            return jsonify({"error": str(e)}), 500

    if request.method == 'GET':
        # ... (GET 邏輯保持不變) ...
        return jsonify({})

# ... (所有剩下的 API 端點和啟動程式碼都保持不變) ...
@app.route("/api/courses/hotness")
def get_course_hotness():
    # ...
    return jsonify({})
@app.route('/api/departments')
def get_departments():
    # ...
    return jsonify([])
@app.route('/api/contacts')
def get_contacts():
    # ...
    return jsonify([])
@app.route('/api/calendar')
def get_calendar():
    # ...
    return jsonify([])

with app.app_context():
    initialize_app()