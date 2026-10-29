import json
from check_pending_sub import run_sql

db_raw = run_sql("""
SELECT q.id, e.title as exam_title, q.question_number, q.prompt, q.explanation
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

has_explanation = 0
for line in lines:
    parts = [p.strip() for p in line.split("|")]
    if len(parts) >= 5:
        qid, exam_title, qnum, prompt, exp = parts[0], parts[1], parts[2], parts[3], parts[4]
        if qid == "id": continue
        if exp and len(exp) > 20:
            has_explanation += 1
            print(f"\n{exam_title} | Q{qnum} ({prompt}):")
            print("  Explanation snippet:", exp[:200].replace("\n", " "))
        else:
            print(f"\n{exam_title} | Q{qnum} ({prompt}): NO EXPLANATION")

print(f"\nQuestions with explanation: {has_explanation}")
