with open('frontend/src/data/speaking-part1-bank.ts', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('unit: string;\n  description: string;', 'unit: string;\n  title: string;\n  description: string;')

import re
text = re.sub(r'"unit":\s*"([^"]+)",', r'"unit": "\1",\n    "title": "\1",', text)

with open('frontend/src/data/speaking-part1-bank.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated speaking-part1-bank.ts with title property')
