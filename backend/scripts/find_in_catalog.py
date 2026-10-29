import json, sys
sys.stdout.reconfigure(encoding="utf-8")

with open("tools/data/aptiskytich/exam_sets_catalog.json", "r", encoding="utf-8") as f:
    sets = json.load(f)

for s in sets:
    t = s.get("title", "")
    if "Technology in childhood" in t or "Mountain (Version 5)" in t:
        print("FOUND SET:", s)
