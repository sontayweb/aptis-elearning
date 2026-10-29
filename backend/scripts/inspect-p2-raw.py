import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

p2_path = 'tools/data/aptisacademy/bo_de_key/exams/reading-part2.json'
with open(p2_path, 'r', encoding='utf-8') as f:
    d2 = json.load(f)

print(f"Reading Part 2 has {len(d2)} items:")
for i, it in enumerate(d2[:5]):
    data = it.get('data', {})
    title = data.get('title') or data.get('name') or it.get('title')
    q = data.get('questions', {})
    print(f"\n[{i+1:02d}] id={it.get('_id')} | title='{title}'")
    print("  content:", q.get('content')[:100] if q.get('content') else None)
    print("  answerList len:", len(q.get('answerList', [])))
    for a in q.get('answerList', []):
        print(f"    - {a.get('content')}")
    print("  correctAnswer:", q.get('correctAnswer'))
    print("  subQuestion len:", len(q.get('subQuestion', [])))
