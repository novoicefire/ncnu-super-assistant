"""
push_service.py - Web Push 推播服務
處理瀏覽器推播訂閱與發送
"""
import os
from flask import Blueprint, jsonify, request

push_bp = Blueprint('push', __name__)

# Supabase client 會從 app.py 注入
supabase = None

# VAPID 設定
VAPID_PUBLIC_KEY = None
VAPID_PRIVATE_KEY = None
VAPID_CLAIMS = None

def init_push_service(supabase_client):
    """初始化推播服務"""
    global supabase, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CLAIMS
    
    supabase = supabase_client
    VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY')
    VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY')
    VAPID_CLAIMS = {
        "sub": os.environ.get('VAPID_SUBJECT', 'mailto:admin@example.com')
    }
    
    if not VAPID_PUBLIC_KEY or not VAPID_PRIVATE_KEY:
        print("WARNING: VAPID keys not configured. Push notifications will not work.")


@push_bp.route('/api/push/vapid-public-key', methods=['GET'])
def get_vapid_public_key():
    """取得 VAPID 公鑰，前端訂閱時需要"""
    if not VAPID_PUBLIC_KEY:
        return jsonify({"error": "VAPID not configured"}), 500
    
    return jsonify({"publicKey": VAPID_PUBLIC_KEY})


@push_bp.route('/api/push/subscribe', methods=['POST'])
def subscribe():
    """
    訂閱推播通知
    Body:
        - user_id: 用戶 ID
        - subscription: PushSubscription 物件
    """
    data = request.json
    user_id = data.get('user_id')
    subscription = data.get('subscription')
    
    if not user_id or not subscription:
        return jsonify({"error": "user_id and subscription are required"}), 400
    
    try:
        # 儲存訂閱資訊
        sub_data = {
            'user_id': user_id,
            'endpoint': subscription['endpoint'],
            'keys': subscription['keys']
        }
        
        # 使用 upsert 避免重複訂閱
        response = supabase.table('push_subscriptions').upsert(
            sub_data, 
            on_conflict='endpoint'
        ).execute()
        
        return jsonify({"success": True, "data": response.data[0]})
    except Exception as e:
        print(f"ERROR in subscribe: {e}")
        return jsonify({"error": str(e)}), 500


@push_bp.route('/api/push/unsubscribe', methods=['POST'])
def unsubscribe():
    """
    取消訂閱推播
    Body:
        - endpoint: 訂閱端點
    """
    data = request.json
    endpoint = data.get('endpoint')
    
    if not endpoint:
        return jsonify({"error": "endpoint is required"}), 400
    
    try:
        response = supabase.table('push_subscriptions').delete().eq(
            'endpoint', endpoint
        ).execute()
        
        return jsonify({"success": True})
    except Exception as e:
        print(f"ERROR in unsubscribe: {e}")
        return jsonify({"error": str(e)}), 500


@push_bp.route('/api/push/send', methods=['POST'])
def send_push_notification():
    """
    發送推播通知
    Body:
        - user_id: 用戶 ID (選填，NULL 發送給所有人)
        - title: 標題
        - message: 內容
        - link: 點擊連結 (選填)
    """
    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        return jsonify({"error": "pywebpush not installed"}), 500
    
    if not VAPID_PRIVATE_KEY:
        return jsonify({"error": "VAPID not configured"}), 500
    
    data = request.json
    user_id = data.get('user_id')
    title = data.get('title')
    message = data.get('message')
    link = data.get('link', '/')
    
    if not title or not message:
        return jsonify({"error": "title and message are required"}), 400
    
    try:
        # 取得訂閱列表
        if user_id:
            response = supabase.table('push_subscriptions').select('*').eq(
                'user_id', user_id
            ).execute()
        else:
            response = supabase.table('push_subscriptions').select('*').execute()
        
        subscriptions = response.data
        sent_count = 0
        failed_count = 0
        
        # 發送推播
        import json
        payload = json.dumps({
            "title": title,
            "body": message,
            "icon": "/logo.svg",
            "badge": "/logo.svg",
            "data": {"url": link}
        })
        
        for sub in subscriptions:
            try:
                # 對每個訂閱發送推播，使用完整 VAPID 參數
                webpush(
                    subscription_info={
                        "endpoint": sub['endpoint'],
                        "keys": sub['keys']
                    },
                    data=payload,
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims={
                        "sub": VAPID_CLAIMS["sub"],
                        "aud": sub['endpoint'].split('/')[0] + '//' + sub['endpoint'].split('/')[2]  # 動態設定 audience
                    }
                )
                sent_count += 1
            except WebPushException as e:
                print(f"Push failed for {sub['endpoint']}: {e}")
                failed_count += 1
                # 如果訂閱過期，刪除它
                if e.response and e.response.status_code in [404, 410]:
                    supabase.table('push_subscriptions').delete().eq(
                        'endpoint', sub['endpoint']
                    ).execute()
        
        return jsonify({
            "success": True,
            "sent_count": sent_count,
            "failed_count": failed_count
        })
    except Exception as e:
        print(f"ERROR in send_push_notification: {e}")
        return jsonify({"error": str(e)}), 500
