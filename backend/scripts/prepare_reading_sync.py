import json, sys
sys.stdout.reconfigure(encoding="utf-8")

with open("tools/data/aptiskytich/exam_sets_catalog.json", "r", encoding="utf-8") as f:
    sets = json.load(f)

with open("tools/data/aptiskytich/all_exam_questions.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

q_by_set = {q["exam_set_id"]: q for q in questions}

# Check all reading sets
reading_sets = [s for s in sets if (s.get("skill") or "").lower() == "reading"]

p3_map = {}
p4_map = {}

for s in reading_sets:
    q = q_by_set.get(s["id"])
    if not q: continue
    extra = q.get("extra_data")
    if not extra: continue
    
    # Check if Part 3 (has people and statements)
    if "people" in extra and "statements" in extra:
        p3_map[s["title"]] = {
            "catalog_id": s["id"],
            "title": s["title"],
            "people": extra["people"],
            "statements": extra["statements"],
            "instruction": extra.get("instruction") or q.get("question_text"),
            "explanation": q.get("explanation")
        }
        
    # Check if Part 4 (has paragraphs and headings)
    if "paragraphs" in extra and "headings" in extra:
        p4_map[s["title"]] = {
            "catalog_id": s["id"],
            "title": s["title"],
            "paragraphs": extra["paragraphs"],
            "headings": extra["headings"],
            "instruction": extra.get("instruction") or "Read the passage quickly. Choose a heading for each numbered paragraph from the drop-down box.",
            "explanation": q.get("explanation")
        }

print(f"Extracted Part 3 (Opinion Matching) datasets: {len(p3_map)}")
print(f"Extracted Part 4 (Long Reading) datasets: {len(p4_map)}")
print("\nSample Part 3 titles:", list(p3_map.keys())[:5])
print("Sample Part 4 titles:", list(p4_map.keys())[:5])
