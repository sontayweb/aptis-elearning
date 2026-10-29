import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open(r"tools/data/aptisacademy/full_tests_167.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for ex in data:
    title = ex.get("title", "")
    if title in ["Reading 1", "Reading 2"]:
        print(f"\n==================== {title} ====================")
        questions = ex.get("questions", [])
        for i, q in enumerate(questions):
            print(f"  Q{i+1}: title: {q.get('questionTitle')}")
            print(f"       suggestion snippet: {str(q.get('suggestion'))[:150]}")
            if q.get("subQuestion"):
                print(f"       subQuestion count: {len(q.get('subQuestion'))}")
                print(f"       subQ[0] answer: {q.get('subQuestion')[0].get('correctAnswer')}")
            if q.get("answerList"):
                print(f"       answerList count: {len(q.get('answerList'))}")
