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

print("=== SPEAKING PART 2 AUDIT ===")
sql_spk_p2 = """
SELECT count(*) as total_p2_parts,
       count(CASE WHEN p.image_url IS NOT NULL AND p.image_url != '' THEN 1 END) as has_image,
       count(CASE WHEN e.is_published = true THEN 1 END) as published_exams
FROM "ExamPart" p
JOIN "Exam" e ON e.id = p.exam_id
WHERE e.skill = 'SPEAKING' AND (p.part_number = 2 OR e.title ILIKE '%part 2%');
"""
print(run_sql(sql_spk_p2))

sql_spk_p2_no_img = """
SELECT e.id, e.title, p.image_url, e.is_published
FROM "ExamPart" p
JOIN "Exam" e ON e.id = p.exam_id
WHERE e.skill = 'SPEAKING' AND (p.part_number = 2 OR e.title ILIKE '%part 2%') AND (p.image_url IS NULL OR p.image_url = '')
LIMIT 10;
"""
print("Speaking Part 2 WITHOUT image:\n", run_sql(sql_spk_p2_no_img))

print("\n=== SPEAKING PART 3 AUDIT (2 TRANH) ===")
sql_spk_p3 = """
SELECT count(*) as total_p3,
       count(CASE WHEN p.image_url ILIKE '%,%' OR p.image_url ILIKE '%img2%' THEN 1 END) as has_2_imgs,
       count(CASE WHEN p.image_url NOT ILIKE '%,%' AND p.image_url NOT ILIKE '%img2%' AND p.image_url IS NOT NULL THEN 1 END) as only_1_img,
       count(CASE WHEN p.image_url IS NULL OR p.image_url = '' THEN 1 END) as no_img
FROM "ExamPart" p
JOIN "Exam" e ON e.id = p.exam_id
WHERE e.skill = 'SPEAKING' AND p.part_number = 3;
"""
print(run_sql(sql_spk_p3))

sql_spk_p3_single = """
SELECT e.id, e.title, p.image_url, e.is_published
FROM "ExamPart" p
JOIN "Exam" e ON e.id = p.exam_id
WHERE e.skill = 'SPEAKING' AND p.part_number = 3 AND (p.image_url NOT ILIKE '%,%' AND p.image_url NOT ILIKE '%img2%')
LIMIT 10;
"""
print("Speaking Part 3 single or no img:\n", run_sql(sql_spk_p3_single))

print("\n=== READING PART 2 AUDIT ===")
sql_r_p2 = """
SELECT count(*) as total,
       count(CASE WHEN is_published = true THEN 1 END) as published,
       count(CASE WHEN is_published = false THEN 1 END) as unpublished
FROM "Exam"
WHERE skill = 'READING' AND (title ILIKE '%part 2%' OR title ILIKE '%part2%');
"""
print(run_sql(sql_r_p2))

ssh.close()
