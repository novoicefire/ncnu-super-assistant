import json
from pathlib import Path
import requests
from icalendar import Calendar

DATA = {}
CALENDAR_EVENTS = []
  
  # 使用相對路徑從專案根目錄的 data 資料夾載入
  # Netlify 會將專案根目錄作為執行的起點
DATA_PATH = Path('data')

def load_all_data():
      global DATA, CALENDAR_EVENTS
      if DATA and CALENDAR_EVENTS: # 如果已經載入過，就不要重複載入
          return

      # 載入 JSON 檔案
      json_files = {
          'unitId_ncnu': '行政教學單位代碼API.json',
          'contact_ncnu': '校園聯絡資訊API.json',
          'course_ncnu': '本學期開課資訊API.json',
          'course_require_ncnu': '本學年某系所必修課資訊API(以國企系大學班為範例).json',
          'course_deptId': '開課單位代碼API.json'
      }
      for key, filename in json_files.items():
          try:
              with open(DATA_PATH / filename, 'r', encoding='utf-8') as f:
                  content = json.load(f)
                  data_key = list(content.keys())[0]
                  DATA[key] = content[data_key]['item']
          except Exception as e:
              print(f"Error loading {filename}: {e}")
              DATA[key] = []
      
      # 載入行事曆
      ics_url = "https://www.google.com/calendar/ical/curricul%40mail.ncnu.edu.tw/public/basic.ics"
      try:
          response = requests.get(ics_url)
          response.raise_for_status()
          calendar = Calendar.from_ical(response.content)
          for component in calendar.walk():
              if component.name == "VEVENT":
                  event = {
                      "summary": str(component.get('summary')),
                      "start": component.get('dtstart').dt.isoformat() if hasattr(component.get('dtstart').dt, 'isoformat') else str(component.get('dtstart').dt),
                      "end": component.get('dtend').dt.isoformat() if hasattr(component.get('dtend').dt, 'isoformat') else str(component.get('dtend').dt)
                  }
                  CALENDAR_EVENTS.append(event)
          CALENDAR_EVENTS.sort(key=lambda x: x['start'])
      except Exception as e:
          print(f"Error parsing calendar: {e}")

  # 在模組被載入時，就執行一次資料讀取
load_all_data()