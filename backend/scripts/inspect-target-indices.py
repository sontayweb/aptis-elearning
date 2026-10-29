import json
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open('tools/data/aptisacademy/bo_de_key/exams/reading-part1.json', 'r', encoding='utf-8') as f:
    p1 = json.load(f)

# Candidate numbers from user:
# 2, 3, 5, 8, 11, 12, 13, 14, 16, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42
target_indices = [2, 3, 5, 8, 11, 12, 13, 14, 16, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42]

# Let's inspect raw items
print(f"Total items in reading-part1.json: {len(p1)}")
for idx_1based in target_indices:
    if idx_1based <= len(p1):
        item = p1[idx_1based - 1]
        title = item.get('data', {}).get('title', '')
        sub_qs = item.get('data', {}).get('questions', {}).get('subQuestion', [])
        ans = [q.get('correctAnswer') for q in sub_qs]
        print(f"Idx #{idx_1based:02d} | Title: '{title}' | Qs count: {len(sub_qs)} | Ans: {' - '.join(str(a) for a in ans)}")
