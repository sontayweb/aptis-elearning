import json
import re
import sys
from check_pending_sub import run_sql

sys.stdout.reconfigure(encoding='utf-8')

# 1. Load pristine master stories from tools/data/aptisacademy
with open("backend/data/reading_master_dataset.json", "r", encoding="utf-8") as f:
    master = json.load(f)
p2_master = master["part2"]

def clean_txt(t):
    if not t: return ""
    t = re.sub(r'<[^>]+>', ' ', str(t))
    t = re.sub(r'["“”\'’]', '', t)
    t = re.sub(r'^\s*\d+[\s\.\:\)]+', '', t.strip())
    t = re.sub(r'\s+', ' ', t).strip().lower()
    return t

# Function to parse true order from explanation
def parse_order_from_explanation(exp_text):
    if not exp_text:
        return []
    # Pattern: 1. “...” or 1. "..."
    matches = re.findall(r'(?:^|\n)\s*(\d+)[\.\)]\s*[“"\'\s]*(.*?)[”"\'\s]*(?:→|–|-|\n|$)', exp_text)
    items = []
    for num_str, sent in matches:
        num = int(num_str)
        if num == 0: continue # câu cho sẵn nếu có
        sent_clean = clean_txt(sent)
        if sent_clean and len(sent_clean) > 8:
            items.append((num, sent_clean))
    items.sort(key=lambda x: x[0])
    return [x[1] for x in items]

# 2. Fetch all Part 2 questions from DB
db_raw = run_sql("""
SELECT q.id, e.title as exam_title, q.prompt, q.options, q.correct_answer, q.explanation
FROM "Question" q
JOIN "ExamPart" ep ON ep.id = q.part_id
JOIN "Exam" e ON e.id = ep.exam_id
WHERE e.skill = 'READING' AND (
  ep.title LIKE '%Part 2%' OR ep.title LIKE '%Cohesion%' OR e.title LIKE '%Part 2%' OR (e.title LIKE '%Full Reading%' AND ep.part_number = 2)
)
ORDER BY e.title, q.question_number;
""")

lines = db_raw.strip().split("\n")
print(f"Total Part 2 Question rows in DB: {len(lines)}")

success_count = 0
unresolved = []

for line in lines:
    parts = [p.strip() for p in line.split("|")]
    if len(parts) >= 6:
        qid, exam_title, prompt, opts_raw, curr_ans, exp = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]
        if qid == "id": continue
        
        try:
            opts = json.loads(opts_raw)
        except:
            continue
            
        sentences = opts.get("sentences", []) if isinstance(opts, dict) else (opts if isinstance(opts, list) else [])
        if len(sentences) < 4:
            continue
            
        # Get true order from explanation first
        true_sents = parse_order_from_explanation(exp)
        
        # If not in explanation, try finding in p2_master
        if len(true_sents) != len(sentences):
            for m in p2_master:
                m_title = m["title"].lower()
                p_title = prompt.lower()
                if (p_title in m_title or m_title in p_title) and len(p_title) > 3:
                    # from master, the correct order is in m["explanation"]
                    true_sents = parse_order_from_explanation(m["explanation"])
                    if len(true_sents) == len(sentences):
                        break
                        
        if len(true_sents) == len(sentences):
            # Now map each true sentence to an item in sentences
            new_correct_order = []
            used_ids = set()
            for ts in true_sents:
                matched_id = None
                for s in sentences:
                    s_id = s.get("id") if isinstance(s, dict) else str(s)
                    if s_id in used_ids: continue
                    s_text = clean_txt(s.get("text", "") if isinstance(s, dict) else s)
                    if ts[:25] in s_text or s_text[:25] in ts or ts in s_text or s_text in ts:
                        matched_id = s_id
                        break
                if matched_id:
                    new_correct_order.append(matched_id)
                    used_ids.add(matched_id)
                    
            if len(new_correct_order) == len(sentences):
                success_count += 1
                curr_list = json.loads(curr_ans) if curr_ans.startswith("[") else []
                is_changed = curr_list != new_correct_order
                if is_changed:
                    print(f"[{success_count:02d}] {exam_title} | {prompt}:")
                    print(f"     Old Key: {curr_ans}  -->  NEW TRUE KEY: {new_correct_order}")
            else:
                unresolved.append((exam_title, prompt, f"partial match {len(new_correct_order)}/{len(sentences)}"))
        else:
            unresolved.append((exam_title, prompt, f"true_sents count {len(true_sents)} vs sentences {len(sentences)}"))

print(f"\n================ SUMMARY ================")
print(f"Successfully computed true key for {success_count} Part 2 questions!")
print(f"Unresolved: {len(unresolved)}")
for u in unresolved[:10]:
    print("  ", u)
