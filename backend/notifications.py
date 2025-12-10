"""
notifications.py - 通知系統 API 端點
提供通知的 CRUD 操作，使用 Flask Blueprint
"""
from flask import Blueprint, jsonify, request

notifications_bp = Blueprint('notifications', __name__)

# Supabase client 會從 app.py 注入
supabase = None

def init_notifications(supabase_client):
    """初始化 Supabase client"""
    global supabase
    supabase = supabase_client


@notifications_bp.route('/api/notifications', methods=['GET'])
def get_notifications():
    """
    取得用戶通知列表（支援多使用者已讀追蹤）
    Query params:
        - user_id: 用戶 ID (必填)
        - unread_only: 只取得未讀通知 (選填)
    """
    user_id = request.args.get('user_id')
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    try:
        # 查詢該用戶的通知 + 全站通知 (user_id = NULL)
        # 使用 RPC 或手動處理 LEFT JOIN
        response = supabase.table('notifications').select('*').or_(
            f'user_id.eq.{user_id},user_id.is.null'
        ).order('created_at', desc=True).limit(50).execute()
        
        notifications = response.data
        
        # 查詢該使用者的已讀紀錄
        notification_ids = [n['id'] for n in notifications]
        if notification_ids:
            reads_response = supabase.table('notification_reads').select('notification_id').eq(
                'user_id', user_id
            ).in_('notification_id', notification_ids).execute()
            
            read_ids = {r['notification_id'] for r in reads_response.data}
        else:
            read_ids = set()
        
        # 為每個通知加上 read 狀態
        for notification in notifications:
            notification['read'] = notification['id'] in read_ids
        
        # 如果只要未讀通知
        if unread_only:
            notifications = [n for n in notifications if not n['read']]
        
        return jsonify(notifications)
    except Exception as e:
        print(f"ERROR in get_notifications: {e}")
        return jsonify({"error": str(e)}), 500


@notifications_bp.route('/api/notifications', methods=['POST'])
def create_notification():
    """
    新增通知（管理員使用）
    Body:
        - type: info/success/warning/error
        - title: 標題
        - message: 內容
        - user_id: 用戶 ID (選填，NULL 為全站通知)
        - link: 點擊連結 (選填)
    """
    data = request.json
    
    if not data or not data.get('title') or not data.get('message'):
        return jsonify({"error": "title and message are required"}), 400
    
    try:
        notification = {
            'type': data.get('type', 'info'),
            'title': data['title'],
            'message': data['message'],
            'user_id': data.get('user_id'),  # None 表示全站通知
            'link': data.get('link')
            # 注意：已移除 'read' 欄位，改用 notification_reads 表追蹤
        }
        
        response = supabase.table('notifications').insert(notification).execute()
        return jsonify({"success": True, "data": response.data[0]}), 201
    except Exception as e:
        print(f"ERROR in create_notification: {e}")
        return jsonify({"error": str(e)}), 500


@notifications_bp.route('/api/notifications/<notification_id>/read', methods=['PUT'])
def mark_as_read(notification_id):
    """標記單一通知為已讀（在 notification_reads 表中插入記錄）"""
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    try:
        # 使用 upsert 避免重複插入
        response = supabase.table('notification_reads').upsert({
            'notification_id': notification_id,
            'user_id': user_id
        }, on_conflict='notification_id,user_id').execute()
        
        return jsonify({"success": True, "data": response.data[0] if response.data else None})
    except Exception as e:
        print(f"ERROR in mark_as_read: {e}")
        return jsonify({"error": str(e)}), 500


@notifications_bp.route('/api/notifications/read-all', methods=['PUT'])
def mark_all_as_read():
    """標記所有通知為已讀（為每個未讀通知在 notification_reads 表中插入記錄）"""
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    try:
        # 1. 取得該使用者可見的所有通知
        notifications_response = supabase.table('notifications').select('id').or_(
            f'user_id.eq.{user_id},user_id.is.null'
        ).execute()
        
        notification_ids = [n['id'] for n in notifications_response.data]
        
        if not notification_ids:
            return jsonify({"success": True, "updated_count": 0})
        
        # 2. 查詢已讀的通知
        reads_response = supabase.table('notification_reads').select('notification_id').eq(
            'user_id', user_id
        ).in_('notification_id', notification_ids).execute()
        
        read_ids = {r['notification_id'] for r in reads_response.data}
        
        # 3. 找出未讀的通知
        unread_ids = [nid for nid in notification_ids if nid not in read_ids]
        
        if not unread_ids:
            return jsonify({"success": True, "updated_count": 0})
        
        # 4. 批量插入已讀記錄
        read_records = [{'notification_id': nid, 'user_id': user_id} for nid in unread_ids]
        supabase.table('notification_reads').insert(read_records).execute()
        
        return jsonify({"success": True, "updated_count": len(unread_ids)})
    except Exception as e:
        print(f"ERROR in mark_all_as_read: {e}")
        return jsonify({"error": str(e)}), 500


@notifications_bp.route('/api/notifications/<notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
    """刪除通知（管理員使用）"""
    try:
        response = supabase.table('notifications').delete().eq('id', notification_id).execute()
        
        if not response.data:
            return jsonify({"error": "Notification not found"}), 404
        
        return jsonify({"success": True})
    except Exception as e:
        print(f"ERROR in delete_notification: {e}")
        return jsonify({"error": str(e)}), 500


@notifications_bp.route('/api/notifications/admin', methods=['GET'])
def get_all_notifications_admin():
    """
    取得所有通知（管理員使用）
    用於管理後台檢視已發送的通知
    """
    try:
        response = supabase.table('notifications').select('*').order(
            'created_at', desc=True
        ).limit(100).execute()
        
        return jsonify(response.data)
    except Exception as e:
        print(f"ERROR in get_all_notifications_admin: {e}")
        return jsonify({"error": str(e)}), 500
