import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('backend/scripts/all_p2_dump.txt', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

lines = text.split('\n')
questions = []
for line in lines:
    parts = [p.strip() for p in line.split('|')]
    if len(parts) >= 9 and len(parts[0]) == 36:
        eid, etitle, pid, ptitle, qid, prompt, qtype, mscore, opts, ans = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6], parts[7], parts[8], parts[9]
        questions.append({
            'exam_id': eid,
            'exam_title': etitle,
            'part_id': pid,
            'part_title': ptitle,
            'qid': qid,
            'prompt': prompt,
            'max_score': mscore,
            'opts': opts,
            'ans': ans
        })

print(f"Total Part 2 questions found: {len(questions)}")

keywords = ['film', 'sport', 'coffee', 'singer', 'project', 'cafe']
for q in questions:
    title_lower = q['exam_title'].lower()
    prompt_lower = q['prompt'].lower()
    opts_lower = q['opts'].lower()
    
    if any(k in title_lower or k in prompt_lower or k in opts_lower for k in keywords):
        print(f"\n=== {q['exam_title']} (QID: {q['qid']}) ===")
        print(f"  Prompt: {q['prompt']} | MaxScore: {q['max_score']} | Ans: {q['ans']}")
        try:
            parsed = json.loads(q['opts'])
            if isinstance(parsed, list):
                print(f"  Type: Array of {len(parsed)} strings")
                for i, s in enumerate(parsed[:5]):
                    print(f"    [{i}]: {s[:80]}...")
            elif isinstance(parsed, dict):
                print(f"  Type: Dict with keys: {list(parsed.keys())}")
                if 'title' in parsed: print(f"    Story title: {parsed['title']}")
                if 'sentences' in parsed:
                    for i, s in enumerate(parsed['sentences'][:5]):
                        print(f"    [{s.get('id')}]: {s.get('text', '')[:80]}...")
        except Exception as e:
            print(f"  Opts preview: {q['opts'][:100]}")
