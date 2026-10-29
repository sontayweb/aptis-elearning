import json, sys
sys.stdout.reconfigure(encoding="utf-8")

with open("tools/data/aptiskytich/exam_sets_catalog.json", "r", encoding="utf-8") as f:
    sets = json.load(f)

with open("tools/data/aptiskytich/all_exam_questions.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

q_by_set = {q["exam_set_id"]: q for q in questions}

p1_sets = [s for s in sets if (s.get("skill") or "").lower() == "reading" and "Part 1" in (s.get("part") or "")]

print(f"Total Part 1 sets in aptiskytich: {len(p1_sets)}")

seen_passages = {}
for idx, s in enumerate(sorted(p1_sets, key=lambda x: x.get("title", ""))):
    q = q_by_set.get(s["id"])
    extra = q.get("extra_data") if q else {}
    passage = (extra.get("passage") if extra else "") or (q.get("question_text") if q else "")
    passage_norm = " ".join(passage.split())
    
    # Extract correct answers from gaps
    gaps = extra.get("gaps", []) if extra else []
    correct_words = []
    for g in gaps[1:]:  # Gap 0 is example
        c_idx = g.get("correct")
        opts = g.get("options", [])
        if c_idx is not None and 0 <= c_idx < len(opts):
            correct_words.append(opts[c_idx])
        else:
            correct_words.append(f"?[{c_idx}]")
    key_str = " - ".join(correct_words)
    
    dup_info = ""
    if passage_norm in seen_passages:
        dup_info = f" -> TRÙNG VỚI: {seen_passages[passage_norm]}"
    else:
        seen_passages[passage_norm] = s.get("title")
    
    ft = s.get("full_test_title") or "Standalone"
    print(f"{idx+1:02d}. [{s.get('title')}] (FullTest: {ft}) {dup_info}")
    print(f"    Passage: {passage[:65]}...")
    print(f"    Key: {key_str}")

print(f"\nTotal UNIQUE Passages in Part 1: {len(seen_passages)} / {len(p1_sets)}")
