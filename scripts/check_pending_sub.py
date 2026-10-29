import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

VPS_HOST = "103.90.227.117"
VPS_USER = "root"
VPS_PASS = "Taovipko0!"
CONTAINER = "wlafe5vr5fwx6rn3curavktm"
DB_NAME = "aptis_kytich_db"

def run_sql(sql):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS, timeout=15)
    cmd = f'docker exec -i {CONTAINER} psql -U postgres -d {DB_NAME}'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    stdin.write(sql + "\n")
    stdin.flush()
    stdin.channel.shutdown_write()
    out = stdout.read().decode('utf-8', errors='replace')
    ssh.close()
    return out

print(run_sql("""
SELECT sa.id, sa.question_id, q.question_number, q.prompt, q.correct_answer, sa.selected_option, sa.text_answer, sa.score
FROM "SubmissionAnswer" sa
JOIN "Question" q ON q.id = sa.question_id
WHERE sa.submission_id = 'd23f6219-0cc2-49a8-a6b1-317bf527b22e'
ORDER BY q.question_number;
"""))
