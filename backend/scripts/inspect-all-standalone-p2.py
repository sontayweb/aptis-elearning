import sys
import json
sys.stdout.reconfigure(encoding='utf-8')

with open('backend/scripts/all_p2_dump.txt', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

lines = text.split('\n')
exams = {}
for line in lines:
    parts = [p.strip() for p in line.split('|')]
    if len(parts) >= 9 and len(parts[0]) == 36:
        eid, etitle, pid, ptitle, qid, prompt, qtype, mscore, opts, ans = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6], parts[7], parts[8], parts[9]
        if qtype == 'SENTENCE_ORDER' and "Full Reading" not in etitle:
            if etitle not in exams:
                exams[etitle] = {'id': eid, 'part_id': pid, 'questions': []}
            exams[etitle]['questions'].append({
                'qid': qid,
                'prompt': prompt,
                'max_score': mscore,
                'ans': ans,
                'opts': opts
            })

print(f"Total Standalone Part 2 exams: {len(exams)}")
for title, data in sorted(exams.items()):
    print(f"\n==================== {title} (Exam ID: {data['id']}) ====================")
    for q in data['questions']:
        print(f"  QID: {q['qid']} | Prompt: {q['prompt']} | MaxScore: {q['max_score']} | Ans: {q['ans']}")
        try:
            o = json.loads(q['opts'])
            if isinstance(o, list):
                print(f"    Raw Array ({len(o)} items):")
                for idx, s in enumerate(o):
                    print(f"      [{idx}]: {s[:70]}")
            elif isinstance(o, dict):
                print(f"    Dict title: {o.get('title')}, fixed: {o.get('fixedSentence')}, sentences: {len(o.get('sentences', []))}")
        except Exception as e:
            print("    Error parsing opts:", e)
