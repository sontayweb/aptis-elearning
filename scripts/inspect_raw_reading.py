import json
import os

path_exams = r"tools/data/aptisacademy/bo_de_key/exams"

def inspect_detail(fname):
    fpath = os.path.join(path_exams, fname)
    print("=" * 60)
    print("Inspecting:", fname)
    with open(fpath, "r", encoding="utf-8") as f:
        data = json.load(f)
    first_item = data[0]
    inner = first_item.get("data", {})
    print("Title:", inner.get("title"))
    q = inner.get("questions")
    print("Content:")
    print(repr(q.get("content")))
    print("answerList:")
    print(q.get("answerList"))
    print("subQuestion count:", len(q.get("subQuestion") or []))
    if q.get("subQuestion"):
        for i, sq in enumerate(q.get("subQuestion")):
            print(f"  subQ[{i}]:")
            print(f"    content: {repr(sq.get('content'))}")
            print(f"    correctAnswer: {repr(sq.get('correctAnswer'))}")
            print(f"    answerList: {sq.get('answerList')}")
    print("suggestion snippet:")
    print(str(q.get("suggestion"))[:300])

inspect_detail("reading-part1.json")
