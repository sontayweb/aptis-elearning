import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

    cmd = """docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -c "
    SELECT 
      e.skill,
      count(*) as total_questions,
      count(*) FILTER (WHERE q.correct_answer ~ '^[0-9a-f]{8}-[0-9a-f]{4}') as uuid_answers,
      count(*) FILTER (WHERE q.correct_answer IS NULL OR q.correct_answer = '') as empty_answers,
      count(*) FILTER (WHERE q.correct_answer !~ '^[0-9a-f]{8}-[0-9a-f]{4}' AND q.correct_answer IS NOT NULL AND q.correct_answer != '') as valid_text_answers
    FROM \\"Question\\" q
    JOIN \\"ExamPart\\" p ON q.part_id = p.id
    JOIN \\"Exam\\" e ON p.exam_id = e.id
    WHERE (p.title ILIKE '%part 4%' OR p.part_number = 4)
      AND (e.skill = 'LISTENING' OR (e.skill = 'FULL_TEST' AND (p.title ILIKE '%listen%' OR p.title ILIKE '%nghe%')))
    GROUP BY e.skill;
    " """
    
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    print("STDOUT:\n", out)
    if err:
        print("STDERR:\n", err)
    ssh.close()

if __name__ == '__main__':
    main()
