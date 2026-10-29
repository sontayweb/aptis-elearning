from test_clean_sql import run_clean_sql
import json
import re

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

for r in rows:
    opts = r.get("options") or {}
    sents = opts.get("sentences") or []
    if not sents: continue
    
    print(f"\n=== {r['exam_title']} | Q{r['question_number']} ({r['prompt']}) ===")
    print("Sentences in options:")
    for s in sents:
        print(f"  {s.get('id')}: {s.get('text')[:50]}...")
    print("Current correct_answer:", r["correct_answer"])
    exp = r.get("explanation") or ""
    # Look for prompt section in explanation
    p_header = r['prompt'].lower()
    matches = re.findall(r'(?:^|\n)\s*(\d+)[\.\)]\s*[“"\'\s]*(.*?)[”"\'\s]*(?:→|–|-|\n|$)', exp)
    if matches:
        print("Explanation points found:")
        for m in matches[:6]:
            print(f"  {m[0]}. {m[1][:50]}...")
