import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

path_p3 = r"tools/data/aptisacademy/bo_de_key/exams/reading-part3.json"
path_p4 = r"tools/data/aptisacademy/bo_de_key/exams/reading-part4.json"

with open(path_p3, "r", encoding="utf-8") as f:
    d3 = json.load(f)

print(f"=== Part 3 Count: {len(d3)} ===")
for i in range(min(2, len(d3))):
    inner = d3[i].get("data", {})
    print("P3 Title:", inner.get("title"))
    q = inner.get("questions", {})
    print("  content snippet:", str(q.get("content"))[:200])
    subQ = q.get("subQuestion") or []
    print("  subQuestion count:", len(subQ))
    if subQ:
        print("  subQ[0]:", subQ[0])
    print("  suggestion snippet:", str(q.get("suggestion"))[:200])

with open(path_p4, "r", encoding="utf-8") as f:
    d4 = json.load(f)

print(f"\n=== Part 4 Count: {len(d4)} ===")
for i in range(min(2, len(d4))):
    inner = d4[i].get("data", {})
    print("P4 Title:", inner.get("title"))
    q = inner.get("questions", {})
    print("  content snippet:", str(q.get("content"))[:200])
    subQ = q.get("subQuestion") or []
    print("  subQuestion count:", len(subQ))
    if subQ:
        print("  subQ[0]:", subQ[0])
    print("  suggestion snippet:", str(q.get("suggestion"))[:200])
