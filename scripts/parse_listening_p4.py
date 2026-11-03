import re
import json

with open('Part 4-Listening-Meo-Thi.md', 'r', encoding='utf-8') as f:
    text = f.read()

# Topics start with #####
raw_blocks = re.split(r'#####\s*', text)

topics = []
for block in raw_blocks:
    block = block.strip()
    if not block:
        continue
    lines = [l.strip() for l in block.split('\n') if l.strip()]
    if not lines:
        continue
    
    title_line = lines[0]
    # Remove markdown bold and Topic prefix
    clean_title = re.sub(r'^\*\*(.*?)\*\*$', r'\1', title_line).strip()
    clean_title = re.sub(r'^Topic:\s*', '', clean_title, flags=re.I).strip()
    
    # Count clovers: e.g. 🍀🍀🍀 or 🔥
    # Replace fire stickers with 4-leaf clovers
    clover_count = clean_title.count('🍀') + clean_title.count('🔥')
    if clover_count == 0:
        clover_count = 3  # default
        
    title_text = re.sub(r'[🍀🔥]+', '', clean_title).strip()
    if not title_text:
        continue
    
    q1 = ""
    ans1 = ""
    q2 = ""
    ans2 = ""
    quickTip = ""
    
    state = None
    for l in lines[1:]:
        # Question 1
        if re.match(r'^(?:\*\*)?1[\.\s]', l):
            state = 'q1'
            q1 = re.sub(r'^(?:\*\*)?1[\.\s]*', '', l).replace('**', '').strip()
        # Question 2
        elif re.match(r'^(?:\*\*)?2[\.\s]', l):
            state = 'q2'
            q2 = re.sub(r'^(?:\*\*)?2[\.\s]*', '', l).replace('**', '').strip()
        # Quick Tip
        elif re.match(r'^(?:\\=\>|=>|\->)', l):
            quickTip = re.sub(r'^(?:\\=\>|=>|\->)\s*', '', l).strip()
        else:
            if state == 'q1':
                if not ans1:
                    ans1 = l.replace('**', '').strip()
                else:
                    ans1 += ' ' + l.replace('**', '').strip()
            elif state == 'q2':
                if not ans2:
                    ans2 = l.replace('**', '').strip()
                else:
                    ans2 += ' ' + l.replace('**', '').strip()
    
    # Clean up quickTip
    quickTip = re.sub(r'^(?:\\=\>|=>|\->|\=)\s*', '', quickTip).strip()
    
    topics.append({
        'id': f'p4-topic-{len(topics)+1}',
        'title': title_text,
        'cloverCount': clover_count,
        'question1': q1,
        'answer1': ans1,
        'question2': q2,
        'answer2': ans2,
        'quickTip': quickTip
    })

print(f"Total topics parsed: {len(topics)}")

# Save JSON
with open('frontend/src/data/parsed_part4_topics.json', 'w', encoding='utf-8') as f:
    json.dump(topics, f, ensure_ascii=False, indent=2)

print("Saved to frontend/src/data/parsed_part4_topics.json")
