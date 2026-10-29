import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

path = 'tools/data/aptisacademy/bo-de-full.json'
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Data type: {type(data)}")
inner = data['data']
deep = inner['data']
print("deep keys:", deep.keys())
items = deep['items']
print(f"Total items: {len(items)}")
for i, item in enumerate(items[:15]):
    title = item.get('title') or item.get('name')
    print(f"[{i}] id={item.get('_id')} | title={title} | keys={list(item.keys())[:5]}")
