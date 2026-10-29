import json
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open('tools/data/aptisacademy/bo_de_key/exams/reading-part1.json', 'r', encoding='utf-8') as f:
    p1 = json.load(f)

# Existing 16 unique answer sets (normalized to lower case)
core_keys = [
    "window - buy - market - cake - watched",
    "live - share - class - drive - cook",
    "near - friendly - practices - say - then",
    "friendly - walk - first - speak - together",
    "clear - sun - enjoyable - working - read",
    "station - stops - green - dinner - films",
    "morning - friends - leave - good - food",
    "early - lunch - go - car - sleepy",
    "miss - called - ready - meet - dinner",
    "balance - statement - think - slowly - before",
    "just - too - to - some - give",
    "meetings - park - shop - cook - late",
    "great - boat - then - see - too",
    "open - send - easy - so - page",
    "detail - copy - busy - client - long"
]

print(f"Total raw exams in file: {len(p1)}")

valid_candidates = []
for idx, exam in enumerate(p1):
    title = exam.get('data', {}).get('title', f"Exam {idx+1}")
    sub_qs = exam.get('data', {}).get('questions', {}).get('subQuestion', [])
    if len(sub_qs) < 5:
        continue
    
    # take first 5
    qs5 = sub_qs[:5]
    answers = [str(q.get('correctAnswer', '')).strip().lower() for q in qs5]
    ans_str = " - ".join(answers)
    
    is_dup = any(ans_str == k for k in core_keys)
    valid_candidates.append({
        'raw_idx': idx + 1,
        'title': title,
        'answers': answers,
        'ans_str': ans_str,
        'is_dup': is_dup,
        'questions': qs5
    })

print(f"\nTotal valid 5-question exams: {len(valid_candidates)}")
new_exams = [c for c in valid_candidates if not c['is_dup']]
print(f"Total NEW (non-duplicate) exams: {len(new_exams)}")
for i, ex in enumerate(new_exams):
    print(f"{i+1:02d} (Raw #{ex['raw_idx']:02d}): {ex['title']} -> {ex['ans_str']}")

