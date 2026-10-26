import paramiko
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def q(cmd):
    stdin, stdout, stderr = ssh.exec_command(f"docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -c \"{cmd}\"")
    return stdout.read().decode('utf-8', errors='replace').strip()

print("=== FINAL VERIFICATION ON VPS (103.90.227.117) ===")
print("1. Hot Exams count (hot_level > 0):", q("SELECT count(*) FROM \\\"Exam\\\" WHERE hot_level > 0;"))
print("   - 3☘️ Đề Tủ:", q("SELECT count(*) FROM \\\"Exam\\\" WHERE hot_level = 3;"))
print("   - 2☘️ Đề Hot:", q("SELECT count(*) FROM \\\"Exam\\\" WHERE hot_level = 2;"))
print("   - 1☘️ Ôn tập:", q("SELECT count(*) FROM \\\"Exam\\\" WHERE hot_level = 1;"))

print("\n2. Reading Part 1 simplified titles sample:")
r_p1 = q("SELECT title FROM \\\"Exam\\\" WHERE skill = 'READING' AND title ~* '^Đề [0-9]+$' ORDER BY title LIMIT 10;")
print("  ", r_p1.replace('\n', ', '))

print("\n3. Speaking Part 3 Dual Images count (with comma):", q("SELECT count(*) FROM \\\"ExamPart\\\" p JOIN \\\"Exam\\\" e ON p.exam_id = e.id WHERE e.skill = 'SPEAKING' AND (p.part_number = 3 OR p.title ILIKE '%part 3%') AND p.image_url ILIKE '%,%';"))
print("   Speaking Part 3 Single Images remaining:", q("SELECT count(*) FROM \\\"ExamPart\\\" p JOIN \\\"Exam\\\" e ON p.exam_id = e.id WHERE e.skill = 'SPEAKING' AND (p.part_number = 3 OR p.title ILIKE '%part 3%') AND p.image_url NOT ILIKE '%,%' AND p.image_url IS NOT NULL;"))

ssh.close()
