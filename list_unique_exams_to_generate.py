import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko
import json

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', timeout=10, look_for_keys=False, allow_agent=False)

# Let's get the list of exams that were in FULL_TEST with thithuaptis.com
# We can find them from our backup or by checking exams with titles matching
query = """
SELECT json_agg(t) FROM (
    SELECT 
        e.id as exam_id,
        e.title as exam_title,
        p.id as part_id,
        p.part_number,
        p.title as part_title,
        (SELECT prompt FROM "Question" WHERE part_id = p.id AND question_number = 1) as q1,
        (SELECT prompt FROM "Question" WHERE part_id = p.id AND question_number = 2) as q2,
        (SELECT prompt FROM "Question" WHERE part_id = p.id AND question_number = 3) as q3
    FROM "ExamPart" p
    JOIN "Exam" e ON p.exam_id = e.id
    WHERE e.skill = 'FULL_TEST' AND p.part_number IN (2, 3)
      AND (
          p.image_url LIKE '%thithuaptis.com%' 
          OR p.id IN (
              SELECT (t->>'broken_pid')::uuid 
              FROM json_array_elements(pg_read_file('/root/backup_exampart_before_image_heal_20261105_181841.sql')::json) t
          )
      )
    ORDER BY e.title, p.part_number
) t;
"""

# Let's write a simpler query that inspects all FULL_TEST exams that have part 2 or 3
simple_query = """
SELECT json_agg(t) FROM (
    SELECT 
        e.id as exam_id,
        e.title as exam_title,
        p.id as part_id,
        p.part_number,
        p.image_url,
        (SELECT prompt FROM "Question" WHERE part_id = p.id AND question_number = 1) as q1,
        (SELECT prompt FROM "Question" WHERE part_id = p.id AND question_number = 2) as q2,
        (SELECT prompt FROM "Question" WHERE part_id = p.id AND question_number = 3) as q3
    FROM "ExamPart" p
    JOIN "Exam" e ON p.exam_id = e.id
    WHERE e.skill = 'FULL_TEST' AND p.part_number IN (2, 3)
      AND (p.image_url LIKE '%/uploads/speaking/%' OR p.image_url LIKE '%thithuaptis.com%')
    ORDER BY e.title, p.part_number
) t;
"""

cmd = "docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A"
stdin, stdout, stderr = ssh.exec_command(cmd)
stdin.write(simple_query)
stdin.channel.shutdown_write()

output = stdout.read().decode('utf-8').strip()
ssh.close()

data = json.loads(output)
print(f"Total parts found: {len(data)}")

# Group by exam
exams = {}
for d in data:
    t = d['exam_title']
    if t not in exams:
        exams[t] = []
    exams[t].append(d)

print(f"Total unique exams: {len(exams)}")
for title, parts in list(exams.items())[:10]:
    print(f"\nExam: '{title}'")
    for p in parts:
        print(f"  Part {p['part_number']} | Q1: {p['q1']} | Q2: {p['q2']}")

