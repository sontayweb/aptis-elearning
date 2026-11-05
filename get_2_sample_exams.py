import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko
import json

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', timeout=10, look_for_keys=False, allow_agent=False)

query = """
SELECT json_agg(t) FROM (
    SELECT 
        e.id as exam_id,
        e.title as exam_title,
        e.skill,
        p.id as part_id,
        p.part_number,
        p.title as part_title,
        p.image_url,
        json_agg(json_build_object('num', q.question_number, 'prompt', q.prompt) ORDER BY q.question_number) as questions
    FROM "ExamPart" p
    JOIN "Exam" e ON p.exam_id = e.id
    JOIN "Question" q ON q.part_id = p.id
    WHERE e.title IN ('Công viên giải trí', 'Vội vàng') AND p.part_number IN (2, 3)
    GROUP BY e.id, e.title, e.skill, p.id, p.part_number, p.title, p.image_url
    ORDER BY e.title, e.skill, p.part_number
) t;
"""

cmd = "docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A"
stdin, stdout, stderr = ssh.exec_command(cmd)
stdin.write(query)
stdin.channel.shutdown_write()

output = stdout.read().decode('utf-8').strip()
ssh.close()

data = json.loads(output)
print(json.dumps(data, ensure_ascii=False, indent=2))

