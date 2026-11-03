import re
import json

with open('Part 2-Reading-Meo-Thi.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern for topics
blocks = re.split(r'\n(?=(?:#\s*)?\d+(?:[\.\\]|\s+))', content.strip())

topics = []
for b in blocks:
    lines = [l.strip() for l in b.strip().split('\n') if l.strip()]
    if not lines:
        continue
    title_line = lines[0]
    m = re.match(r'^(?:#\s*)?(\d+)[\.\\]?\s*(.*)$', title_line)
    if m:
        num = int(m.group(1))
        title = m.group(2).strip()
    else:
        num = len(topics) + 1
        title = title_line
    
    pairs = []
    summary = ''
    for l in lines[1:]:
        if l.startswith('|') and '---' not in l:
            parts = [p.strip() for p in l.split('|')[1:-1]]
            if len(parts) >= 2 and parts[0] and parts[1]:
                pairs.append({'en': parts[0], 'vn': parts[1]})
        elif not l.startswith('|'):
            if not summary:
                summary = l
            else:
                summary += ' ' + l
                
    topics.append({
        'id': f'topic-{len(topics)+1}',
        'num': len(topics)+1,
        'title': title,
        'pairs': pairs,
        'summary': summary
    })

print(f"Extracted {len(topics)} topics")

with open('frontend/src/data/extracted_reading_p2_topics.json', 'w', encoding='utf-8') as f:
    json.dump(topics, f, ensure_ascii=False, indent=2)

print("Saved to frontend/src/data/extracted_reading_p2_topics.json successfully!")
