import json
import re
from bs4 import BeautifulSoup
import sys

sys.stdout.reconfigure(encoding='utf-8')

p2_path = 'tools/data/aptisacademy/bo_de_key/exams/reading-part2.json'
with open(p2_path, 'r', encoding='utf-8') as f:
    d2 = json.load(f)

print(f"Loaded {len(d2)} items from {p2_path}")

parsed_p2 = []
failed = []

for i, it in enumerate(d2):
    raw_title = it.get('data', {}).get('title') or it.get('title') or f"Story {i+1}"
    q = it.get('data', {}).get('questions', {})
    suggestion = q.get('suggestion', '')
    
    sentences_ordered = []
    
    if suggestion and '<ol' in suggestion:
        soup = BeautifulSoup(suggestion, 'html.parser')
        # Each li in ol
        lis = soup.find_all('li')
        for li in lis:
            # The English text is typically inside a div with bold/color or first div
            divs = li.find_all('div')
            en_text = None
            for d in divs:
                text = d.get_text(separator=' ').strip()
                # Exclude translation/arrows
                if text and not text.startswith('→') and not any(ord(c) > 255 for c in text[:20]):
                    en_text = text
                    break
            if en_text:
                sentences_ordered.append(en_text)
    
    # If HTML parsing didn't get 5, fallback
    if len(sentences_ordered) != 5:
        # Check answerList
        ans_list = [a.get('content', '').strip() for a in q.get('answerList', [])]
        if len(ans_list) == 5:
            # Check if suggestion has text we can match against ans_list
            if suggestion:
                matched = []
                for a in ans_list:
                    pos = suggestion.find(a[:30])
                    if pos != -1:
                        matched.append((pos, a))
                if len(matched) == 5:
                    matched.sort(key=lambda x: x[0])
                    sentences_ordered = [m[1] for m in matched]
                else:
                    sentences_ordered = ans_list
            else:
                sentences_ordered = ans_list
                
    if len(sentences_ordered) == 5:
        parsed_p2.append({
            'index': i + 1,
            'title': raw_title,
            'sentences': sentences_ordered
        })
    else:
        failed.append((i + 1, raw_title, len(sentences_ordered)))

print(f"\nSuccessfully parsed 5-sentence stories: {len(parsed_p2)} / {len(d2)}")
if failed:
    print(f"Failed count: {len(failed)}")
    for f_idx, f_title, f_len in failed:
        print(f"  [{f_idx:02d}] '{f_title}' -> got {f_len} sentences")

print("\n--- SAMPLE 5 PARSED STORIES ---")
for p in parsed_p2[:5]:
    print(f"\n[{p['index']:02d}] Title: {p['title']}")
    for s_idx, s in enumerate(p['sentences']):
        print(f"  {s_idx+1}. {s}")
