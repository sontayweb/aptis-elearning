import docx, json, sys
sys.stdout.reconfigure(encoding='utf-8')
doc = docx.Document('READING/Part 3.docx')
lines = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

topics = []
current_topic = None

for l in lines:
    if l.lower().startswith('topic:'):
        if current_topic:
            topics.append(current_topic)
        current_topic = {
            'title': l.replace('Topic:', '').strip(),
            'persons': {},
            'questions': []
        }
    elif current_topic:
        if l.startswith('A ') or l.startswith('Person A:') or l.startswith('Person A :') or l.startswith('A.'):
            current_topic['persons']['A'] = l
        elif l.startswith('B ') or l.startswith('Person B:') or l.startswith('Person B :') or l.startswith('B.'):
            current_topic['persons']['B'] = l
        elif l.startswith('C ') or l.startswith('Person C:') or l.startswith('Person C :') or l.startswith('C.'):
            current_topic['persons']['C'] = l
        elif l.startswith('D ') or l.startswith('Person D:') or l.startswith('Person D :') or l.startswith('D.'):
            current_topic['persons']['D'] = l
        elif (l.startswith('1.') or l.startswith('2.') or l.startswith('3.') or l.startswith('4.') or l.startswith('5.') or l.startswith('6.') or l.startswith('7.')) and ('?' in l or len(l) > 20):
            current_topic['questions'].append(l)

if current_topic:
    topics.append(current_topic)

print('Extracted Part 3 topics with details:', len(topics))
for t in topics:
    print(f"- {t['title']} | Persons: {list(t['persons'].keys())} | Questions: {len(t['questions'])}")

with open('scripts/extracted_p3_reading.json', 'w', encoding='utf-8') as f:
    json.dump(topics, f, ensure_ascii=False, indent=2)
