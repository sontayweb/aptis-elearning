import json, sys
from collections import Counter
sys.stdout.reconfigure(encoding="utf-8")

with open("tools/data/aptiskytich/exam_sets_catalog.json", "r", encoding="utf-8") as f:
    sets = json.load(f)

with open("tools/data/aptiskytich/all_exam_questions.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

print(f"Total Exam Sets in aptiskytich catalog: {len(sets)}")
print(f"Total Questions in aptiskytich catalog: {len(questions)}")

q_by_set = {}
for q in questions:
    sid = q.get("exam_set_id")
    if sid not in q_by_set:
        q_by_set[sid] = []
    q_by_set[sid].append(q)

reading_sets = [s for s in sets if (s.get("skill") or "").lower() == "reading"]
print(f"\n--- READING SETS IN APTISKYTICH ({len(reading_sets)} sets) ---")
reading_by_part = Counter(s.get("part") for s in reading_sets)
for p, count in reading_by_part.items():
    print(f"  {p}: {count} sets")

p1_sets = [s for s in reading_sets if "Part 1" in (s.get("part") or "")]
print(f"\n--- PART 1 SETS ({len(p1_sets)}) ---")
for s in p1_sets:
    qs = q_by_set.get(s["id"], [])
    q_preview = " | ".join(q.get("question_text", "")[:25] for q in qs)
    print(f"  [{s['id'][:8]}] Title: '{s.get('title')}' | Qs: {len(qs)} | {q_preview}")

# Check duplicate question prompts in Part 1
seen_prompts = Counter()
for s in p1_sets:
    qs = q_by_set.get(s["id"], [])
    for q in qs:
        seen_prompts[q.get("question_text", "").strip()] += 1

dup_qs = {k: v for k, v in seen_prompts.items() if v > 1 and len(k) > 10}
print(f"\nDuplicate question prompts count in Part 1: {len(dup_qs)}")
for qtext, count in list(dup_qs.items())[:10]:
    print(f"  ({count} times): {qtext[:80]}")

with open("tools/data/aptiskytich/full_tests.json", "r", encoding="utf-8") as f:
    full_tests = json.load(f)

print(f"\n--- FULL TESTS IN APTISKYTICH ({len(full_tests)}) ---")
for ft in full_tests:
    print(f"  ID: {ft.get('id', '')[:8]} | Name: '{ft.get('name') or ft.get('title')}'")
