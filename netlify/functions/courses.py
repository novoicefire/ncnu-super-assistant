
import json
from . import _data_loader # 從同層級的 _data_loader 導入

def handler(event, context):
      # Netlify 的 Python 函數會透過 query_string_parameters 來傳遞查詢參數
      params = event.get('queryStringParameters', {})
      
      courses = _data_loader.DATA.get('course_ncnu', [])

      # 篩選邏輯
      teacher_query = params.get('teacher')
      cname_query = params.get('course_cname')
      department_query = params.get('department')
      division_query = params.get('division')

      if teacher_query:
          courses = [c for c in courses if teacher_query in c.get('teacher', '')]
      if cname_query:
          courses = [c for c in courses if cname_query in c.get('course_cname', '')]
      if department_query:
          courses = [c for c in courses if department_query == c.get('department', '')]
      if division_query:
          if division_query == '通識':
              courses = [c for c in courses if c.get('department') == '通識']
          else:
              courses = [c for c in courses if division_query == c.get('division', '')]

      return {
          'statusCode': 200,
          'headers': {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*', # 允許所有來源
          },
          'body': json.dumps(courses)
      }