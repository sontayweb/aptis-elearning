import json
import re
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open('backend/scripts/vps_parts_list.json', 'r', encoding='utf-8') as f:
    parts = json.load(f)

sp_p3 = [p for p in parts if p['skill'] == 'SPEAKING' and (p['part_number'] == 3 or 'part 3' in p['title'].lower())]
single_imgs = [p for p in sp_p3 if p['image_url'] and ',' not in p['image_url']]

print(f"Total Speaking Part 3s with single image: {len(single_imgs)}")

# Check image pattern
pairable = []
other = []
for p in single_imgs:
    img = p['image_url'].strip()
    # match image([0-9]+)\.(png|jpg)
    m = re.search(r'image(\d+)\.(png|jpg)', img)
    if m:
        num = m.group(1)
        ext = m.group(2)
        pairable.append({
            'part_id': p['id'],
            'exam_title': p['exam_title'],
            'part_title': p['title'],
            'current': img,
            'suggested': f"/uploads/speaking/part3/image{num}_1.png, /uploads/speaking/part3/image{num}_2.png" if int(num) in [6, 9, 10, 11, 12, 13, 14, 15] else f"{img}, /uploads/speaking/part3/image{num}_2.png"
        })
    else:
        other.append(p)

print(f"Pattern matched pairable: {len(pairable)}")
print(f"Other patterns: {len(other)}")

for item in pairable[:15]:
    print(f"Part ID: {item['part_id']} | Exam: {item['exam_title'][:40]} | Cur: {item['current']} -> Suggested: {item['suggested']}")

with open('backend/scripts/part3_single_images_audit.json', 'w', encoding='utf-8') as f:
    json.dump(pairable + other, f, ensure_ascii=False, indent=2)

print("\nAudit saved to backend/scripts/part3_single_images_audit.json")
