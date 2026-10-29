import json
import re
from bs4 import BeautifulSoup
import sys

sys.stdout.reconfigure(encoding='utf-8')

p1_b_path = 'tools/data/aptisacademy/bo_de_key/exams_center_b/reading-part1.json'
with open(p1_b_path, 'r', encoding='utf-8') as f:
    d1_b = json.load(f)

print(f"Loaded {len(d1_b)} items from {p1_b_path}")
for i, it in enumerate(d1_b):
    data = it.get('data', {})
    title = data.get('title') or it.get('title') or f"Item {i+1}"
    q = data.get('questions', {})
    sub_qs = q.get('subQuestion', [])
    keys = [sq.get('correctAnswer', '').strip() for sq in sub_qs]
    print(f"[{i+1:02d}] {title} | gaps={len(sub_qs)} | keys: {' - '.join(keys)}")
