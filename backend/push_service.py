"""
push_service.py - Web Push 推播服務
處理瀏覽器推播訂閱與發送
"""
import os
from functools import wraps
from flask import Blueprint, jsonify, request

push_bp = Blueprint('push', __name__)

# Supabase client 會從 app.py 注入
supabase = None

# VAPID 設定
VAPID_PUBLIC_KEY = None
VAPID_PRIVATE_KEY = None
VAPID_CLAIMS = None

# 管理員 Email 列表
ADMIN_EMAILS = []

# Google OAuth Client ID（用於驗證 Token）
GOOGLE_CLIENT_ID = None


def admin_required(f):
    """
    管理員權限驗證裝飾器
    驗證 Google ID Token 並檢查用戶 Email 是否在管理員列表中
    
    前端需在請求標頭中傳送：
    - Authorization: Bearer <Google ID Token>
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # 取得 Authorization 標頭
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Unauthorized: Missing or invalid Authorization header"}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests
            
            # 驗證 Google ID Token
            idinfo = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(), 
                GOOGLE_CLIENT_ID
            )
            
            # 取得用戶 Email
            user_email = idinfo.get('email', '').lower()
            
            # 檢查是否為管理員
            if user_email not in [e.lower() for e in ADMIN_EMAILS]:
                print(f"Access denied for email: {user_email}")
                return jsonify({"error": "Forbidden: Not an admin user"}), 403
            
            # 將用戶資訊傳遞給被裝飾的函數
            request.admin_email = user_email
            
        except ValueError as e:
            print(f"Token verification failed: {e}")
            return jsonify({"error": "Invalid token"}), 401
        except Exception as e:
            print(f"Auth error: {e}")
            return jsonify({"error": "Authentication failed"}), 401
        
        return f(*args, **kwargs)
    return decorated


def init_push_service(supabase_client):
    """初始化推播服務"""
    global supabase, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CLAIMS, ADMIN_EMAILS, GOOGLE_CLIENT_ID
    
    supabase = supabase_client
    VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY')
    VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY')
    VAPID_CLAIMS = {
        "sub": os.environ.get('VAPID_SUBJECT', 'mailto:admin@example.com')
    }
    
    # 讀取管理員 Email 列表（逗號分隔）
    admin_emails_str = os.environ.get('ADMIN_EMAILS', '')
    ADMIN_EMAILS = [e.strip() for e in admin_emails_str.split(',') if e.strip()]
    
    # 讀取 Google OAuth Client ID
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    
    if not VAPID_PUBLIC_KEY or not VAPID_PRIVATE_KEY:
        print("WARNING: VAPID keys not configured. Push notifications will not work.")
    
    if not ADMIN_EMAILS:
        print("WARNING: ADMIN_EMAILS not configured. Admin endpoints will reject all requests.")
    
    if not GOOGLE_CLIENT_ID:
        print("WARNING: GOOGLE_CLIENT_ID not configured. Admin auth will fail.")


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
@admin_required
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
