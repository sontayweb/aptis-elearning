import json
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open('backend/scripts/vps_exams_list.json', 'r', encoding='utf-8') as f:
    exams = json.load(f)

for e in exams:
    if 'reading part 1' in e['title'].lower():
        print(f"ID: {e['id']} | Title: '{e['title']}' | Skill: {e['skill']}")
