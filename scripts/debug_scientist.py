from test_clean_sql import run_clean_sql
import json

out = run_clean_sql("""
SELECT q.prompt, q.options, q.explanation
FROM "Question" q
JOIN "Exam" e ON e.id = q.part_id OR e.title = 'Đề 01 - Tom Harper'
WHERE q.prompt = 'A scientist' LIMIT 1;
""")

parts = out.strip().split("|||")
if len(parts) >= 3:
    opts = json.loads(parts[1])
    print("Options sentences:")
    for s in opts["sentences"]:
        print(" ", s["id"], ":", repr(s["text"]))
    print("Explanation:")
    print(parts[2])
