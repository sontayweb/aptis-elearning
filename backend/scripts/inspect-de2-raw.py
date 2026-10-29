import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

p1_path = 'tools/data/aptisacademy/bo_de_key/exams/reading-part1.json'
with open(p1_path, 'r', encoding='utf-8') as f:
    d1 = json.load(f)

# Let's inspect item 3 ('Đề 2')
item_de2 = None
for it in d1:
    title = it.get('data', {}).get('title', '')
    if 'Đề 2' in title or 'Đề 02' in title:
        item_de2 = it
        break

if not item_de2:
    item_de2 = d1[3]

print("=== INSPECTING ĐỀ 2 PART 1 ===")
q = item_de2['data']['questions']
print("questionTitle:", q.get('questionTitle'))
print("content:", q.get('content'))
print("subQuestion (len):", len(q.get('subQuestion', [])))
for sq in q.get('subQuestion', []):
    print("  sq:", sq)
print("subQuestionAnswerList:", q.get('subQuestionAnswerList'))
print("answerList:", q.get('answerList'))
print("correctAnswer:", q.get('correctAnswer'))
print("suggestion:", q.get('suggestion'))
