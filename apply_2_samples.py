import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko
import os

local_dir = "frontend/public/uploads/speaking/ai-samples"
files = [
    "cong_vien_giai_tri_p2.jpg",
    "cong_vien_giai_tri_p3_indoor.jpg",
    "cong_vien_giai_tri_p3_outdoor.jpg",
    "voi_vang_p2_news.jpg",
    "voi_vang_p3_paper_book.jpg",
    "voi_vang_p3_ebook.jpg"
]

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', timeout=20, look_for_keys=False, allow_agent=False)

# 1. Create remote directory
ssh.exec_command("mkdir -p /root/ai-samples")

# 2. Upload files via SFTP
sftp = ssh.open_sftp()
for fname in files:
    local_p = os.path.join(local_dir, fname)
    remote_p = f"/root/ai-samples/{fname}"
    print(f"Uploading {fname} ({os.path.getsize(local_p)} bytes) ...")
    sftp.put(local_p, remote_p)
sftp.close()
print("All files uploaded to VPS /root/ai-samples/!")

# 3. Copy into docker containers
cmds = [
    # Frontend container
    "docker exec cdoa9kmxi37x3m3n38451b2r-092312393197 mkdir -p /app/public/uploads/speaking/ai-samples",
    "docker cp /root/ai-samples/. cdoa9kmxi37x3m3n38451b2r-092312393197:/app/public/uploads/speaking/ai-samples/",
    # Backend container
    "docker exec backend-sontayweb mkdir -p /app/uploads/speaking/ai-samples",
    "docker cp /root/ai-samples/. backend-sontayweb:/app/uploads/speaking/ai-samples/",
    # Also other frontend container if any
    "docker exec rujigoulsjkdrha58tgtrvsr-091947189692 mkdir -p /app/public/uploads/speaking/ai-samples 2>/dev/null",
    "docker cp /root/ai-samples/. rujigoulsjkdrha58tgtrvsr-091947189692:/app/public/uploads/speaking/ai-samples/ 2>/dev/null"
]

for cmd in cmds:
    stdin, stdout, stderr = ssh.exec_command(cmd)
    stdout.channel.recv_exit_status()

print("Copied files into frontend and backend containers!")

# 4. Update the 2 sample exams in postgres
sql = """
BEGIN;

-- 1. Đề 'Công viên giải trí'
UPDATE "ExamPart" 
SET image_url = '/uploads/speaking/ai-samples/cong_vien_giai_tri_p2.jpg'
WHERE part_number = 2 AND exam_id IN (SELECT id FROM "Exam" WHERE title = 'Công viên giải trí');

UPDATE "ExamPart" 
SET image_url = '/uploads/speaking/ai-samples/cong_vien_giai_tri_p3_indoor.jpg, /uploads/speaking/ai-samples/cong_vien_giai_tri_p3_outdoor.jpg'
WHERE part_number = 3 AND exam_id IN (SELECT id FROM "Exam" WHERE title = 'Công viên giải trí');

-- 2. Đề 'Vội vàng'
UPDATE "ExamPart" 
SET image_url = '/uploads/speaking/ai-samples/voi_vang_p2_news.jpg'
WHERE part_number = 2 AND exam_id IN (SELECT id FROM "Exam" WHERE title = 'Vội vàng');

UPDATE "ExamPart" 
SET image_url = '/uploads/speaking/ai-samples/voi_vang_p3_paper_book.jpg, /uploads/speaking/ai-samples/voi_vang_p3_ebook.jpg'
WHERE part_number = 3 AND exam_id IN (SELECT id FROM "Exam" WHERE title = 'Vội vàng');

COMMIT;
"""

exec_sql = f"""docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db << 'EOF'
{sql}
EOF
"""
stdin, stdout, stderr = ssh.exec_command(exec_sql)
print("Database update result:\n", stdout.read().decode())
err = stderr.read().decode()
if err and 'WARNING' not in err:
    print("DB error:", err)

ssh.close()
