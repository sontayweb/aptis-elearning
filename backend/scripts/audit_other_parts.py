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

for part_name in ["Part 2", "Part 3", "Part 4"]:
    part_sets = [s for s in sets if (s.get("skill") or "").lower() == "reading" and part_name in (s.get("part") or "")]
    print(f"\n==================== {part_name} ({len(part_sets)} sets) ====================")
    seen = {}
    dups = []
    for s in part_sets:
        qs = q_by_set.get(s["id"], [])
        content_key = " | ".join(q.get("question_text", "").strip()[:40] for q in qs)
        if content_key in seen:
            dups.append((s["title"], seen[content_key], content_key[:60]))
        else:
            seen[content_key] = s["title"]
    print(f"Total Unique contents in {part_name}: {len(seen)} / {len(part_sets)}")
    print(f"Duplicate count in {part_name}: {len(dups)}")
    for d_title, orig_title, snippet in dups[:10]:
        print(f"  DUPLICATE: '{d_title}' is IDENTICAL to '{orig_title}' -> Snippet: {snippet}...")
