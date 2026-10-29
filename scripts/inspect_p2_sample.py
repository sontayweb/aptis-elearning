import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

path_exams = r"tools/data/aptisacademy/bo_de_key/exams/reading-part2.json"

with open(path_exams, "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"Total items in reading-part2: {len(data)}")
for i in range(min(5, len(data))):
    inner = data[i].get("data", {})
    title = inner.get("title")
    q = inner.get("questions", {})
    ans_list = q.get("answerList", [])
    correct = q.get("correctAnswer", [])
    suggestion = q.get("suggestion", "")
    print(f"\n--- [{i+1:02d}] {title} ---")
    print("answerList count:", len(ans_list))
    for j, a in enumerate(ans_list):
        print(f"  raw[{j}]: {a.get('content')}")
    print("correctAnswer:", correct)
    print("suggestion snippet:\n", suggestion[:400])
