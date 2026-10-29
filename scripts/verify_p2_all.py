import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

path_exams = r"tools/data/aptisacademy/bo_de_key/exams/reading-part2.json"

with open(path_exams, "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"Total items in reading-part2: {len(data)}")

def parse_suggestion(html):
    # Regex to extract <li> elements
    # Inside each li, there is span with number, followed by div with english sentence
    # and div with translation, and div with explanation
    li_pattern = re.compile(r'<li[^>]*>(.*?)</li>', re.DOTALL)
    items = li_pattern.findall(html)
    results = []
    for li in items:
        # number
        num_m = re.search(r'<span[^>]*>(\d+)</span>', li)
        num = int(num_m.group(1)) if num_m else None
        
        # English sentence: div right after span
        # <div style="font-weight:600;color:#19232B;font-size:13.5px;">(...)</div>
        eng_m = re.search(r'<div style="font-weight:600;[^>]*>(.*?)</div>', li, re.DOTALL)
        eng = eng_m.group(1).strip() if eng_m else ""
        
        # Translation:
        trans_m = re.search(r'<div style="margin:4px 0 4px 28px;[^>]*>(.*?)</div>', li, re.DOTALL)
        trans = trans_m.group(1).strip() if trans_m else ""
        
        # Rationale:
        rat_m = re.search(r'<div style="margin-left:28px;[^>]*>(.*?)</div>', li, re.DOTALL)
        rat = rat_m.group(1).strip() if rat_m else ""
        
        results.append({
            "order": num,
            "text": eng,
            "translation": trans,
            "explanation": rat
        })
    return results

success_count = 0
for i, item in enumerate(data):
    inner = item.get("data", {})
    title = inner.get("title")
    q = inner.get("questions", {})
    sug = q.get("suggestion", "")
    parsed = parse_suggestion(sug)
    if len(parsed) == 5:
        success_count += 1
    else:
        print(f"Item {i+1} ({title}) parsed {len(parsed)} sentences (not 5)!")

print(f"\nSuccessfully parsed 5 sentences for {success_count} / {len(data)} items ({success_count/len(data)*100:.1f}%)")
