import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

path_exams = r"tools/data/aptisacademy/bo_de_key/exams_center_b/reading-part1.json"

with open(path_exams, "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"Total exams in exams_center_b reading-part1: {len(data)}")
for i, item in enumerate(data):
    inner = item.get("data", {})
    title = inner.get("title")
    q = inner.get("questions", {})
    subQ = q.get("subQuestion", [])
    answers = [sq.get("correctAnswer") for sq in subQ]
    print(f"[{i+1:02d}] Title: {title} | Gaps: {len(subQ)} | Keys: {answers}")
