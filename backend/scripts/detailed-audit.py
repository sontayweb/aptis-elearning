import json
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open('backend/scripts/vps_exams_list.json', 'r', encoding='utf-8') as f:
    exams = json.load(f)

with open('backend/scripts/vps_parts_list.json', 'r', encoding='utf-8') as f:
    parts = json.load(f)

# Total exams by skill
skill_counts = {}
for e in exams:
    skill_counts[e['skill']] = skill_counts.get(e['skill'], 0) + 1

# Hot level distribution
hot_counts = {}
for e in exams:
    hot_counts[e['hot_level']] = hot_counts.get(e['hot_level'], 0) + 1

print("=== VPS DATABASE OVERVIEW ===")
print(f"Total exams: {len(exams)}")
print("Exams by skill:", skill_counts)
print("Exams by hot_level:", hot_counts)

hot_exams = [e for e in exams if e['hot_level'] > 0]
print(f"\nTotal hot exams (hot_level > 0): {len(hot_exams)}")
for e in hot_exams:
    print(f"  - [{e['hot_level']}⭐] {e['title']} ({e['skill']})")

# Check Speaking Part 3 image counts:
sp_p3 = [p for p in parts if p['skill'] == 'SPEAKING' and (p['part_number'] == 3 or 'part 3' in p['title'].lower())]
has_2_images = []
has_1_image = []
has_0_images = []

for p in sp_p3:
    img = p['image_url'] or ''
    if ',' in img:
        has_2_images.append(p)
    elif img.strip():
        has_1_image.append(p)
    else:
        has_0_images.append(p)

print(f"\n=== SPEAKING PART 3 IMAGES AUDIT ({len(sp_p3)} total Part 3s) ===")
print(f"Part 3 with 2 images: {len(has_2_images)} ({len(has_2_images)/len(sp_p3)*100:.1f}%)")
print(f"Part 3 with only 1 image: {len(has_1_image)} ({len(has_1_image)/len(sp_p3)*100:.1f}%)")
print(f"Part 3 with NO images: {len(has_0_images)}")

# Check Reading Topics requested by user:
print("\n=== USER REQUESTED TOPICS CHECK ===")
target_topics = [
    # Part 2+3 (5 ☘️)
    ("Film", 5, "Part 2+3"),
    ("singer", 5, "Part 2+3"),
    ("the famous singer", 5, "Part 2+3"),
    ("new coffee shop", 5, "Part 2+3"),
    ("My visit to a new coffee shop", 5, "Part 2+3"),
    ("busy coffee", 5, "Part 2+3"),
    ("End of term project", 5, "Part 2+3"),
    # Part 2+3 (4 ☘️)
    ("The first American woman in Space", 4, "Part 2+3"),
    ("Weekend activities", 4, "Part 2+3"),
    ("Movies then and now", 4, "Part 2+3"),
    ("The history of transportation", 4, "Part 2+3"),
    # Part 2+3 (3 ☘️)
    ("Family Sport Day", 3, "Part 2+3"),
    ("Mae - The Math Girl", 3, "Part 2+3"),
    ("Cultural festival", 3, "Part 2+3"),
    ("College Welcoming Day", 3, "Part 2+3"),
    # Part 2+3 (2 ☘️)
    ("Public Transportations", 2, "Part 2+3"),
    ("Writing about a place", 2, "Part 2+3"),
    ("Music show at the park", 2, "Part 2+3"),
    # Part 4 (5 ☘️)
    ("childhood", 5, "Part 4"),
    ("Music festival", 5, "Part 4"),
    ("Games from childhood", 5, "Part 4"),
    ("Technology in childhood", 5, "Part 4"),
    # Part 4 (4 ☘️)
    ("Extreme sports", 4, "Part 4"),
    # Part 4 (3 ☘️)
    ("Childhood memories", 3, "Part 4"),
    ("Free time activity", 3, "Part 4"),
    ("Job and trainning", 3, "Part 4"),
    ("Volunteering", 3, "Part 4"),
    ("Career", 3, "Part 4"),
    # Part 5 (5 ☘️)
    ("Mountain", 5, "Part 5"),
    ("The arrival of four-day week", 5, "Part 5"),
    ("Women mathematicians", 5, "Part 5"),
    ("Mountain Summits", 5, "Part 5"),
]

for topic, target_stars, part_name in target_topics:
    matches = [e for e in exams if topic.lower() in e['title'].lower() and e['skill'] == 'READING']
    if not matches:
        matches = [e for e in exams if topic.lower() in e['title'].lower()]
    
    if matches:
        match_desc = ", ".join([f"'{m['title']}' (hot={m['hot_level']})" for m in matches[:2]])
        print(f"[{part_name}] '{topic}' -> FOUND {len(matches)} exams: {match_desc}")
    else:
        print(f"[{part_name}] '{topic}' -> NOT FOUND IN EXAMS!")
