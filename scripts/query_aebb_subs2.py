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

print("Submissions for aebb3f72-9280-4bc7-a9cc-d503c46b08be:")
print(run_sql("""
SELECT id, user_id, reading_score, total_score, status, submitted_at 
FROM "ExamSubmission" 
WHERE exam_id = 'aebb3f72-9280-4bc7-a9cc-d503c46b08be' 
ORDER BY submitted_at DESC;
"""))

print("Submission Answers:")
print(run_sql("""
SELECT sa.id, sa.submission_id, q.question_number, q.prompt, q.correct_answer, sa.selected_option, sa.text_answer, sa.score
FROM "SubmissionAnswer" sa
JOIN "ExamSubmission" es ON es.id = sa.submission_id
JOIN "Question" q ON q.id = sa.question_id
WHERE es.exam_id = 'aebb3f72-9280-4bc7-a9cc-d503c46b08be'
ORDER BY es.submitted_at DESC, q.question_number ASC;
"""))
