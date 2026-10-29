from test_clean_sql import run_clean_sql
import json

out = run_clean_sql("""
SELECT q.prompt, q.options, q.explanation
FROM "Question" q
JOIN "ExamPart" ep ON ep.id = q.part_id
JOIN "Exam" e ON e.id = ep.exam_id
WHERE e.title = 'Đề 14 - The history of transportation' AND q.question_number = 2;
""")

parts = out.strip().split("|||")
if len(parts) >= 3:
    opts = json.loads(parts[1])
    print("Options type:", type(opts))
    print("Options value:", json.dumps(opts, ensure_ascii=False, indent=2))
    print("Explanation:")
    print(parts[2])
