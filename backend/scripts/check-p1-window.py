import paramiko
import sys

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

print("--- EXAMS MATCHING PART 1 TITLES ---")
res = run_sql("""
SELECT id, title, is_published, hot_level
FROM "Exam"
WHERE skill = 'READING' AND (title ILIKE '%window%' OR title ILIKE '%buy%' OR title ILIKE '%market%' OR title ILIKE '%Reading Part 1%')
ORDER BY title;
""")
print(res if res else "None found in Exam table directly")

print("\n--- EXAMPARTS MATCHING PART 1 TITLES ---")
res2 = run_sql("""
SELECT e.id, e.title, p.part_number, p.title
FROM "Exam" e
JOIN "ExamPart" p ON p.exam_id = e.id
WHERE e.skill = 'READING' AND (p.title ILIKE '%window%' OR p.title ILIKE '%buy%' OR p.title ILIKE '%market%')
ORDER BY e.title;
""")
print(res2 if res2 else "None found in ExamPart table")

print("\n--- WHAT ABOUT EXAMS WITH 'Bộ Key READING PART1' ? ---")
res3 = run_sql("""
SELECT count(*), is_published FROM "Exam" WHERE title ILIKE 'Bộ Key READING PART1%' GROUP BY is_published;
""")
print(res3)

ssh.close()
