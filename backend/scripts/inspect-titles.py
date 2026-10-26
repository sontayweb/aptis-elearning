import json
import sys
import re

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open('backend/scripts/vps_exams_list.json', 'r', encoding='utf-8') as f:
    exams = json.load(f)

# Reading Part 1 titles
print("=== READING PART 1 TITLES ===")
p1_reading = [e for e in exams if e['skill'] == 'READING' and ('part 1' in e['title'].lower() or 'p1' in e['title'].lower())]
for e in p1_reading:
    print(f"ID: {e['id']} | Old: '{e['title']}'")

print("\n=== SPEAKING EXAMS SAMPLE TITLES ===")
sp_exams = [e for e in exams if e['skill'] == 'SPEAKING']
for e in sp_exams[:20]:
    print(f"ID: {e['id']} | Old: '{e['title']}'")
