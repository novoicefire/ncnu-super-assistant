import requests
import icalendar
import json
import os
from datetime import datetime

# URL of the ICS file
ICS_URL = "https://www.google.com/calendar/ical/curricul%40mail.ncnu.edu.tw/public/basic.ics"
# Output path relative to project root
OUTPUT_FILE = os.path.join("frontend", "public", "data", "calendar.json")

def fetch_and_parse_calendar():
    try:
        print(f"Fetching ICS from {ICS_URL}...")
        response = requests.get(ICS_URL, timeout=30)
        response.raise_for_status()
        
        print("Parsing ICS data...")
        calendar = icalendar.Calendar.from_ical(response.content)
        events = []
        
        for component in calendar.walk():
            if component.name == "VEVENT":
                summary = component.get('summary')
                dtstart = component.get('dtstart')
                dtend = component.get('dtend')
                
                if dtstart and dtend:
                    # Convert to ISO format string
                    start_str = dtstart.dt.isoformat() if hasattr(dtstart.dt, 'isoformat') else str(dtstart.dt)
                    end_str = dtend.dt.isoformat() if hasattr(dtend.dt, 'isoformat') else str(dtend.dt)
                    
                    events.append({
                        "summary": str(summary) if summary else "",
                        "start": start_str,
                        "end": end_str
                    })
        
        # Sort events by start time
        events.sort(key=lambda x: x['start'])
        print(f"Parsed {len(events)} events.")
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        
        # Save to JSON
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(events, f, ensure_ascii=False, indent=2)
        print(f"Successfully saved to {OUTPUT_FILE}")
        
    except Exception as e:
        print(f"Error fetching calendar: {e}")
        exit(1)

if __name__ == "__main__":
    fetch_and_parse_calendar()
