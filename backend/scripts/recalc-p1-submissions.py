import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
UPDATE "ExamSubmission" s
SET total_score = sub.calc_score,
    reading_score = sub.calc_score
FROM (
    SELECT sa.submission_id, SUM(sa.score) as calc_score
    FROM "SubmissionAnswer" sa
    GROUP BY sa.submission_id
) sub
WHERE s.id = sub.submission_id
  AND s.exam_id IN (
    SELECT e.id FROM "Exam" e
    JOIN "ExamPart" ep ON ep.exam_id = e.id
    WHERE e.skill = 'READING' AND (ep.title ILIKE '%Part 1%' OR ep.title ILIKE '%Sentence comprehension%')
    GROUP BY e.id
    HAVING count(ep.id) = 1
  );

SELECT s.id, s.total_score, s.reading_score, s.submitted_at
FROM "ExamSubmission" s
WHERE s.exam_id = 'aebb3f72-9280-4bc7-a9cc-d503c46b08be';
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/recalc2.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = "docker cp /tmp/recalc2.sql wlafe5vr5fwx6rn3curavktm:/tmp/recalc2.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/recalc2.sql"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8'))
ssh.close()
