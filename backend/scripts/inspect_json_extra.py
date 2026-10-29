import json, sys
sys.stdout.reconfigure(encoding="utf-8")

with open("tools/data/aptiskytich/all_exam_questions.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

for q in questions:
    if q.get("exam_set_id") == "0274ec40-ea8f-405a-9cdd-c56e806a8559":
        print("=== TECH IN CHILDHOOD ===")
        print("extra_data:", json.dumps(q.get("extra_data"), ensure_ascii=False, indent=2))
        print("image_url:", q.get("image_url"))
    if q.get("exam_set_id") == "33355128-1f73-48ce-8155-229429714a5b":
        print("=== MOUNTAIN V5 ===")
        print("extra_data:", json.dumps(q.get("extra_data"), ensure_ascii=False, indent=2))
        print("image_url:", q.get("image_url"))
