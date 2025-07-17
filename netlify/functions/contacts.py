import json
from . import _data_loader

def handler(event, context):
      contacts = _data_loader.DATA.get('contact_ncnu', [])
      unit_info = _data_loader.DATA.get('unitId_ncnu', [])
      
      for contact in contacts:
          matching_unit = next((unit for unit in unit_info if unit['中文名稱'] == contact['title']), None)
          if matching_unit:
              contact['web'] = matching_unit.get('網站網址', contact.get('web'))
      
      return {
          'statusCode': 200,
          'headers': { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          'body': json.dumps(contacts)
      }