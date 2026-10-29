import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

USER_KEYS = {
    1: ['window', 'buy', 'market', 'cake', 'watched'],
    2: ['live', 'share', 'class', 'drive', 'cook'],
    3: ['near', 'friendly', 'practices', 'say', 'then'],
    4: ['friendly', 'walk', 'first', 'speak', 'together'],
    5: ['clear', 'sun', 'enjoyable', 'working', 'read'],
    7: ['station', 'stops', 'green', 'dinner', 'films'],
    8: ['window', 'buy', 'market', 'cake', 'watched'],
    10: ['morning', 'friends', 'leave', 'good', 'food'],
    12: ['early', 'lunch', 'go', 'car', 'sleepy'],
    14: ['miss', 'called', 'ready', 'meet', 'dinner'],
    15: ['balance', 'statement', 'think', 'slowly', 'before'],
    16: ['just', 'too', 'to', 'some', 'give'],
    17: ['meetings', 'park', 'shop', 'cook', 'late'],
    18: ['great', 'boat', 'then', 'see', 'too'],
    19: ['open', 'send', 'easy', 'so', 'page'],
    20: ['detail', 'copy', 'busy', 'client', 'long'],
}

with open('backend/scripts/dump_all_p1_out.txt', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

lines = text.split('\n')
exams = {}
for line in lines:
    parts = [p.strip() for p in line.split('|')]
    if len(parts) >= 6 and len(parts[0]) == 36:
        eid, title, qnum, prompt, opts, ans = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]
        if title not in exams:
            exams[title] = {'id': eid, 'questions': []}
        exams[title]['questions'].append({
            'num': int(qnum) if qnum.isdigit() else 0,
            'prompt': prompt,
            'opts': opts,
            'ans': ans
        })

for num, keys in USER_KEYS.items():
    title_standalone = f"Đề {num:02d}"
    title_full = f"Đề {num:02d} — Full Reading · 4 Parts"
    
    print(f"\n==================== ĐỀ {num:02d} (TARGET KEYS: {', '.join(keys)}) ====================")
    for t in [title_standalone, title_full]:
        if t in exams:
            ex = exams[t]
            print(f"--- {t} (ID: {ex['id']}) ---")
            for q in sorted(ex['questions'], key=lambda x: x['num'])[:5]:
                print(f"  Q{q['num']}: {q['prompt']}")
                print(f"      Options: {q['opts']}")
                print(f"      Current Ans: {q['ans']}")
        else:
            print(f"--- {t}: NOT FOUND ---")
