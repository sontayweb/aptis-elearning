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

print("--- EXAMS WITH 'Reading Part 1' or 'Part 1' in Exam Title ---")
res = run_sql("""
SELECT id, title, is_published, hot_level
FROM "Exam"
WHERE skill = 'READING' AND (title ILIKE '%Reading Part 1%' OR title ILIKE '%Bộ Key READING PART1%')
ORDER BY title;
""")
for l in res.split('\n')[:35]:
    print("  ", l)

print("\n--- PARTS INSIDE 'Đề Thi Thử Reading – Bộ Đề Tủ Part 1 (Gap Fill)' ---")
res2 = run_sql("""
SELECT e.id, e.title, p.part_number, p.title
FROM "Exam" e
JOIN "ExamPart" p ON p.exam_id = e.id
WHERE e.title ILIKE '%Bộ Đề Tủ Part 1%'
ORDER BY e.title, p.part_number;
""")
for l in res2.split('\n'):
    print("  ", l)

print("\n--- HOW MANY TOTAL READING EXAMS BY PATTERN ---")
res3 = run_sql("""
SELECT 
  case 
    when title ~* '^Đề [0-9]+' then 'Đề XX (Standard Bundled/Single)'
    when title ILIKE 'Bộ Key READING PART1%' then 'Bộ Key READING PART1'
    when title ILIKE '%Bộ Đề Tủ%' then 'Bộ Đề Tủ'
    else 'Other / Topic name'
  end as cat,
  count(*),
  sum(case when hot_level > 0 then 1 else 0 end) as hot_cnt
FROM "Exam"
WHERE skill = 'READING'
GROUP BY 1
ORDER BY 2 DESC;
""")
for l in res3.split('\n'):
    print("  ", l)

ssh.close()
