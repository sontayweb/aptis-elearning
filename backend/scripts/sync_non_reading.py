import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

dump_sql = """
COPY (
    SELECT q.id, q.prompt, q.options, q.correct_answer, q.max_score, q.explanation
    FROM "Question" q
    JOIN "ExamPart" ep ON q.part_id = ep.id
    JOIN "Exam" e ON ep.exam_id = e.id
    WHERE e.skill != 'READING'
) TO '/tmp/non_reading_questions.csv' WITH (FORMAT csv, HEADER true);
"""

restore_sql = """
CREATE TEMP TABLE temp_restore_q (
    id text,
    prompt text,
    options jsonb,
    correct_answer text,
    max_score double precision,
    explanation text
);

COPY temp_restore_q FROM '/tmp/non_reading_questions.csv' WITH (FORMAT csv, HEADER true);

UPDATE "Question" q
SET 
    prompt = t.prompt,
    options = t.options,
    correct_answer = t.correct_answer,
    max_score = t.max_score,
    explanation = t.explanation
FROM temp_restore_q t
WHERE q.id = t.id;

SELECT count(*) as restored_count FROM temp_restore_q;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/export_nr.sql', 'wb') as f:
    f.write(dump_sql.encode('utf-8'))
with sftp.file('/tmp/import_nr.sql', 'wb') as f:
    f.write(restore_sql.encode('utf-8'))
sftp.close()

# 1. Export from aptis_temp_db
cmd1 = "docker cp /tmp/export_nr.sql wlafe5vr5fwx6rn3curavktm:/tmp/export_nr.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_temp_db -f /tmp/export_nr.sql"
stdin, stdout, stderr = ssh.exec_command(cmd1)
print("EXPORT OUT:", stdout.read().decode('utf-8', errors='replace'))
print("EXPORT ERR:", stderr.read().decode('utf-8', errors='replace'))

# 2. Import into aptis_kytich_db
cmd2 = "docker cp /tmp/import_nr.sql wlafe5vr5fwx6rn3curavktm:/tmp/import_nr.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/import_nr.sql"
stdin, stdout, stderr = ssh.exec_command(cmd2)
print("IMPORT OUT:", stdout.read().decode('utf-8', errors='replace'))
print("IMPORT ERR:", stderr.read().decode('utf-8', errors='replace'))

# 3. Verify in aptis_kytich_db that non-reading has 0 fixedSentence
verify_sql = """
SELECT e.skill, count(q.id)
FROM "Exam" e 
JOIN "ExamPart" ep ON ep.exam_id = e.id 
JOIN "Question" q ON q.part_id = ep.id 
WHERE e.skill != 'READING' AND q.options::text ILIKE '%fixedSentence%'
GROUP BY e.skill;
"""
cmd3 = f"docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -c \"{verify_sql}\""
stdin, stdout, stderr = ssh.exec_command(cmd3)
print("VERIFY NON-READING FIXED SENTENCE:")
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
