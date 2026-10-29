import json, sys
sys.stdout.reconfigure(encoding="utf-8")

with open("tools/data/aptiskytich/exam_sets_catalog.json", "r", encoding="utf-8") as f:
    sets = json.load(f)

with open("tools/data/aptiskytich/all_exam_questions.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

q_by_set = {q["exam_set_id"]: q for q in questions}

p3_sets = [s for s in sets if (s.get("skill") or "").lower() == "reading" and "Part 3" in (s.get("part") or "")]

print(f"Total Part 3 sets in aptiskytich: {len(p3_sets)}")

seen_topics = {}
for idx, s in enumerate(sorted(p3_sets, key=lambda x: x.get("title", ""))):
    title = s.get("title", "")
    ft = s.get("full_test_title") or "Standalone"
    clean_topic = title.split(" - ")[-1] if " - " in title else title
    dup = ""
    if clean_topic in seen_topics:
        dup = f" -> TRÙNG CHỦ ĐỀ VỚI: {seen_topics[clean_topic]}"
    else:
        seen_topics[clean_topic] = s.get("title")
    print(f"{idx+1:02d}. [{title}] (FullTest: {ft}) {dup}")

print(f"\nTotal UNIQUE Topics in Part 3: {len(seen_topics)} / {len(p3_sets)}")
