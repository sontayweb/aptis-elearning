import re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('frontend/src/data/speaking-part2-bank.ts', 'r', encoding='utf-8') as f:
    text = f.read()

titles = re.findall(r'"title":\s*"([^"]+)"', text)
print("Part 2 count:", len(titles))
print("First 5:", titles[:5])
print("Last 5:", titles[-5:])

with open('frontend/src/data/speaking-part1-bank.ts', 'r', encoding='utf-8') as f:
    text_p1 = f.read()

units_p1 = re.findall(r'"unit":\s*"([^"]+)"', text_p1)
print("Part 1 units count:", len(units_p1))
print("Part 1 units:", units_p1)

with open('frontend/src/data/speaking-part3-bank.ts', 'r', encoding='utf-8') as f:
    text_p3 = f.read()

topics_p3 = re.findall(r'"title":\s*"([^"]+)"', text_p3)
print("Part 3 topics count:", len(topics_p3))
print("Part 3 topics:", topics_p3)
