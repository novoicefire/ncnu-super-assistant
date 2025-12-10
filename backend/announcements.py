"""
announcements.py - 公告系統 API 端點
提供公告的 CRUD 操作，使用 Flask Blueprint
與 AnnouncementCard.jsx 和 AnnouncementButton.jsx 完全相容
"""
from flask import Blueprint, jsonify, request
from datetime import date

announcements_bp = Blueprint('announcements', __name__)

# Supabase client 會從 app.py 注入
supabase = None

def init_announcements(supabase_client):
    """初始化 Supabase client"""
    global supabase
    supabase = supabase_client


@announcements_bp.route('/api/announcements', methods=['GET'])
def get_announcements():
    """
    取得所有啟用的公告（前台使用）
    回傳格式與 announcementData.js 相容
    """
    try:
        response = supabase.table('announcements').select('*').eq(
            'is_active', True
        ).order('date', desc=True).execute()
        
        # 轉換為前端相容格式
        announcements = []
        for item in response.data:
            announcements.append({
                'id': item['id'],
                'title': item['title'],
                'date': item['date'],
                'priority': item['priority'],
                'content': item['content'],
                'images': item['images'] or [],
                'embeds': item['embeds'] or [],
                'buttons': item['buttons'] or []
            })
        
        return jsonify(announcements)
    except Exception as e:
        print(f"ERROR in get_announcements: {e}")
        return jsonify({"error": str(e)}), 500


@announcements_bp.route('/api/announcements/admin', methods=['GET'])
def get_all_announcements_admin():
    """
    取得所有公告（管理員使用）
    包含 is_active 狀態
    """
    try:
        response = supabase.table('announcements').select('*').order(
            'created_at', desc=True
        ).execute()
        
        return jsonify(response.data)
    except Exception as e:
        print(f"ERROR in get_all_announcements_admin: {e}")
        return jsonify({"error": str(e)}), 500


@announcements_bp.route('/api/announcements', methods=['POST'])
def create_announcement():
    """
    新增公告（管理員使用）
    Body:
        - title: 標題 (必填)
        - priority: high/normal/low (選填，預設 normal)
        - content: 內容 (選填)
        - images: 圖片陣列 (選填)
        - embeds: 嵌入內容陣列 (選填)
        - buttons: 按鈕陣列 (選填)
        - is_active: 是否啟用 (選填，預設 true)
    """
    data = request.json
    
    if not data or not data.get('title'):
        return jsonify({"error": "title is required"}), 400
    
    try:
        announcement = {
            'title': data['title'],
            'date': data.get('date', date.today().isoformat()),
            'priority': data.get('priority', 'normal'),
            'content': data.get('content', ''),
            'images': data.get('images', []),
            'embeds': data.get('embeds', []),
            'buttons': data.get('buttons', []),
            'is_active': data.get('is_active', True)
        }
        
        response = supabase.table('announcements').insert(announcement).execute()
        return jsonify({"success": True, "data": response.data[0]}), 201
    except Exception as e:
        print(f"ERROR in create_announcement: {e}")
        return jsonify({"error": str(e)}), 500


@announcements_bp.route('/api/announcements/<int:announcement_id>', methods=['PUT'])
def update_announcement(announcement_id):
    """
    更新公告（管理員使用）
    """
    data = request.json
    
    if not data:
        return jsonify({"error": "Request body is required"}), 400
    
    try:
        # 建立更新資料，只更新有提供的欄位
        update_data = {}
        allowed_fields = ['title', 'date', 'priority', 'content', 'images', 'embeds', 'buttons', 'is_active']
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        if not update_data:
            return jsonify({"error": "No valid fields to update"}), 400
        
        response = supabase.table('announcements').update(update_data).eq(
            'id', announcement_id
        ).execute()
        
        if not response.data:
            return jsonify({"error": "Announcement not found"}), 404
        
        return jsonify({"success": True, "data": response.data[0]})
    except Exception as e:
        print(f"ERROR in update_announcement: {e}")
        return jsonify({"error": str(e)}), 500


@announcements_bp.route('/api/announcements/<int:announcement_id>', methods=['DELETE'])
def delete_announcement(announcement_id):
    """刪除公告（管理員使用）"""
    try:
        response = supabase.table('announcements').delete().eq(
            'id', announcement_id
        ).execute()
        
        if not response.data:
            return jsonify({"error": "Announcement not found"}), 404
        
        return jsonify({"success": True})
    except Exception as e:
        print(f"ERROR in delete_announcement: {e}")
        return jsonify({"error": str(e)}), 500


@announcements_bp.route('/api/announcements/<int:announcement_id>/toggle', methods=['PUT'])
def toggle_announcement(announcement_id):
    """切換公告啟用狀態（管理員使用）"""
    try:
        # 先取得目前狀態
        get_response = supabase.table('announcements').select('is_active').eq(
            'id', announcement_id
        ).execute()
        
        if not get_response.data:
            return jsonify({"error": "Announcement not found"}), 404
        
        current_status = get_response.data[0]['is_active']
        new_status = not current_status
        
        # 更新狀態
        update_response = supabase.table('announcements').update({
            'is_active': new_status
        }).eq('id', announcement_id).execute()
        
        return jsonify({
            "success": True, 
            "data": update_response.data[0],
            "is_active": new_status
        })
    except Exception as e:
        print(f"ERROR in toggle_announcement: {e}")
        return jsonify({"error": str(e)}), 500
