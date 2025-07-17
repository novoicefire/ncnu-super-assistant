import json
from . import _data_loader

def handler(event, context):
      params = event.get('queryStringParameters', {})
      deptId = params.get('deptId')
      class_type = params.get('class')

      if deptId == '12' and class_type == 'B':
          body = json.dumps(_data_loader.DATA.get('course_require_ncnu', []))
          status = 200
      else:
          body = json.dumps({"error": "目前範例資料庫僅支援國企系(deptId=12)學士班(class=B)的必修課程查詢。"})
          status = 404
      
      return {
          'statusCode': status,
          'headers': { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          'body': body
      }