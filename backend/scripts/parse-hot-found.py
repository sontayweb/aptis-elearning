import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('backend/scripts/hot_topics_found.txt', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')
for line in lines:
    if 'Part 2' in line or 'Text Cohesion' in line or 'Text cohesion' in line:
        parts = [p.strip() for p in line.split('|')]
        if len(parts) >= 7:
            exam_id = parts[0]
            title = parts[1]
            part_title = parts[2]
            q_id = parts[3]
            q_num = parts[4]
            prompt = parts[5]
            max_score = parts[6]
            print(f"[{exam_id}] {title} | Q{q_num}: {prompt} | score={max_score}")
