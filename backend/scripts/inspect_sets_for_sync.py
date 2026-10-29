import json, sys
sys.stdout.reconfigure(encoding="utf-8")

with open("tools/data/aptiskytich/exam_sets_catalog.json", "r", encoding="utf-8") as f:
    sets = json.load(f)

with open("tools/data/aptiskytich/all_exam_questions.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

q_by_set = {q["exam_set_id"]: q for q in questions}

print("=== CHECKING PART 3 SETS WITH EXTRA_DATA ===")
p3_sets = [s for s in sets if (s.get("skill") or "").lower() == "reading" and "Part 3" in (s.get("part") or "")]
for s in p3_sets[:5]:
    q = q_by_set.get(s["id"])
    extra = q.get("extra_data") if q else {}
    people = extra.get("people", []) if extra else []
    stmts = extra.get("statements", []) if extra else []
    print(f"[{s['id'][:8]}] '{s['title']}' -> People: {len(people)}, Statements: {len(stmts)}")

print("\n=== CHECKING PART 4 SETS WITH EXTRA_DATA ===")
p4_sets = [s for s in sets if (s.get("skill") or "").lower() == "reading" and "Part 4" in (s.get("part") or "")]
for s in p4_sets[:5]:
    q = q_by_set.get(s["id"])
    extra = q.get("extra_data") if q else {}
    paras = extra.get("paragraphs", []) if extra else []
    headings = extra.get("headings", []) if extra else []
    print(f"[{s['id'][:8]}] '{s['title']}' -> Paragraphs: {len(paras)}, Headings: {len(headings)}")
