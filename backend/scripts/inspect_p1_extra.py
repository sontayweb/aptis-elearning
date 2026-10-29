import json, sys
sys.stdout.reconfigure(encoding="utf-8")

with open("tools/data/aptiskytich/all_exam_questions.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

for q in questions:
    if q.get("exam_set_id") == "985660ed-70bf-4a9f-afac-ee9fa9b73059":
        print("QUESTION TEXT:", q.get("question_text"))
        print("EXTRA_DATA:", json.dumps(q.get("extra_data"), ensure_ascii=False, indent=2))
        print("OPTIONS:", q.get("options"))
        print("CORRECT_ANSWER:", q.get("correct_answer"))
        print("EXPLANATION:", q.get("explanation"))
        break
