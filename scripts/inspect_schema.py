import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

VPS_HOST = "103.90.227.117"
VPS_USER = "root"
VPS_PASS = "Taovipko0!"
CONTAINER = "wlafe5vr5fwx6rn3curavktm"
DB_NAME = "aptis_kytich_db"

def query_db(sql):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS, timeout=15)
    
    cmd = f'docker exec -i {CONTAINER} psql -U postgres -d {DB_NAME}'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    stdin.write(sql + "\n")
    stdin.flush()
    stdin.channel.shutdown_write()
    
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    ssh.close()
    return out, err

out, err = query_db("""
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Exam';
""")
print("Exam columns:\n", out)

out2, err2 = query_db("""
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Question';
""")
print("Question columns:\n", out2)

out3, err3 = query_db("""
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ExamPart';
""")
print("ExamPart columns:\n", out3)
