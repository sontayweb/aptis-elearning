import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

def clean_txt(t):
    if not t:
        return ""
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
    results.sort(key=lambda x: x["order"])
    return results

def test_file(fpath):
    print("Testing:", fpath)
    with open(fpath, "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"Total: {len(data)}")
    
    unmatched_count = 0
    for i, item in enumerate(data):
        inner = item.get("data", {})
        title = inner.get("title")
        q = inner.get("questions", {})
        ans_list = [clean_txt(a.get("content", "")) for a in q.get("answerList", [])]
        sug_items = parse_suggestion(q.get("suggestion", ""))
        
        if len(sug_items) != 5:
            print(f"  [{i+1}] {title}: sug_items len is {len(sug_items)}")
            unmatched_count += 1
            continue
            
        # Match each sug_item to ans_list
        matched_indices = []
        for s in sug_items:
            found = False
            s_clean = s['text'].lower().replace("’", "'").replace("“", '"').replace("”", '"')
            for j, a in enumerate(ans_list):
                a_clean = a.lower().replace("’", "'").replace("“", '"').replace("”", '"')
                # check exact or substring
                if s_clean == a_clean or s_clean[:25] == a_clean[:25] or a_clean in s_clean or s_clean in a_clean:
                    matched_indices.append(j)
                    found = True
                    break
            if not found:
                pass
        
        if len(matched_indices) != 5 or len(set(matched_indices)) != 5:
            print(f"  [{i+1}] {title}: partial match: {len(matched_indices)} matched out of 5: {matched_indices}")
            unmatched_count += 1
            
    print(f"Summary: {len(data) - unmatched_count} / {len(data)} perfectly matched!\n")

test_file(r"tools/data/aptisacademy/bo_de_key/exams/reading-part2.json")
test_file(r"tools/data/aptisacademy/bo_de_key/exams_center_b/reading-part2.json")
