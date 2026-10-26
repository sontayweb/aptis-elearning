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

print("--- EXAMS WITH 'Đề XX' IN READING ---")
res = run_sql("""
SELECT id, title, is_published, hot_level
FROM "Exam"
WHERE skill = 'READING' AND title ~* '^Đề [0-9]+'
ORDER BY title;
""")
lines = [l for l in res.split('\n') if l]
print(f"Count: {len(lines)}")
for l in lines[:50]:
    print("  ", l)

print("\n--- CHECK SPEAKING EXAM TITLES ---")
res_spk = run_sql("""
SELECT id, title, is_published, hot_level
FROM "Exam"
WHERE skill = 'SPEAKING'
ORDER BY title;
""")
spk_lines = [l for l in res_spk.split('\n') if l]
print(f"Total Speaking exams: {len(spk_lines)}")
for l in spk_lines[:40]:
    print("  ", l)

ssh.close()
