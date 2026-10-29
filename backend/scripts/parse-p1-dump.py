import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('backend/scripts/dump_all_p1_out.txt', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Lines match format:
#  id | title | question_number | prompt | options | correct_answer
lines = text.split('\n')
exams = {}
for line in lines:
    parts = [p.strip() for p in line.split('|')]
    if len(parts) >= 6 and len(parts[0]) == 36: # uuid
        eid, title, qnum, prompt, opts, ans = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]
        if title not in exams:
            exams[title] = {'id': eid, 'questions': []}
        exams[title]['questions'].append({
            'num': qnum,
            'prompt': prompt,
            'opts': opts,
            'ans': ans
        })

print(f"Total Reading exams with Part 1: {len(exams)}")
for title in sorted(exams.keys()):
    if re.match(r'^(Đề|Test|Full Reading)\s*\d+', title, re.I):
        print(f"\n=== {title} (ID: {exams[title]['id']}) ===")
        for q in exams[title]['questions'][:5]:
            print(f"  Q{q['num']}: {q['prompt'][:45]}... | Options: {q['opts']} | Ans: {q['ans']}")
