import json, sys
from collections import Counter
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

seen_options = {}
dups = []
for s in p2_sets:
    qs = q_by_set.get(s["id"], [])
    opts = qs[0].get("options", []) if qs else []
    opt_key = " || ".join(sorted(opts))
    if opt_key in seen_options:
        dups.append((s["title"], seen_options[opt_key]))
    else:
        seen_options[opt_key] = s["title"]

print(f"Total Part 2 sets in aptiskytich: {len(p2_sets)}")
print(f"Unique Part 2 sets by options: {len(seen_options)}")
print(f"Duplicate Part 2 sets in aptiskytich crawl data: {len(dups)}")
for d, orig in dups:
    print(f"  '{d}' is a DUPLICATE of '{orig}'")
