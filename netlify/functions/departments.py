import json
from . import _data_loader

def handler(event, context):
      return {
          'statusCode': 200,
          'headers': { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          'body': json.dumps(_data_loader.DATA.get('course_deptId', []))
      }