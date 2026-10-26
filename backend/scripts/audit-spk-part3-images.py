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

print("--- AUDIT ALL SPEAKING PART 3 IMAGES ON VPS ---")
res = run_sql("""
SELECT 
    case 
        when p.image_url IS NULL OR p.image_url = '' then '1. No image (NULL/empty)'
        when p.image_url ILIKE '%,%' then '3. Dual images (has comma)'
        else '2. Single image (no comma)'
    end as img_status,
    count(*),
    sum(case when e.is_published then 1 else 0 end) as published_cnt
FROM "ExamPart" p
JOIN "Exam" e ON p.exam_id = e.id
WHERE e.skill = 'SPEAKING' AND (p.part_number = 3 OR p.title ILIKE '%part 3%' OR p.title ILIKE '%compare%')
GROUP BY 1
ORDER BY 1;
""")
print(res)

print("\n--- SAMPLE OF NO IMAGE OR SINGLE IMAGE IN SPEAKING PART 3 ---")
res2 = run_sql("""
SELECT e.id, e.title, e.is_published, p.part_number, p.title, p.image_url
FROM "ExamPart" p
JOIN "Exam" e ON p.exam_id = e.id
WHERE e.skill = 'SPEAKING' AND (p.part_number = 3 OR p.title ILIKE '%part 3%' OR p.title ILIKE '%compare%') AND (p.image_url NOT ILIKE '%,%' OR p.image_url IS NULL)
ORDER BY e.is_published DESC, e.title
LIMIT 30;
""")
print(res2 if res2 else "All Speaking Part 3 have dual images!")

ssh.close()
