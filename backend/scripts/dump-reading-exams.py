import sys
import paramiko
import json

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
    return out

sql = """
SELECT e.id, e.title, e.is_published, e.hot_level, count(p.id) as part_count, string_agg(p.part_number || ':' || coalesce(p.title, ''), '; ') as parts
FROM "Exam" e
LEFT JOIN "ExamPart" p ON p.exam_id = e.id
WHERE e.skill = 'READING'
GROUP BY e.id, e.title, e.is_published, e.hot_level
ORDER BY e.title;
"""

rows = run_sql(sql)
exams = []
for line in rows.strip().split('\n'):
    if not line.strip(): continue
    parts = line.split('|||')
    if len(parts) >= 6:
        exams.append({
            'id': parts[0],
            'title': parts[1],
            'is_published': parts[2] == 't',
            'hot_level': int(parts[3] or 0),
            'part_count': int(parts[4] or 0),
            'parts': parts[5]
        })

print(f"Total Reading Exams in VPS DB: {len(exams)}")
published = [e for e in exams if e['is_published']]
print(f"Published: {len(published)}, Unpublished: {len(exams) - len(published)}")

# Group by type of title
print("\n--- SAMPLE PUBLISHED TITLES ---")
for e in published[:25]:
    print(f"[{e['hot_level']}☘️] {e['title']} (parts: {e['part_count']})")

print("\n--- SAMPLE UNPUBLISHED TITLES ---")
for e in [x for x in exams if not x['is_published']][:25]:
    print(f"[{e['hot_level']}☘️] {e['title']} (parts: {e['part_count']})")

with open('backend/scripts/vps_reading_exams.json', 'w', encoding='utf-8') as f:
    json.dump(exams, f, ensure_ascii=False, indent=2)

ssh.close()
