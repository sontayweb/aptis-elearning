import json
import re
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open('backend/scripts/vps_reading_exams.json', 'r', encoding='utf-8') as f:
    exams = json.load(f)

print(f"Total Reading exams: {len(exams)}")

# Check matching with requested topics
topics_5_clover = [
    "film", "singer", "the famous singer", "new coffee shop", "my visit to a new coffee shop",
    "busy coffee", "end of term project",
    # Part 4 opinion
    "childhood", "music festival", "games from childhood", "technology in childhood",
    # Part 4/5 long
    "mountain", "four-day week", "women mathematicians", "woman mathematics", "mountain summits"
]

topics_4_clover = [
    "the first american woman in space", "weekend activities", "movies then and now",
    "the history of transportation", "extreme sports"
]

topics_3_clover = [
    "family sport day", "family sports day", "mae - the math girl", "cultural festival",
    "college welcoming day", "childhood memories", "free time activity", "job and trainning",
    "job and training", "volunteering", "career"
]

topics_2_clover = [
    "public transportations", "writing about a place", "music show at the park"
]

matched = []
unmatched_unpub = []

for e in exams:
    t = e['title'].lower()
    matched_level = None
    matched_kw = None
    for kw in topics_5_clover:
        if kw in t:
            matched_level = 5
            matched_kw = kw
            break
    if not matched_level:
        for kw in topics_4_clover:
            if kw in t:
                matched_level = 4
                matched_kw = kw
                break
    if not matched_level:
        for kw in topics_3_clover:
            if kw in t:
                matched_level = 3
                matched_kw = kw
                break
    if not matched_level:
        for kw in topics_2_clover:
            if kw in t:
                matched_level = 2
                matched_kw = kw
                break

    if matched_level:
        matched.append({
            'id': e['id'],
            'title': e['title'],
            'is_published': e['is_published'],
            'current_hot': e['hot_level'],
            'new_hot': matched_level,
            'kw': matched_kw,
            'parts': e['parts']
        })
    elif not e['is_published']:
        unmatched_unpub.append(e)

print(f"\n--- MATCHED TOPIC EXAMS ({len(matched)}) ---")
for m in matched:
    print(f"[{m['new_hot']}☘️] '{m['title']}' | currently published={m['is_published']}, hot={m['current_hot']} (kw: {m['kw']})")

print(f"\n--- UNMATCHED UNPUBLISHED EXAMS ({len(unmatched_unpub)}) ---")
for u in unmatched_unpub[:30]:
    print(f"'{u['title']}' | parts: {u['parts']}")
