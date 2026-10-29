import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

p1_path = 'tools/data/aptisacademy/bo_de_key/exams/reading-part1.json'
with open(p1_path, 'r', encoding='utf-8') as f:
    d1 = json.load(f)

print(f"Reading Part 1 has {len(d1)} items:")
for i, it in enumerate(d1):
    data = it.get('data', {})
    title = data.get('title') or data.get('name') or it.get('title')
    questions = data.get('questions', {})
    print(f"[{i+1:02d}] id={it.get('_id')} | title='{title}' | q_type={type(questions).__name__}")
    if i < 3:
        if isinstance(questions, dict):
            print(f"     questions keys: {questions.keys()}")
            for k in list(questions.keys())[:3]:
                print(f"     questions['{k}']: {questions[k]}")
        elif isinstance(questions, list):
            print(f"     questions len: {len(questions)}")
            for q in questions[:3]:
                print(f"     q: {q}")
