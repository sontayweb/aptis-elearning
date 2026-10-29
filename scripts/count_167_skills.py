import json
import collections
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open(r"tools/data/aptisacademy/full_tests_167.json", "r", encoding="utf-8") as f:
    data = json.load(f)

skills = collections.Counter(d.get("skill") for d in data)
print("Skills in full_tests_167.json:")
for s, c in skills.items():
    print(f"  {s}: {c}")

reading_exams = [d for d in data if d.get("skill") == "reading" or (d.get("title") and "reading" in d["title"].lower())]
print(f"Reading exams count: {len(reading_exams)}")
for i, ex in enumerate(reading_exams[:10]):
    print(f"  [{i+1}] {ex.get('title')} | questions: {len(ex.get('questions', []))}")
