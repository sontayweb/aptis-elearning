import json

with open('backend/scripts/deploy_fail.log', 'r', encoding='utf-8') as f:
    raw = f.read()

# Find the json array
start = raw.find('[{')
end = raw.rfind('}]')
if start != -1 and end != -1:
    json_str = raw[start:end+2]
    items = json.loads(json_str)
    print(f"Total log items: {len(items)}")
    for item in items[-30:]:
        out = item.get('output', '')
        if out:
            print(f"[{item.get('type')}] {out.strip()[:140]}")

