import json
from check_pending_sub import run_sql

with open("backend/data/reading_master_dataset.json", "r", encoding="utf-8") as f:
    master = json.load(f)
p2_master = master["part2"]

db_questions_raw = run_sql("""
SELECT q.id, e.title as exam_title, q.prompt, q.options, q.correct_answer
FROM "Question" q
JOIN "ExamPart" ep ON ep.id = q.part_id
JOIN "Exam" e ON e.id = ep.exam_id
WHERE e.skill = 'READING' AND (
  ep.title LIKE '%Part 2%' OR ep.title LIKE '%Cohesion%' OR e.title LIKE '%Part 2%' OR (e.title LIKE '%Full Reading%' AND ep.part_number = 2)
);
""")

lines = db_questions_raw.strip().split("\n")
questions_to_fix = []

for line in lines:
    parts = [p.strip() for p in line.split("|")]
    if len(parts) >= 5:
        qid, exam_title, prompt, opts_raw, curr_ans = parts[0], parts[1], parts[2], parts[3], parts[4]
        if qid == "id": continue
        
        # parse opts
        try:
            opts = json.loads(opts_raw)
        except:
            continue
            
        sentences = opts.get("sentences", []) if isinstance(opts, dict) else (opts if isinstance(opts, list) else [])
        if not sentences:
            continue
            
        # Extract sentence texts
        s_texts = []
        for s in sentences:
            if isinstance(s, dict):
                s_texts.append(s.get("text", "").lower())
            elif isinstance(s, str):
                s_texts.append(s.lower())
                
        # Find matching story in p2_master
        best_match = None
        best_score = 0
        for story in p2_master:
            m_sentences = [st["text"].lower() for st in story["options"]["sentences"]]
            overlap = 0
            for st_db in s_texts:
                for st_m in m_sentences:
                    if st_db[:20] in st_m or st_m[:20] in st_db:
                        overlap += 1
                        break
            if overlap > best_score:
                best_score = overlap
                best_match = story
                
        if best_match and best_score >= 3:
            questions_to_fix.append({
                "question_id": qid,
                "exam_title": exam_title,
                "prompt": prompt,
                "matched_story_title": best_match["title"],
                "overlap": best_score,
                "best_match": best_match
            })
        else:
            print(f"No match for: {exam_title} | {prompt} (max overlap: {best_score})")

print(f"\nTotal Part 2 questions found in DB: {len(questions_to_fix)}")
