import json
with open("tools/data/aptisacademy/raw_bo_de.json", "r", encoding="utf-8") as f:
    raw_data = json.load(f)
inner = raw_data["data"]["data"]
print("inner keys:", list(inner.keys()))
for k in inner.keys():
    print(f"  inner[{k}] type: {type(inner[k])}")
    if isinstance(inner[k], list):
        print(f"    len: {len(inner[k])}")
        if len(inner[k]) > 0:
            print(f"    sample item 0 keys: {list(inner[k][0].keys())}")
