#!/usr/bin/env python3
"""
scripts/cleanup_push_subscriptions.py
清理失效的推播訂閱

用途：
  - 發送測試推播給所有訂閱者
  - 自動刪除回應 404/410 的失效訂閱
  
使用方式：
  python scripts/cleanup_push_subscriptions.py
  
環境變數需求（從 backend/.env 讀取）：
  - SUPABASE_URL
  - SUPABASE_KEY
  - VAPID_PUBLIC_KEY
  - VAPID_PRIVATE_KEY
  - VAPID_SUBJECT
"""

import os
import sys
from pathlib import Path

# 載入環境變數
from dotenv import load_dotenv
backend_env = Path(__file__).parent.parent / "backend" / ".env"
load_dotenv(backend_env)

# 驗證必要環境變數
required_vars = ['SUPABASE_URL', 'SUPABASE_KEY', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT']
missing = [v for v in required_vars if not os.environ.get(v)]
if missing:
    print(f"❌ 缺少環境變數: {', '.join(missing)}")
    print(f"   請確認 {backend_env} 存在且包含這些變數")
    sys.exit(1)

from supabase import create_client
from pywebpush import webpush, WebPushException
import json

# 初始化 Supabase
supabase = create_client(
    os.environ['SUPABASE_URL'],
    os.environ['SUPABASE_KEY']
)

# VAPID 設定
VAPID_PRIVATE_KEY = os.environ['VAPID_PRIVATE_KEY']
VAPID_SUBJECT = os.environ['VAPID_SUBJECT']


def cleanup_subscriptions(dry_run=False):
    """
    清理失效的推播訂閱
    
    Args:
        dry_run: 如果為 True，只顯示會刪除的訂閱但不實際刪除
    """
    print("🔍 正在取得所有推播訂閱...")
    
    # 取得所有訂閱
    response = supabase.table('push_subscriptions').select('*').execute()
    subscriptions = response.data
    
    print(f"📊 共有 {len(subscriptions)} 個訂閱")
    
    if not subscriptions:
        print("✅ 沒有需要清理的訂閱")
        return
    
    # 測試推播 payload（靜音通知）
    test_payload = json.dumps({
        "title": "系統測試",
        "body": "這是一則測試訊息，用於驗證訂閱狀態。",
        "silent": True,  # 靜音
        "data": {"type": "test"}
    })
    
    valid_count = 0
    invalid_count = 0
    invalid_endpoints = []
    
    print("\n🔄 開始測試訂閱有效性...")
    
    for i, sub in enumerate(subscriptions, 1):
        endpoint = sub['endpoint']
        short_endpoint = endpoint[:50] + "..." if len(endpoint) > 50 else endpoint
        
        try:
            # 發送測試推播
            webpush(
                subscription_info={
                    "endpoint": endpoint,
                    "keys": sub['keys']
                },
                data=test_payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={
                    "sub": VAPID_SUBJECT,
                    "aud": endpoint.split('/')[0] + '//' + endpoint.split('/')[2]
                }
            )
            valid_count += 1
            print(f"  [{i}/{len(subscriptions)}] ✅ 有效: {short_endpoint}")
            
        except WebPushException as e:
            if e.response and e.response.status_code in [404, 410]:
                invalid_count += 1
                invalid_endpoints.append(endpoint)
                print(f"  [{i}/{len(subscriptions)}] ❌ 失效 ({e.response.status_code}): {short_endpoint}")
            else:
                print(f"  [{i}/{len(subscriptions)}] ⚠️ 其他錯誤 ({e.response.status_code if e.response else 'N/A'}): {short_endpoint}")
        except Exception as e:
            print(f"  [{i}/{len(subscriptions)}] ⚠️ 錯誤: {str(e)[:50]}")
    
    print(f"\n📊 統計結果:")
    print(f"   ✅ 有效訂閱: {valid_count}")
    print(f"   ❌ 失效訂閱: {invalid_count}")
    
    # 刪除失效訂閱
    if invalid_endpoints:
        if dry_run:
            print(f"\n🔍 Dry Run 模式：以下 {len(invalid_endpoints)} 個訂閱將被刪除（但未實際執行）")
            for ep in invalid_endpoints:
                print(f"   - {ep[:60]}...")
        else:
            print(f"\n🗑️ 正在刪除 {len(invalid_endpoints)} 個失效訂閱...")
            for endpoint in invalid_endpoints:
                try:
                    supabase.table('push_subscriptions').delete().eq('endpoint', endpoint).execute()
                    print(f"   ✅ 已刪除: {endpoint[:50]}...")
                except Exception as e:
                    print(f"   ❌ 刪除失敗: {str(e)}")
            print(f"\n✅ 清理完成！")
    else:
        print("\n✅ 沒有需要清理的失效訂閱")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='清理失效的推播訂閱')
    parser.add_argument('--dry-run', action='store_true', help='只顯示會刪除的訂閱，不實際執行')
    args = parser.parse_args()
    
    print("=" * 50)
    print("🔔 推播訂閱清理工具")
    print("=" * 50)
    
    cleanup_subscriptions(dry_run=args.dry_run)
