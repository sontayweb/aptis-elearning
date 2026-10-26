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

print("--- PUBLISHED SPEAKING EXAMS ---")
res_pub_spk = run_sql("""
SELECT id, title, hot_level, count(p.id) as parts_cnt
FROM "Exam" e
LEFT JOIN "ExamPart" p ON p.exam_id = e.id
WHERE e.skill = 'SPEAKING' AND e.is_published = true
GROUP BY e.id, e.title, e.hot_level
ORDER BY e.title;
""")
lines = [l for l in res_pub_spk.split('\n') if l]
print(f"Total Published Speaking exams: {len(lines)}")
for l in lines[:40]:
    print("  ", l)
if len(lines) > 40:
    print(f"  ... and {len(lines) - 40} more")

print("\n--- SPEAKING PARTS STRUCTURE SAMPLE ---")
res_parts = run_sql("""
SELECT e.title, p.part_number, p.title, p.image_url
FROM "Exam" e
JOIN "ExamPart" p ON p.exam_id = e.id
WHERE e.skill = 'SPEAKING' AND e.is_published = true
ORDER BY e.title, p.part_number
LIMIT 20;
""")
for l in res_parts.split('\n'):
    print("  ", l)

ssh.close()
