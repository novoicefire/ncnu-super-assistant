import requests
import json
import os

# NCNU API URL for departments
API_URL = "https://api.ncnu.edu.tw/API/get.aspx?json=course_deptId"
# Output path
OUTPUT_FILE = os.path.join("frontend", "public", "data", "departments.json")

def fetch_departments():
    try:
        print(f"Fetching departments from {API_URL}...")
        response = requests.get(API_URL, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        # Extract items
        # Structure is usually {'course_deptId': {'item': [...]}}
        if 'course_deptId' in data and 'item' in data['course_deptId']:
            items = data['course_deptId']['item']
        else:
            # Fallback or raw list if format changes
            items = data
            
        print(f"Fetched {len(items)} departments.")
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        
        # Save to JSON
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
        print(f"Successfully saved to {OUTPUT_FILE}")
        
    except Exception as e:
        print(f"Error fetching departments: {e}")
        exit(1)

if __name__ == "__main__":
    fetch_departments()
