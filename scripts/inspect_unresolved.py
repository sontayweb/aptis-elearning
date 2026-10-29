import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("tools/data/aptisacademy/bo_de_key/exams/reading-part2.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for item in data:
    title = item.get("data", {}).get("title", "")
    if any(k in title.lower() for k in ["film", "sport", "coffee", "project"]):
        print(f"\nTitle: {title}")
        q = item.get("data", {}).get("questions", {})
        ans_list = q.get("answerList", [])
        for i, a in enumerate(ans_list):
            print(f"  raw[{i}]: {a.get('content')[:60]}")
        sug = q.get("suggestion", "")
        # print first 300 chars of sug
        print("  sug snippet:", re.sub(r'<[^>]+>', ' ', sug)[:200].encode('ascii', 'replace').decode('ascii'))
