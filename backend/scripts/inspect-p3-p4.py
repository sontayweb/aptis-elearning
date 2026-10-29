import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

p3_path = 'tools/data/aptisacademy/bo_de_key/exams/reading-part3.json'
p4_path = 'tools/data/aptisacademy/bo_de_key/exams/reading-part4.json'

with open(p3_path, 'r', encoding='utf-8') as f:
    d3 = json.load(f)
with open(p4_path, 'r', encoding='utf-8') as f:
    d4 = json.load(f)

print(f"Reading Part 3 items: {len(d3)}")
print(f"Reading Part 4 items: {len(d4)}")

# Inspect Part 3 item 0
it3 = d3[0]['data']['questions']
print("\n--- Part 3 Item 0 ---")
print("Title:", d3[0].get('data', {}).get('title'))
print("content:", it3.get('content')[:150] if it3.get('content') else None)
print("subQuestion len:", len(it3.get('subQuestion', [])))
for sq in it3.get('subQuestion', [])[:3]:
    print("  sq prompt:", sq.get('content'))
    print("  sq answerList:", [a.get('content') for a in sq.get('answerList', [])])
    print("  sq correct:", sq.get('correctAnswer'))

# Inspect Part 4 item 0
it4 = d4[0]['data']['questions']
print("\n--- Part 4 Item 0 ---")
print("Title:", d4[0].get('data', {}).get('title'))
print("content:", it4.get('content')[:150] if it4.get('content') else None)
print("subQuestion len:", len(it4.get('subQuestion', [])))
for sq in it4.get('subQuestion', [])[:3]:
    print("  sq prompt:", sq.get('content'))
    print("  sq answerList:", [a.get('content') for a in sq.get('answerList', [])])
    print("  sq correct:", sq.get('correctAnswer'))
