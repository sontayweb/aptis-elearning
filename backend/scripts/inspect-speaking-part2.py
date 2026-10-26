import json
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open('backend/scripts/vps_exams_list.json', 'r', encoding='utf-8') as f:
    exams = json.load(f)

sp2 = [e for e in exams if e['skill'] == 'SPEAKING' and ('part 2' in e['title'].lower() or 'tranh' in e['title'].lower() or 'đề' in e['title'].lower())]
print(f"Total Speaking exams with Part 2 / Tranh / Đề: {len(sp2)}")
for x in sp2[:30]:
    print(f"ID: {x['id']} | Title: '{x['title']}' | Hot: {x['hot_level']}")
