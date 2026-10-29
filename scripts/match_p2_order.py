import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

path_exams = r"tools/data/aptisacademy/bo_de_key/exams/reading-part2.json"

with open(path_exams, "r", encoding="utf-8") as f:
    data = json.load(f)

def clean_txt(t):
    if not t:
        return ""
    # remove html tags, leading numbers like "1 \n", extra spaces
    t = re.sub(r'<[^>]+>', ' ', t)
    t = re.sub(r'^\s*\d+[\s\.\:\)]+', '', t.strip())
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def parse_suggestion(html):
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
    # sort by order
    results.sort(key=lambda x: x["order"])
    return results

print(f"Total items in reading-part2.json: {len(data)}")

for i in range(min(5, len(data))):
    inner = data[i].get("data", {})
    title = inner.get("title")
    q = inner.get("questions", {})
    ans_list = [clean_txt(a.get("content", "")) for a in q.get("answerList", [])]
    sug_items = parse_suggestion(q.get("suggestion", ""))
    
    print(f"\n================ Exam {i+1}: {title} ================")
    print("Scrambled answerList in Aptis Academy:")
    for j, a in enumerate(ans_list):
        print(f"  [{j+1}] {a[:70]}...")
    
    print("\nTrue Cohesion Order from Suggestion (1 to 5):")
    order_mapping = []
    for s in sug_items:
        # Find which index in ans_list matches s['text']
        match_idx = None
        for j, a in enumerate(ans_list):
            if a.lower() == s['text'].lower() or a[:30].lower() == s['text'][:30].lower():
                match_idx = j + 1
                break
        order_mapping.append(match_idx)
        print(f"  Step {s['order']}: (from raw #{match_idx}) {s['text'][:65]}... -> Lý do: {s['explanation'][:50]}...")
    print("Order permutation (which raw item goes where):", order_mapping)
