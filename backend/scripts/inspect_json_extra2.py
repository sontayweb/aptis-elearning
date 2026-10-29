import json, sys
sys.stdout.reconfigure(encoding="utf-8")

with open("tools/data/aptiskytich/all_exam_questions.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

for q in questions:
    if q.get("exam_set_id") == "23d6fb76-cb86-474e-8b83-78d3d2129d45":
        print("=== TECH IN CHILDHOOD ===")
        print("question_text:", q.get("question_text"))
        print("extra_data:", json.dumps(q.get("extra_data"), ensure_ascii=False, indent=2))
        print("explanation:", q.get("explanation"))
    if q.get("exam_set_id") == "36af7ede-e522-47d4-83ec-fd0c61306c08":
        print("=== MOUNTAIN V5 ===")
        print("question_text:", q.get("question_text"))
        print("extra_data:", json.dumps(q.get("extra_data"), ensure_ascii=False, indent=2))
        print("explanation:", q.get("explanation"))
