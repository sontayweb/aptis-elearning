import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

path = 'tools/data/aptisacademy/bo-de-full.json'
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

items = data['data']['data']['items']
print(f"Total items in bo-de-full.json: {len(items)}")

reading_items = []
for i, it in enumerate(items):
    title = it.get('title', '')
    skill = it.get('skill')
    # Check if reading
    if 'reading' in title.lower() or skill == 'reading' or skill == 2 or skill == 'READING':
        reading_items.append((i, it))

print(f"Found {len(reading_items)} Reading items:")
for idx, it in reading_items:
    title = it.get('title')
    skill = it.get('skill')
    qs = it.get('questions', [])
    q_len = len(qs) if isinstance(qs, list) else 'dict'
    print(f"[{idx}] Title: '{title}' | skill: {skill} | questions: {q_len}")
