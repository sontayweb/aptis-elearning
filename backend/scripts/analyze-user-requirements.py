import json
import re
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open('backend/scripts/vps_exams_list.json', 'r', encoding='utf-8') as f:
    exams = json.load(f)

with open('backend/scripts/vps_parts_list.json', 'r', encoding='utf-8') as f:
    parts = json.load(f)

print(f"Loaded {len(exams)} exams, {len(parts)} parts.")

# 1. Check Reading Part 1 titles: looking for "Reading Part 1 (window, buy, market)" or similar
p1_candidates = [e for e in exams if 'part 1' in e['title'].lower() or '(' in e['title'] and 'reading' in e['skill'].lower()]
print(f"\n--- Reading Part 1 Title Samples ---")
for e in p1_candidates[:20]:
    print(f"ID: {e['id']} | Title: {e['title']} | Skill: {e['skill']}")

# 2. Check Reading Part 2 + 3 requested topics:
p2_requested = {
    5: ["Film", "singer", "the famous singer", "new coffee shop", "My visit to a new coffee shop", "busy coffee", "End of term project"],
    4: ["The first American woman in Space", "Weekend activities", "Movies then and now", "New coffee shop", "The first american woman in space", "The history of transportation"],
    3: ["Family Sport Day", "Family sports day", "Mae - The Math Girl", "Cultural festival", "College Welcoming Day"],
    2: ["Public Transportations", "Writing about a place", "Music show at the park"]
}

print("\n--- Check Part 2 + 3 Topics in VPS DB ---")
for level, topics in p2_requested.items():
    print(f"\n>> Target {level} ☘️:")
    for t in topics:
        matches = [e for e in exams if t.lower() in e['title'].lower()]
        if matches:
            for m in matches:
                print(f"  [FOUND] '{t}' -> '{m['title']}' | Skill: {m['skill']} | Current hot_level: {m['hot_level']} (Expected: {level})")
        else:
            print(f"  [MISSING] '{t}' not found in Exam titles.")

# 3. Check Reading Part 4 requested topics:
p4_requested = {
    5: ["childhood", "Music festival", "Games from childhood", "Technology in childhood"],
    4: ["Extreme sports"],
    3: ["Childhood memories", "Free time activity", "Job and trainning", "Volunteering", "Career"],
    2: ["Volunteering", "Career", "Job and training", "Free time activity", "Childhood memories"]
}
print("\n--- Check Part 4 Topics in VPS DB ---")
for level, topics in p4_requested.items():
    print(f"\n>> Target {level} ☘️:")
    for t in topics:
        matches = [e for e in exams if t.lower() in e['title'].lower()]
        if matches:
            for m in matches[:3]:
                print(f"  [FOUND] '{t}' -> '{m['title']}' | Skill: {m['skill']} | Current hot_level: {m['hot_level']} (Expected: {level})")
        else:
            print(f"  [MISSING] '{t}' not found in Exam titles.")

# 4. Check Mountain / Four-day week / Women mathematicians:
p5_requested = ["Mountain", "four-day week", "Women mathematicians", "Woman Mathematics", "Mountain Summits"]
print("\n--- Check Part 5 (Headings / Long Reading) Topics in VPS DB ---")
for t in p5_requested:
    matches = [e for e in exams if t.lower() in e['title'].lower()]
    if matches:
        for m in matches[:3]:
            print(f"  [FOUND] '{t}' -> '{m['title']}' | Skill: {m['skill']} | Current hot_level: {m['hot_level']}")
    else:
        print(f"  [MISSING] '{t}' not found in Exam titles.")

# 5. Check Speaking Part 1, 2, 3:
sp_exams = [e for e in exams if e['skill'] == 'SPEAKING']
print(f"\n--- Check Speaking Exams Titles Sample ({len(sp_exams)} total) ---")
for e in sp_exams[:15]:
    print(f"ID: {e['id']} | Title: '{e['title']}' | Hot: {e['hot_level']}")

# Check Speaking Part 3 images (dual images):
sp_p3_parts = [p for p in parts if p['skill'] == 'SPEAKING' and (p['part_number'] == 3 or 'part 3' in p['title'].lower() or 'compare' in p['title'].lower())]
print(f"\n--- Check Speaking Part 3 Dual Images ({len(sp_p3_parts)} total) ---")
p3_dual = 0
p3_single = 0
p3_none = 0
for p in sp_p3_parts:
    img = p['image_url'] or ''
    if ',' in img:
        p3_dual += 1
    elif img.strip():
        p3_single += 1
    else:
        p3_none += 1

print(f"Part 3 Images Summary: Dual Images (2 tranh): {p3_dual} | Single Image (1 tranh): {p3_single} | No Image: {p3_none}")
if p3_single > 0:
    print("Sample Part 3 with only 1 image:")
    for p in [p for p in sp_p3_parts if p['image_url'] and ',' not in p['image_url']][:5]:
        print(f"  Exam: {p['exam_title']} | Part: {p['title']} | Image: {p['image_url']}")
