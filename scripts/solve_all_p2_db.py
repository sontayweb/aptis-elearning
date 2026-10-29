from test_clean_sql import run_clean_sql
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

def clean(t):
    if not t: return ""
    t = re.sub(r'<[^>]+>', ' ', str(t))
    t = re.sub(r'["“”\'’]', '', t)
    t = re.sub(r'^\s*\d+[\s\.\:\)]+', '', t.strip())
    t = re.sub(r'\s+', ' ', t).strip().lower()
    return t

# 1. Query all DB Part 2 questions
out = run_clean_sql("""
SELECT json_build_object(
  'id', q.id,
  'exam_title', e.title,
  'question_number', q.question_number,
  'prompt', q.prompt,
  'options', q.options,
  'correct_answer', q.correct_answer,
  'explanation', q.explanation
)::text
FROM "Question" q
JOIN "ExamPart" ep ON ep.id = q.part_id
JOIN "Exam" e ON e.id = ep.exam_id
WHERE e.skill = 'READING' AND (
  ep.title LIKE '%Part 2%' OR ep.title LIKE '%Cohesion%' OR e.title LIKE '%Part 2%' OR (e.title LIKE '%Full Reading%' AND ep.part_number = 2)
)
ORDER BY e.title, q.question_number;
""")

rows = []
for line in out.strip().split("\n"):
    if not line.strip() or not line.startswith("{"): continue
    try:
        rows.append(json.loads(line))
    except:
        pass

print(f"Loaded {len(rows)} Part 2 questions from DB.")

# Map of questions by (exam_title, prompt)
updates = []
unresolved = []

for r in rows:
    opts = r.get("options") or {}
    sents = opts.get("sentences") or []
    if len(sents) < 4: continue
    
    prompt = r.get("prompt") or ""
    exp = r.get("explanation") or ""
    curr_ans = r.get("correct_answer") or ""
    
    # If this question has no explanation, check if another question in the same exam has it
    if not exp or len(exp) < 30:
        for other_r in rows:
            if other_r["exam_title"] == r["exam_title"] and other_r.get("explanation"):
                exp = other_r["explanation"]
                break
                
    # Find the section in exp for this prompt
    # Example headers: "▸ Tom Harper", "▸ A scientist", "Tom Harper", "Chủ đề: Tom Harper"
    # Or split exp by "▸"
    sections = re.split(r'▸|\n(?=[A-Z0-9\s]+—\s*thứ tự đúng)', exp)
    relevant_exp = exp
    for sec in sections:
        clean_sec_header = sec.split("\n")[0].lower()
        clean_p = prompt.lower()
        if clean_p in clean_sec_header or clean_sec_header in clean_p or any(w in clean_sec_header for w in clean_p.split() if len(w) > 3):
            relevant_exp = sec
            break
            
    # Extract ordered items from relevant_exp
    matches = re.findall(r'(?:^|\n)\s*(\d+)[\.\)]\s*[“"\'\s]*(.*?)[”"\'\s]*(?:→|–|-|\n|$)', relevant_exp)
    ordered_items = []
    for num_str, s_text in matches:
        num = int(num_str)
        if num == 0: continue
        c = clean(s_text)
        if len(c) > 10:
            ordered_items.append((num, c))
    ordered_items.sort(key=lambda x: x[0])
    ordered_texts = [x[1] for x in ordered_items]
    
    # If still not matching length, take first 5 or last 5
    if len(ordered_texts) == 10 and len(sents) == 5:
        if r["question_number"] == 1:
            ordered_texts = ordered_texts[:5]
        else:
            ordered_texts = ordered_texts[5:]
            
    if len(ordered_texts) == len(sents):
        new_key = []
        used_ids = set()
        for ot in ordered_texts:
            matched_id = None
            for s in sents:
                sid = s.get("id") if isinstance(s, dict) else str(s)
                if sid in used_ids: continue
                st = clean(s.get("text", "") if isinstance(s, dict) else s)
                if ot[:20] in st or st[:20] in ot or ot in st or st in ot:
                    matched_id = sid
                    break
            if matched_id:
                new_key.append(matched_id)
                used_ids.add(matched_id)
                
        if len(new_key) == len(sents):
            updates.append({
                "id": r["id"],
                "exam_title": r["exam_title"],
                "prompt": prompt,
                "qnum": r["question_number"],
                "old_key": curr_ans,
                "new_key": json.dumps(new_key)
            })
        else:
            unresolved.append((r["exam_title"], prompt, f"mapped {len(new_key)}/{len(sents)}"))
    else:
        unresolved.append((r["exam_title"], prompt, f"ordered_texts {len(ordered_texts)} vs sents {len(sents)}"))

print(f"\n================ RESULT ================")
print(f"Successfully resolved keys for {len(updates)} / {len(rows)} questions!")
changed = [u for u in updates if u["old_key"] != u["new_key"]]
print(f"Total keys that NEED FIXING (currently wrong in DB): {len(changed)}!")
for c in changed:
    print(f"  {c['exam_title']} | Q{c['qnum']} ({c['prompt']}):")
    print(f"      OLD: {c['old_key']} -> NEW: {c['new_key']}")

if unresolved:
    print(f"\nUnresolved count: {len(unresolved)}")
    for u in unresolved:
        print("  ", u)
