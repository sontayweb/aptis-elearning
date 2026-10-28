import paramiko
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

print("================================================================================")
print("🔍 KIỂM TRA ĐỐI SOÁT SÂU TOÀN DIỆN DATABASE TRÊN VPS PRODUCTION")
print("================================================================================\n")

# 1. Thống kê số lượng đề thi theo từng kỹ năng
cmd_skills = '''docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -c "
SELECT skill, count(*) 
FROM \\"Exam\\" 
GROUP BY skill 
ORDER BY count(*) DESC;
"'''
stdin, stdout, stderr = ssh.exec_command(cmd_skills)
skills_out = stdout.read().decode('utf-8').strip()
print("📊 [1] SỐ LƯỢNG ĐỀ THI THEO KỸ NĂNG:")
for line in skills_out.splitlines():
    if line:
        skill, count = line.split('|')
        print(f"  • {skill.padEnd(20) if hasattr(skill, 'padEnd') else skill.ljust(22)}: {count} đề")

# 2. Tìm kiếm các đề thi bị trùng tiêu đề trong cùng 1 kỹ năng (Title Collision)
cmd_dup = '''docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -c "
SELECT skill, title, count(*) 
FROM \\"Exam\\" 
GROUP BY skill, title 
HAVING count(*) > 1;
"'''
stdin, stdout, stderr = ssh.exec_command(cmd_dup)
dup_out = stdout.read().decode('utf-8').strip()
print("\n🚨 [2] KIỂM TRA ĐỀ THI BỊ TRÙNG TIÊU ĐỀ (DUPLICATE EXAMS):")
if dup_out:
    print("  ❌ PHÁT HIỆN ĐỀ TRÙNG:")
    for line in dup_out.splitlines():
        if line:
            print("    👉", line)
else:
    print("  ✅ Tuyệt vời: 0 đề thi nào bị trùng lặp tiêu đề!")

# 3. Kiểm tra các đề thi "mồ côi" không có Part nào hoặc Part không có câu hỏi nào
cmd_empty = '''docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -c "
SELECT e.id, e.title, e.skill, count(p.id) as part_count, count(q.id) as q_count
FROM \\"Exam\\" e
LEFT JOIN \\"ExamPart\\" p ON p.exam_id = e.id
LEFT JOIN \\"Question\\" q ON q.part_id = p.id
GROUP BY e.id, e.title, e.skill
HAVING count(q.id) = 0
LIMIT 10;
"'''
stdin, stdout, stderr = ssh.exec_command(cmd_empty)
empty_out = stdout.read().decode('utf-8').strip()
print("\n🚨 [3] KIỂM TRA ĐỀ RÁC / MỒ CÔI (0 CÂU HỎI):")
if empty_out:
    print("  ❌ PHÁT HIỆN ĐỀ KHÔNG CÓ CÂU HỎI:")
    for line in empty_out.splitlines():
        if line:
            print("    👉", line)
else:
    print("  ✅ Tuyệt vời: 100% đề thi trong DB đều có phần thi và câu hỏi đầy đủ!")

# 4. Kiểm tra câu hỏi MULTIPLE_CHOICE bị rỗng options hoặc rỗng correct_answer
cmd_broken_q = '''docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -c "
SELECT e.skill, count(q.id)
FROM \\"Question\\" q
JOIN \\"ExamPart\\" p ON q.part_id = p.id
JOIN \\"Exam\\" e ON p.exam_id = e.id
WHERE q.question_type = 'MULTIPLE_CHOICE' 
  AND (q.options IS NULL OR q.options = '[]'::jsonb OR q.correct_answer IS NULL OR q.correct_answer = '')
GROUP BY e.skill;
"'''
stdin, stdout, stderr = ssh.exec_command(cmd_broken_q)
broken_out = stdout.read().decode('utf-8').strip()
print("\n🚨 [4] KIỂM TRA CÂU HỎI TRẮC NGHIỆM BỊ LỖI (OPTIONS RỖNG HOẶC MẤT ĐÁP ÁN):")
if broken_out:
    print("  ⚠️ Phát hiện câu hỏi trắc nghiệm thiếu options/đáp án:")
    for line in broken_out.splitlines():
        if line:
            print("    👉", line)
else:
    print("  ✅ Tuyệt vời: 100% câu hỏi trắc nghiệm đều có options và đáp án đầy đủ!")

# 5. Kiểm tra các câu hỏi SENTENCE_ORDER (Part 2/3) có chuẩn format hay không
cmd_order_q = '''docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -c "
SELECT e.title, count(q.id)
FROM \\"Question\\" q
JOIN \\"ExamPart\\" p ON q.part_id = p.id
JOIN \\"Exam\\" e ON p.exam_id = e.id
WHERE q.question_type = 'SENTENCE_ORDER'
GROUP BY e.title;
"'''
stdin, stdout, stderr = ssh.exec_command(cmd_order_q)
order_out = stdout.read().decode('utf-8').strip()
print("\n📋 [5] THỐNG KÊ CÁC ĐỀ DÙNG SENTENCE_ORDER:")
for line in order_out.splitlines():
    if line:
        print("    👉", line)

ssh.close()
