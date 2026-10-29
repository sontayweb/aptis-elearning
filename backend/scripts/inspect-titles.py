import json
import sys
import re

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open('tools/data/aptisacademy/bo_de_key/exams/reading-part1.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total items in reading-part1.json: {len(data)}")
for i, item in enumerate(data):
    title = item.get('data', {}).get('title', '')
    print(f"Index {i+1}: {title}")
