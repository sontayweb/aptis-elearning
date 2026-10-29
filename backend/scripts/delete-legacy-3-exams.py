import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

cmd = """docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -c "DELETE FROM \\"Exam\\" WHERE id IN ('74a44505-042d-4c5f-a389-96119ea141f8', '2af70e13-bbb4-4517-a1a4-3ef6f569200d', 'bbf71993-e8af-4173-aa54-16eb6a61e83c');" """
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8'))

# Kiểm tra lại số lượng câu hỏi trắc nghiệm rác
cmd_check = """docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -c "SELECT count(*) FROM \\"Question\\" q JOIN \\"ExamPart\\" p ON q.part_id = p.id JOIN \\"Exam\\" e ON p.exam_id = e.id WHERE q.question_type = 'MULTIPLE_CHOICE' AND (q.options IS NULL OR q.options = '[]'::jsonb OR q.correct_answer IS NULL OR q.correct_answer = '');" """
stdin, stdout, stderr = ssh.exec_command(cmd_check)
print("Số câu trắc nghiệm rỗng còn lại:", stdout.read().decode('utf-8').strip())

ssh.close()
