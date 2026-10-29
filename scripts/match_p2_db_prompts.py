import json
from check_pending_sub import run_sql

with open("backend/data/reading_master_dataset.json", "r", encoding="utf-8") as f:
    master = json.load(f)
p2_master = master["part2"]

print(f"Master P2 count: {len(p2_master)}")

db_questions_raw = run_sql("""
SELECT q.id, e.title as exam_title, q.prompt, q.max_score
FROM "Question" q
JOIN "ExamPart" ep ON ep.id = q.part_id
JOIN "Exam" e ON e.id = ep.exam_id
WHERE e.skill = 'READING' AND (
  ep.title LIKE '%Part 2%' OR ep.title LIKE '%Cohesion%' OR e.title LIKE '%Part 2%' OR ep.part_number = 2
);
""")

lines = db_questions_raw.strip().split("\n")
matched = 0
unmatched = []

for line in lines:
    parts = [p.strip() for p in line.split("|")]
    if len(parts) >= 4:
        qid, exam_title, prompt, max_score = parts[0], parts[1], parts[2], parts[3]
        if qid == "id": continue
        # Try matching prompt with p2_master title or story text
        found = False
        p_clean = prompt.lower().strip()
        for s in p2_master:
            s_title = s["title"].lower().strip()
            if p_clean in s_title or s_title in p_clean:
                matched += 1
                found = True
                break
        if not found:
            unmatched.append((exam_title, prompt))

print(f"Matched: {matched}")
print(f"Unmatched count: {len(unmatched)}")
if unmatched:
    print("Sample unmatched:")
    for u in unmatched[:10]:
        print(" ", u)
