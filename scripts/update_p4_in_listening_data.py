import json

with open('frontend/src/data/parsed_part4_topics.json', 'r', encoding='utf-8') as f:
    topics = json.load(f)

with open('frontend/src/data/key-meo-listening-data.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find export const LISTENING_PART4_DATA
start_marker = "export const LISTENING_PART4_DATA: Part4Topic[] = ["
idx = content.find(start_marker)
if idx == -1:
    print("Cannot find start_marker")
    exit(1)

# Format the 48 topics as TypeScript code
ts_topics = json.dumps(topics, ensure_ascii=False, indent=2)

new_content = content[:idx] + f"export const LISTENING_PART4_DATA: Part4Topic[] = {ts_topics};\n"

with open('frontend/src/data/key-meo-listening-data.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Updated LISTENING_PART4_DATA with {len(topics)} topics successfully!")

