import json
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open('tools/data/aptisacademy/bo_de_key/exams/reading-part1.json', 'r', encoding='utf-8') as f:
    p1 = json.load(f)

print(f"Total Reading Part 1 exams in aptisacademy: {len(p1)}")
for idx, exam in enumerate(p1):
    title = exam.get('data', {}).get('title', '')
    questions = exam.get('data', {}).get('questions', {}).get('subQuestion', [])
    answers = [str(q.get('correctAnswer')) for q in questions]
    print(f"{idx+1:02d}: {title} -> {' - '.join(answers)}")
