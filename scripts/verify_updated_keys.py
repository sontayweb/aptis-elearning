from test_clean_sql import run_clean_sql

out = run_clean_sql("""
SELECT e.title, q.question_number, q.prompt, q.correct_answer, q.max_score
FROM "Question" q
JOIN "ExamPart" ep ON ep.id = q.part_id
JOIN "Exam" e ON e.id = ep.exam_id
WHERE e.title IN (
  'Đề 01 - Tom Harper',
  'Đề 02 - Delivery man',
  'Đề 03 - Paperwork submission process',
  'Đề 04 - Hand in assignment',
  'Đề 05 - Report submission process',
  'Đề 08 - Writing about a place',
  'Đề 10 - University welcome day'
)
ORDER BY e.title, q.question_number;
""")

print("Verified Part 2 questions in DB:")
for line in out.strip().split("\n"):
    parts = line.split("|||")
    if len(parts) >= 5:
        print(f"  {parts[0]} | Q{parts[1]} ({parts[2]}): key = {parts[3]} (max: {parts[4]})")
