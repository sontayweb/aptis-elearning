import json
import os
import re
import random
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PATH_EXAMS = os.path.join(ROOT_DIR, "tools", "data", "aptisacademy", "bo_de_key", "exams")
PATH_CENTER_B = os.path.join(ROOT_DIR, "tools", "data", "aptisacademy", "bo_de_key", "exams_center_b")

def clean_txt(t):
    if not t:
        return ""
    t = re.sub(r'<[^>]+>', ' ', str(t))
    t = re.sub(r'^\s*\d+[\s\.\:\)]+', '', t.strip())
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def parse_p2_suggestion(html):
    li_pattern = re.compile(r'<li[^>]*>(.*?)</li>', re.DOTALL)
    items = li_pattern.findall(html)
    results = []
    for li in items:
        num_m = re.search(r'<span[^>]*>(\d+)</span>', li)
        num = int(num_m.group(1)) if num_m else len(results) + 1
        
        eng_m = re.search(r'<div style="font-weight:600;[^>]*>(.*?)</div>', li, re.DOTALL)
        eng = clean_txt(eng_m.group(1)) if eng_m else ""
        
        trans_m = re.search(r'<div style="margin:4px 0 4px 28px;[^>]*>(.*?)</div>', li, re.DOTALL)
        trans = clean_txt(trans_m.group(1)) if trans_m else ""
        
        rat_m = re.search(r'<div style="margin-left:28px;[^>]*>(.*?)</div>', li, re.DOTALL)
        rat = clean_txt(rat_m.group(1)) if rat_m else ""
        
        results.append({
            "order": num,
            "text": eng,
            "translation": trans,
            "explanation": rat
        })
    results.sort(key=lambda x: x["order"])
    return results

def build_p1_dataset():
    fpath = os.path.join(PATH_EXAMS, "reading-part1.json")
    with open(fpath, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    p1_exams = []
    for idx, item in enumerate(data):
        inner = item.get("data", {})
        title = inner.get("title") or f"Đề {idx+1:02d}"
        q = inner.get("questions", {})
        subQ = q.get("subQuestion", [])
        if len(subQ) < 5:
            continue
            
        gaps = []
        for q_idx, sq in enumerate(subQ[:5]):
            raw_content = sq.get("content", "")
            prompt = clean_txt(raw_content.replace("tienphongSpace", "[gap]"))
            if "[gap]" not in prompt:
                prompt = prompt + " [gap]"
            correct_ans = sq.get("correctAnswer", "").strip()
            
            raw_answers = sq.get("answerList") or []
            options = [clean_txt(a.get("content")) for a in raw_answers if a.get("content")]
            if correct_ans and correct_ans not in options:
                options.append(correct_ans)
            while len(options) < 3:
                options.append(f"Option {len(options)+1}")
                
            gaps.append({
                "question_number": q_idx + 1,
                "prompt": prompt,
                "options": options[:3],
                "correct_answer": correct_ans,
                "max_score": 2.0
            })
            
        p1_exams.append({
            "title": title,
            "gaps": gaps
        })
    return p1_exams

def build_p2_dataset():
    fpath = os.path.join(PATH_EXAMS, "reading-part2.json")
    with open(fpath, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    p2_stories = []
    for idx, item in enumerate(data):
        inner = item.get("data", {})
        title = inner.get("title") or f"Story {idx+1:02d}"
        q = inner.get("questions", {})
        suggestion = q.get("suggestion", "")
        parsed_sug = parse_p2_suggestion(suggestion)
        
        if len(parsed_sug) != 5:
            continue
            
        # We have 5 clean sentences in order 1..5: parsed_sug[0] .. parsed_sug[4]
        # Assign IDs: s1..s5 to order 1..5
        sentences_ordered = []
        for s_idx, s in enumerate(parsed_sug):
            sentences_ordered.append({
                "id": f"s{s_idx+1}",
                "text": s["text"],
                "translation": s["translation"],
                "explanation": s["explanation"]
            })
            
        # True correct answer array is ALWAYS ["s1", "s2", "s3", "s4", "s5"]
        correct_order = ["s1", "s2", "s3", "s4", "s5"]
        
        # Scramble sentences for options pool using a deterministic pattern (not in 1..5 order)
        # e.g. [2, 0, 4, 1, 3] -> s3, s1, s5, s2, s4
        scramble_order = [2, 0, 4, 1, 3]
        scrambled_sentences = [
            {"id": sentences_ordered[i]["id"], "text": sentences_ordered[i]["text"]}
            for i in scramble_order
        ]
        
        # Build explanation HTML
        explanation_html = f'<div class="space-y-2"><p class="font-bold text-primary">Thứ tự đúng: {title}</p><ol class="list-decimal pl-5 space-y-1">'
        for s in sentences_ordered:
            explanation_html += f'<li><strong>{s["text"]}</strong><br/><span class="text-xs text-muted-foreground">{s["translation"]}</span><br/><span class="text-xs text-amber-600">{s["explanation"]}</span></li>'
        explanation_html += '</ol></div>'
        
        p2_stories.append({
            "title": title.replace("Topic: ", "").strip(),
            "options": {
                "title": title.replace("Topic: ", "").strip(),
                "fixedSentence": None,
                "sentences": scrambled_sentences
            },
            "correct_answer": json.dumps(correct_order),
            "max_score": 5.0,
            "explanation": explanation_html
        })
    return p2_stories

if __name__ == "__main__":
    p1 = build_p1_dataset()
    p2 = build_p2_dataset()
    print(f"Generated {len(p1)} Part 1 exams.")
    print(f"Generated {len(p2)} Part 2 stories.")
    
    out_path = os.path.join(ROOT_DIR, "backend", "data", "reading_master_dataset.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({"part1": p1, "part2": p2}, f, ensure_ascii=False, indent=2)
    print(f"Saved master dataset to {out_path}")
