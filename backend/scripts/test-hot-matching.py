import paramiko
import sys
import json
import re

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def run_sql(sql):
    escaped_sql = sql.replace('"', '\\"')
    cmd = f'docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" -c "{escaped_sql}"'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    return out

# List all Reading exams to do exact and fuzzy matching
res = run_sql('SELECT id, title, hot_level, is_published FROM "Exam" WHERE skill = \'READING\' ORDER BY title;')
exams = []
for line in res.split('\n'):
    if line:
        parts = line.split('|||')
        exams.append({'id': parts[0], 'title': parts[1], 'hot_level': int(parts[2] or 0), 'is_published': parts[3] == 't'})

print(f"Total Reading Exams on VPS: {len(exams)}")

# Target updates definition
rules = [
    # -------------------------------------------------------------
    # READING PART 2+3:
    # -------------------------------------------------------------
    # 5 Cỏ:
    (5, [
        "film", "singer", "the famous singer", "a famous singer", "famous singer",
        "new coffee shop", "my visit to a new coffee shop", "busy coffee shop", "busy coffee",
        "end of term project"
    ]),
    # 4 Cỏ:
    (4, [
        "the first american woman in space", "weekend activities", "movies then and now",
        "the history of transportation"
    ]),
    # 3 Cỏ:
    (3, [
        "family sport day", "family sports day", "mae - the math girl", "mae",
        "cultural festival", "college welcoming day"
    ]),
    # 2 Cỏ:
    (2, [
        "public transportations", "public transportation", "writing about a place",
        "music show at the park", "music show"
    ]),

    # -------------------------------------------------------------
    # READING PART 4 (Opinion Matching):
    # -------------------------------------------------------------
    # 5 Cỏ:
    (5, [
        "childhood", "music festival", "games from childhood", "technology in childhood"
    ]),
    # 4 Cỏ:
    (4, [
        "extreme sports"
    ]),
    # 3 Cỏ:
    (3, [
        "childhood memories", "free time activity", "free time", "job and trainning",
        "job and training", "volunteering", "career"
    ]),

    # -------------------------------------------------------------
    # READING PART 4 (Long Reading):
    # -------------------------------------------------------------
    # 5 Cỏ:
    (5, [
        "mountain", "the arrival of four-day week", "four-day week",
        "women mathematicians", "woman mathematics", "mountain summits", "mountain submmits"
    ])
]

updates = {} # exam_id -> (new_hot_level, title)

for e in exams:
    t_lower = e['title'].lower()
    
    # Check matching rules (highest hot_level first if multiple match)
    matched_level = None
    for level, keywords in rules:
        for kw in keywords:
            if kw in t_lower:
                if matched_level is None or level > matched_level:
                    matched_level = level

    if matched_level is not None:
        updates[e['id']] = (matched_level, e['title'])

print(f"\nTotal exams matched for hot_level update: {len(updates)}")
for eid, (lvl, title) in list(updates.items())[:30]:
    print(f"  [{lvl}☘️] {title}")

# Also check Part 1 exams to publish
p1_to_publish = [e for e in exams if 'reading part1' in e['title'].lower() or 'reading part 1' in e['title'].lower() or re.match(r'^đề \d+$', e['title'].lower())]
print(f"\nPart 1 exams to ensure published: {len(p1_to_publish)}")

ssh.close()
