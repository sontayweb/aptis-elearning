import json
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open('backend/scripts/vps_reading_exams.json', 'r', encoding='utf-8') as f:
    exams = json.load(f)

p1_exams = [e for e in exams if 'reading part1' in e['title'].lower() or 'key part1' in e['parts'].lower()]
print(f"Total Part 1 Key exams: {len(p1_exams)}")

titles = {}
for e in p1_exams:
    t = e['title']
    titles.setdefault(t, []).append(e['id'])

dups = {k: v for k, v in titles.items() if len(v) > 1}
print(f"Duplicate titles ({len(dups)}):")
for k, v in list(dups.items())[:10]:
    print(f"  '{k}': {v}")
