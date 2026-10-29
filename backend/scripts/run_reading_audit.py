import paramiko, sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sftp = ssh.open_sftp()
sftp.put('backend/scripts/audit_reading_quality.js', '/tmp/audit_reading_quality.js')
sftp.close()

cmd = 'docker cp /tmp/audit_reading_quality.js 100eba9cfa4d:/app/audit_reading_quality.js && docker exec 100eba9cfa4d node /app/audit_reading_quality.js'
stdin, stdout, stderr = ssh.exec_command(cmd)

out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')

print(out)
if err.strip():
    print("ERR:", err)

ssh.close()
