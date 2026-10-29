import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

path_exams = r"tools/data/aptisacademy/bo_de_key/exams/reading-part2.json"

with open(path_exams, "r", encoding="utf-8") as f:
    data = json.load(f)

print(data[0].get("data", {}).get("questions", {}).get("suggestion"))
