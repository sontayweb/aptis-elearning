import json, sys
sys.stdout.reconfigure(encoding="utf-8")

with open("tools/data/aptiskytich/exam_sets_catalog.json", "r", encoding="utf-8") as f:
    sets = json.load(f)

with open("tools/data/aptiskytich/all_exam_questions.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

q_by_set = {}
for q in questions:
    sid = q.get("exam_set_id")
    if sid not in q_by_set:
        q_by_set[sid] = []
    q_by_set[sid].append(q)

p2_sets = [s for s in sets if (s.get("skill") or "").lower() == "reading" and "Part 2" in (s.get("part") or "")]
print(f"Total Part 2 sets: {len(p2_sets)}")
for s in p2_sets[:3]:
    print(f"\n--- SET: {s['title']} (ID: {s['id']}) ---")
    qs = q_by_set.get(s["id"], [])
    print(f"Number of questions in set: {len(qs)}")
    for q in qs:
        print("Question keys:", list(q.keys()))
        print("question_text:", q.get("question_text"))
        print("options:", q.get("options"))
        print("correct_answer:", q.get("correct_answer"))
        print("explanation:", (q.get("explanation") or "")[:100])
