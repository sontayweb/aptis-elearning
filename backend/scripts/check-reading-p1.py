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

print("--- ALL READING EXAMS WITH PART 1 ---")
sql = """
SELECT e.id, e.title, e.hot_level, p.part_number, p.title, count(q.id)
FROM "Exam" e
JOIN "ExamPart" p ON p.exam_id = e.id
LEFT JOIN "Question" q ON q.part_id = p.id
WHERE e.skill = 'READING' AND (p.part_number = 1 OR e.title ILIKE '%part 1%' OR p.title ILIKE '%part 1%')
GROUP BY e.id, e.title, e.hot_level, p.part_number, p.title
ORDER BY e.title, p.part_number;
"""
res = run_sql(sql)
lines = [l for l in res.split('\n') if l]
print(f"Total Reading exams with Part 1: {len(lines)}")
for l in lines[:40]:
    print("  ", l)
if len(lines) > 40:
    print(f"  ... and {len(lines) - 40} more")

print("\n--- CHECK FOR TITLES CONTAINING 'window, buy, market' OR SIMILAR WORDS ---")
res2 = run_sql("""
SELECT e.id, e.title, p.title
FROM "Exam" e
JOIN "ExamPart" p ON p.exam_id = e.id
WHERE e.skill = 'READING' AND (e.title ILIKE '%window%' OR e.title ILIKE '%market%' OR p.title ILIKE '%window%' OR p.title ILIKE '%market%');
""")
print(res2 if res2 else "No exams found with 'window' or 'market' in title!")

ssh.close()
