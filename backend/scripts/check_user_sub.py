import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

query = """
SELECT u.email, u.role, s.* 
FROM "User" u 
LEFT JOIN "UserSubscription" s ON u.id = s.user_id 
WHERE u.email = 'hoanghiep310102@gmail.com';
"""
stdin, stdout, stderr = ssh.exec_command(f'docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -c \'{query}\'')
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
print("OUT:\n" + out)
if err: print("ERR:\n" + err)
ssh.close()
