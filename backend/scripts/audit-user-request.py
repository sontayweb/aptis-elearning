import paramiko
import sys
import json

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

print("=== 1. OVERVIEW OF SKILLS IN DB ===")
print(run_sql('SELECT skill, count(*), sum(case when hot_level > 0 then 1 else 0 end) as hot_cnt FROM "Exam" GROUP BY skill ORDER BY skill;'))

print("\n=== 2. READING EXAMS TITLES & HOT LEVELS ===")
reading_exams_raw = run_sql('SELECT id, title, hot_level, forecast_tag FROM "Exam" WHERE skill = \'READING\' ORDER BY title;')
reading_exams = []
for line in reading_exams_raw.split('\n'):
    if line:
        parts = line.split('|||')
        reading_exams.append({'id': parts[0], 'title': parts[1], 'hot_level': parts[2] if len(parts) > 2 else '0', 'tag': parts[3] if len(parts) > 3 else ''})

print(f"Total Reading Exams: {len(reading_exams)}")
for ex in reading_exams[:20]:
    print(f"  [{ex['hot_level']}☘️] {ex['title']} (tag: {ex['tag']})")
if len(reading_exams) > 20:
    print(f"  ... and {len(reading_exams) - 20} more")

print("\n=== 3. READING EXAM PARTS (Titles, Part Numbers) ===")
reading_parts_sample = run_sql('SELECT e.title, p.part_number, p.title, count(q.id) FROM "Exam" e JOIN "ExamPart" p ON p.exam_id = e.id LEFT JOIN "Question" q ON q.part_id = p.id WHERE e.skill = \'READING\' GROUP BY e.title, p.part_number, p.title ORDER BY e.title, p.part_number LIMIT 25;')
for l in reading_parts_sample.split('\n')[:25]:
    print("  ", l)

print("\n=== 4. SEARCH FOR SPECIFIC TOPICS MENTIONED BY USER IN READING ===")
topics_to_search = [
    'Film', 'singer', 'famous singer', 'new coffee', 'coffee shop', 'busy coffee', 'End of term',
    'American woman', 'Weekend activities', 'Movies then and now', 'transportation',
    'Family Sport', 'Mae', 'Math Girl', 'Cultural festival', 'College Welcoming',
    'Public Transportation', 'Writing about a place', 'Music show',
    'childhood', 'Music festival', 'Games from childhood', 'Technology in childhood', 'Extreme sports',
    'Childhood memories', 'Free time', 'Job and training', 'Volunteering', 'Career',
    'Mountain', 'four-day week', 'Women mathematician', 'Woman Mathematics'
]

for t in topics_to_search:
    found = run_sql(f'SELECT e.id, e.title, p.part_number, p.title, e.hot_level FROM "Exam" e JOIN "ExamPart" p ON p.exam_id = e.id WHERE (e.title ILIKE \'%{t}%\' OR p.title ILIKE \'%{t}%\' OR p.passage_text ILIKE \'%{t}%\') AND e.skill = \'READING\' LIMIT 3;')
    if found:
        print(f"Topic '{t}':")
        for f in found.split('\n'):
            print(f"    -> {f}")

print("\n=== 5. SPEAKING EXAMS OVERVIEW ===")
spk_raw = run_sql('SELECT id, title, hot_level FROM "Exam" WHERE skill = \'SPEAKING\' ORDER BY title LIMIT 20;')
for l in spk_raw.split('\n')[:20]:
    print("  ", l)

print("\n=== 6. SPEAKING PART 3 IMAGES AUDIT ===")
spk_p3 = run_sql('SELECT e.title, p.part_number, p.title, p.image_url FROM "Exam" e JOIN "ExamPart" p ON p.exam_id = e.id WHERE e.skill = \'SPEAKING\' AND (p.part_number = 3 OR p.title ILIKE \'%part 3%\') ORDER BY e.title LIMIT 15;')
for l in spk_p3.split('\n')[:15]:
    print("  ", l)

ssh.close()
