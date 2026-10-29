import sys
import json
sys.stdout.reconfigure(encoding='utf-8')

with open('backend/scripts/all_p2_dump.txt', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

lines = text.split('\n')
raw_exams = []
for line in lines:
    parts = [p.strip() for p in line.split('|')]
    if len(parts) >= 9 and len(parts[0]) == 36:
        eid, etitle, pid, ptitle, qid, prompt, qtype, mscore, opts, ans = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6], parts[7], parts[8], parts[9]
        is_raw = False
        try:
            parsed = json.loads(opts)
            if isinstance(parsed, list):
                is_raw = True
            elif isinstance(parsed, dict) and (ans == '0' or not ans):
                is_raw = True
        except:
            is_raw = True
        if is_raw or ans == '0':
            raw_exams.append((etitle, prompt, qid, mscore, ans, opts))

print(f"Total Part 2 questions needing normalization: {len(raw_exams)}")
for r in raw_exams[:30]:
    print(f"- {r[0]} | Prompt: {r[1]} | QID: {r[2]} | Ans: {r[4]}")
