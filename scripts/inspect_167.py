import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

fpath = r"tools/data/aptisacademy/full_tests_167.json"
print("Loading:", fpath)
with open(fpath, "r", encoding="utf-8") as f:
    data = json.load(f)

print("Type:", type(data))
print("Total exams in full_tests_167.json:", len(data))

first = data[0]
print("Exam 0 keys:", list(first.keys()))
print("Exam 0 name/title:", first.get("name") or first.get("title"))

reading_parts_found = 0
for ex in data:
    parts = ex.get("parts") or ex.get("questionList") or ex.get("sections") or []
    # inspect structure
    pass

print("Sample exam 0 structure snippet:")
print(json.dumps(first, ensure_ascii=False)[:500])
