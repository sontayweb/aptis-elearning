import sys
import paramiko

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def run_sql(sql):
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/inspect_tmp.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    cmd = 'docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" < /tmp/inspect_tmp.sql'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if err and "ERROR" in err:
        print("SQL ERROR:", err)
    return out

print("=== 1. READING EXAMS AUDIT ===")
sql_r = """SELECT is_published, count(*) FROM "Exam" WHERE skill = 'READING' GROUP BY is_published;"""
print("Reading published breakdown:\n", run_sql(sql_r))

sql_r_titles = """SELECT id, title, is_published, hot_level FROM "Exam" WHERE skill = 'READING' ORDER BY title LIMIT 30;"""
print("Sample Reading Exams:\n", run_sql(sql_r_titles))

print("\n=== 2. READING PART 1 AUDIT ===")
sql_p1 = """SELECT count(*) FROM "Exam" WHERE skill = 'READING' AND (title ILIKE '%part 1%' OR title ILIKE '%part1%');"""
print("Total Part 1 exams count:", run_sql(sql_p1).strip())

sql_p1_sample = """SELECT id, title, is_published, hot_level FROM "Exam" WHERE skill = 'READING' AND (title ILIKE '%part 1%' OR title ILIKE '%part1%') LIMIT 15;"""
print("Part 1 sample:\n", run_sql(sql_p1_sample))

print("\n=== 3. SPEAKING PART 2 AUDIT (TRANH TRONG DIEM) ===")
sql_spk_p2 = """
SELECT e.id, e.title, e.is_published, count(q.id) as q_cnt, count(q.image_url) as img_cnt
FROM "Exam" e
LEFT JOIN "ExamPart" p ON p.exam_id = e.id
LEFT JOIN "Question" q ON q.part_id = p.id
WHERE e.skill = 'SPEAKING' AND (p.part_number = 2 OR e.title ILIKE '%part 2%')
GROUP BY e.id, e.title, e.is_published
LIMIT 20;
"""
print("Speaking Part 2 sample:\n", run_sql(sql_spk_p2))

print("\n=== 4. SPEAKING PART 3 AUDIT (2 TRANH) ===")
sql_spk_p3 = """
SELECT count(*) as total_p3,
       count(CASE WHEN q.image_url ILIKE '%,%' OR q.image_url ILIKE '%img2%' THEN 1 END) as has_2_imgs
FROM "ExamPart" p
JOIN "Question" q ON q.part_id = p.id
JOIN "Exam" e ON e.id = p.exam_id
WHERE e.skill = 'SPEAKING' AND p.part_number = 3;
"""
print("Speaking Part 3 image stats:\n", run_sql(sql_spk_p3))

ssh.close()
