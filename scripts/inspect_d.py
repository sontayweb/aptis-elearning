import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("tools/data/aptisacademy/raw_bo_de.json", "r", encoding="utf-8") as f:
    raw_data = json.load(f)

d = raw_data["data"]
print("type(d):", type(d))
if isinstance(d, dict):
    print("d keys:", list(d.keys()))
    for k in d.keys():
        print(f"  d[{k}] type: {type(d[k])}")
        if isinstance(d[k], (list, dict)):
            print(f"    len: {len(d[k])}")
