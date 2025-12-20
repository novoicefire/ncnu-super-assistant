import os
import json
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv
from collections import Counter
import requests

from datetime import datetime
import threading

# --- 初始化 ---
load_dotenv()
app = Flask(__name__)

# 匯入通知與推播模組
from notifications import notifications_bp, init_notifications
from push_service import push_bp, init_push_service
from announcements import announcements_bp, init_announcements

# 註冊 Blueprint
app.register_blueprint(notifications_bp)
app.register_blueprint(push_bp)
app.register_blueprint(announcements_bp)


# --- 安全設定 START ---
# 明確列出所有允許的前端來源網址
ALLOWED_ORIGINS = [
    "https://ncnu-super-assistant.vercel.app",  # 您的正式版網站
    "https://ncnu-super-assistant-git-develop-yoialexs-projects.vercel.app", # 您的測試版網站
    "http://localhost:5173",  # 本地開發環境
    "http://localhost:3000",   # 本地開發環境
    "http://10.74.21.185:3000" # 本地開發環境
]
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})
# --- 安全設定 END ---


# --- 全域變數宣告 ---
supabase: Client = None


def initialize_app():
    """在應用程式上下文中，初始化所有服務"""
    global supabase
    if supabase is None:
        print("Initializing Supabase client...")
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")
        if not url or not key:
            raise ValueError("FATAL: SUPABASE_URL and SUPABASE_KEY must be set in environment variables.")
        supabase = create_client(url, key)
        print("Supabase client initialized.")
        
        # 初始化通知與推播服務
        init_notifications(supabase)
        init_push_service(supabase)
        init_announcements(supabase)
        print("Notification, Push, and Announcements services initialized.")



# --- API 端點 ---
@app.route("/")
def index():
    return "NCNU Super Assistant Backend is alive! (v13 - Flexible Courses Support)"

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

# 🔄 修改：支援 flexible_courses 欄位
@app.route("/api/schedule", methods=['GET', 'POST'])
def handle_schedule():
    user_id = request.args.get('user_id')
    if not user_id: 
        return jsonify({"error": "User ID is required"}), 400
    
    if request.method == 'POST':
        # 🆕 接收兩種資料：schedule_data 和 flexible_courses
        data = request.json
        
        # 兼容舊版前端（直接傳 schedule_data 物件）
        if isinstance(data, dict) and 'schedule_data' not in data and 'flexible_courses' not in data:
            # 舊版格式：直接傳課表物件
            schedule_data = data
            flexible_courses = []
        else:
            # 新版格式：包含 schedule_data 和 flexible_courses
            schedule_data = data.get('schedule_data', {})
            flexible_courses = data.get('flexible_courses', [])
        
        try:
            response = supabase.table('schedules').select('id').eq('user_id', user_id).limit(1).execute()
            if response.data:
                # 更新現有記錄
                update_response = supabase.table('schedules').update({
                    'schedule_data': schedule_data,
                    'flexible_courses': flexible_courses  # 🆕 同時更新彈性課程
                }).eq('user_id', user_id).execute()
                return jsonify({"success": True, "action": "updated", "data": update_response.data[0]})
            else:
                # 新增記錄
                insert_response = supabase.table('schedules').insert({
                    'user_id': user_id,
                    'schedule_data': schedule_data,
                    'flexible_courses': flexible_courses  # 🆕 同時插入彈性課程
                }).execute()
                return jsonify({"success": True, "action": "inserted", "data": insert_response.data[0]})
        except Exception as e:
            print(f"!!!!!! FATAL ERROR during POST /api/schedule for user {user_id} !!!!!!")
            import traceback
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500
    
    if request.method == 'GET':
        try:
            # 🆕 同時查詢 schedule_data 和 flexible_courses
            response = supabase.table('schedules').select('schedule_data, flexible_courses').eq('user_id', user_id).limit(1).execute()
            
            if response.data:
                return jsonify({
                    'schedule_data': response.data[0].get('schedule_data', {}),
                    'flexible_courses': response.data[0].get('flexible_courses', [])  # 🆕 回傳彈性課程
                })
            else:
                # 無資料時回傳預設值
                return jsonify({
                    'schedule_data': {},
                    'flexible_courses': []
                })
        except Exception as e: 
            return jsonify({"error": str(e)}), 500

@app.route("/api/courses/hotness")
def get_course_hotness():
    try:
        response = supabase.table('schedules').select('schedule_data, flexible_courses').execute()  # 🆕 也查詢 flexible_courses
        if not response.data:
            return jsonify({})

        course_counts = Counter()
        
        # 計算固定時間課程熱度
        all_schedules = [item['schedule_data'] for item in response.data if item and item.get('schedule_data')]
        for schedule in all_schedules:
            if isinstance(schedule, dict) and schedule:
                unique_course_ids_in_schedule = {
                    course['course_id'] 
                    for course in schedule.values() 
                    if isinstance(course, dict) and 'course_id' in course
                }
                course_counts.update(unique_course_ids_in_schedule)
        
        # 🆕 計算彈性課程熱度
        all_flexible = [item['flexible_courses'] for item in response.data if item and item.get('flexible_courses')]
        for flexible_list in all_flexible:
            if isinstance(flexible_list, list):
                unique_flexible_ids = {
                    course['course_id']
                    for course in flexible_list
                    if isinstance(course, dict) and 'course_id' in course
                }
                course_counts.update(unique_flexible_ids)
                
        return jsonify(dict(course_counts))
    except Exception as e:
        print(f"ERROR in get_course_hotness: {e}")
        return jsonify({"error": "An error occurred while calculating course hotness."}), 500







@app.route('/api/dorm-mail', methods=['GET'])
def get_dorm_mail():
    """
    查詢宿舍包裹資訊
    
    Query Parameters:
        - department: 系所名稱（選填），例如：應化系
        - name: 收件人姓名格式（選填），例如：武Ｏ星
        - 若兩者都未提供，則返回所有包裹資料
    
    Returns:
        JSON: {
            "success": true/false,
            "data": [...],  # 包裹資料列表
            "count": 數量,
            "error": "錯誤訊息"  # 僅在失敗時
        }
    """
    from dorm_mail import fetch_dorm_mail_data, filter_by_department, filter_by_name
    
    try:
        # 取得查詢參數
        department = request.args.get('department', '').strip()
        name = request.args.get('name', '').strip()
        
        # 爬取包裹資料
        mail_list = fetch_dorm_mail_data()
        
        if mail_list is None:
            return jsonify({
                "success": False,
                "error": "無法連接到學校宿舍包裹系統，請稍後再試",
                "data": [],
                "count": 0
            }), 503
        
        # 根據參數篩選資料
        if department:
            mail_list = filter_by_department(mail_list, department)
        
        if name:
            mail_list = filter_by_name(mail_list, name)
        
        return jsonify({
            "success": True,
            "data": mail_list,
            "count": len(mail_list)
        })
        
    except Exception as e:
        print(f"ERROR in get_dorm_mail: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": "查詢包裹時發生錯誤",
            "data": [],
            "count": 0
        }), 500

# --- 應用程式啟動區塊 ---
with app.app_context():
    initialize_app()



# --- Flask 應用程式啟動 ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
