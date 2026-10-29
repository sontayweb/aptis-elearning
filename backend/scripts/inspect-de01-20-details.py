import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

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
            'num': qnum,
            'prompt': prompt,
            'opts': opts,
            'ans': ans
        })

print("=== STANDALONE DE 01 - 20 ===")
for i in range(1, 21):
    t = f"Đề {i:02d}"
    if t in exams:
        print(f"\n{t} (ID: {exams[t]['id']}):")
        answers = [q['ans'] for q in exams[t]['questions'][:5]]
        print("  Current Ans:", " - ".join(answers))
        for q in exams[t]['questions'][:5]:
            print(f"    Q{q['num']}: {q['prompt']} -> {q['opts']} -> {q['ans']}")
    else:
        print(f"\n{t}: NOT FOUND")

print("\n=== FULL READING EXAMS ===")
for t in sorted(exams.keys()):
    if "Full Reading" in t:
        print(f"\n{t} (ID: {exams[t]['id']}):")
        answers = [q['ans'] for q in exams[t]['questions'][:5]]
        print("  Current Ans:", " - ".join(answers))
        for q in exams[t]['questions'][:5]:
            print(f"    Q{q['num']}: {q['prompt']} -> {q['opts']} -> {q['ans']}")
