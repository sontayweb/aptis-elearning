import json, sys
sys.stdout.reconfigure(encoding="utf-8")

with open("tools/data/aptiskytich/exam_sets_catalog.json", "r", encoding="utf-8") as f:
    sets = json.load(f)

p1_sets = [s for s in sets if (s.get("skill") or "").lower() == "reading" and "Part 1" in (s.get("part") or "")]
first_set = p1_sets[0]
print("First P1 set:", first_set)

with open("tools/data/aptiskytich/all_exam_questions.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

for q in questions:
    if q.get("exam_set_id") == first_set["id"]:
        print("QUESTION TEXT:", q.get("question_text"))
        print("EXTRA_DATA:", json.dumps(q.get("extra_data"), ensure_ascii=False, indent=2))
        print("OPTIONS:", q.get("options"))
        print("CORRECT_ANSWER:", q.get("correct_answer"))
        print("EXPLANATION:", q.get("explanation"))
        break
