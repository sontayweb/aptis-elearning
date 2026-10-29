import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

p2_path = 'tools/data/aptisacademy/bo_de_key/exams/reading-part2.json'
with open(p2_path, 'r', encoding='utf-8') as f:
    d2 = json.load(f)

for i in range(3):
    it = d2[i]
    q = it['data']['questions']
    print(f"\n--- Item {i+1}: {it.get('data', {}).get('title')} ---")
    print("correctAnswer:", q.get('correctAnswer'))
    print("suggestion:", q.get('suggestion'))
    print("answerList:")
    for idx, a in enumerate(q.get('answerList', [])):
        print(f"  [{idx+1}] (id={a.get('id')}) content: {a.get('content')}")
