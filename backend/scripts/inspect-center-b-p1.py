import json
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open('tools/data/aptisacademy/bo_de_key/exams_center_b/reading-part1.json', 'r', encoding='utf-8') as f:
    p1 = json.load(f)

print(f"Total entries in exams_center_b/reading-part1.json: {len(p1)}")

for idx, item in enumerate(p1):
    title = item.get('data', {}).get('title', '')
    sub_qs = item.get('data', {}).get('questions', {}).get('subQuestion', [])
    answers = [q.get('correctAnswer') for q in sub_qs]
    print(f"Index {idx+1:02d} | Title: '{title}' | Qs: {len(sub_qs)} | Answers: {' - '.join(str(a) for a in answers)}")
