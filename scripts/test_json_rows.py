from test_clean_sql import run_clean_sql
import json

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
WHERE e.title = 'Đề 01 - Tom Harper'
ORDER BY q.question_number;
""")

for line in out.strip().split("\n"):
    if not line.strip(): continue
    row = json.loads(line)
    print("Row:", row["exam_title"], "|", row["prompt"])
    print("  correct_answer:", row["correct_answer"])
    print("  explanation snippet:\n", row["explanation"][:300])
