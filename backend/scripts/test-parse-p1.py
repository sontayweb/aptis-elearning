import json
import re
from bs4 import BeautifulSoup
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 1. Test parsing Part 1
p1_path = 'tools/data/aptisacademy/bo_de_key/exams/reading-part1.json'
with open(p1_path, 'r', encoding='utf-8') as f:
    d1 = json.load(f)

print(f"Loaded {len(d1)} items from {p1_path}")
p1_results = []
for i, it in enumerate(d1):
    data = it.get('data', {})
    raw_title = data.get('title') or data.get('name') or it.get('title') or f"Đề {i+1}"
    q = data.get('questions', {})
    
    # Intro content
    intro_html = q.get('content', '')
    soup = BeautifulSoup(intro_html, 'html.parser')
    intro_text = soup.get_text(separator=' ').strip()
    
    sub_qs = q.get('subQuestion', [])
    gaps = []
    for sq in sub_qs:
        sentence = sq.get('content', '')
        # Replace tienphongSpace or similar tokens
        clean_sentence = re.sub(r'tienphongSpace', '[gap]', sentence, flags=re.IGNORECASE)
        cor_ans = sq.get('correctAnswer', '').strip()
        ans_list = [a.get('content', '').strip() for a in sq.get('answerList', [])]
        gaps.append({
            'prompt': clean_sentence,
            'options': ans_list,
            'correct_answer': cor_ans
        })
    
    p1_results.append({
        'index': i + 1,
        'raw_title': raw_title,
        'intro': intro_text,
        'gaps_count': len(gaps),
        'keys': [g['correct_answer'] for g in gaps],
        'gaps': gaps
    })

print(f"\n--- PART 1 PARSE SUMMARY (Total {len(p1_results)} exams) ---")
for r in p1_results[:15]:
    print(f"[{r['index']:02d}] {r['raw_title']} | gaps={r['gaps_count']} | keys: {' - '.join(r['keys'])}")

# Check for any with != 5 gaps
irregular_p1 = [r for r in p1_results if r['gaps_count'] != 5]
print(f"\nIrregular P1 count (!= 5 gaps): {len(irregular_p1)}")
for irr in irregular_p1:
    print(f"  [{irr['index']:02d}] {irr['raw_title']} has {irr['gaps_count']} gaps")
