import paramiko
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

    cmd = """docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -c "
    SELECT 
      p.part_number,
      count(*) as count,
      min(p.title) as sample_title
    FROM \\"Question\\" q
    JOIN \\"ExamPart\\" p ON q.part_id = p.id
    JOIN \\"Exam\\" e ON p.exam_id = e.id
    WHERE e.skill = 'LISTENING'
      AND q.correct_answer ~ '^[0-9a-f]{8}-[0-9a-f]{4}'
    GROUP BY p.part_number
    ORDER BY p.part_number;
    " """
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    print("STDOUT:\n", out)
    ssh.close()

if __name__ == '__main__':
    main()
