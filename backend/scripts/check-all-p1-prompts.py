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

print(f"{'Exam Title':<40} | {'Current Answers':<45} | First Prompt")
print("-" * 120)
for title in sorted(exams.keys()):
    if len(exams[title]['questions']) >= 5:
        ans_str = " - ".join([q['ans'] for q in exams[title]['questions'][:5]])
        first_prompt = exams[title]['questions'][0]['prompt'][:40]
        print(f"{title:<40} | {ans_str:<45} | {first_prompt}")
