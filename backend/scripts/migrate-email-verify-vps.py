import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

sql = '''
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP(3);
UPDATE "User" SET email_verified = true, email_verified_at = NOW();
SELECT count(*) FROM "User" WHERE email_verified = true;
'''

cmd = f'docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db << "EOF"\n{sql}\nEOF'
stdin, stdout, stderr = ssh.exec_command(cmd)
print("STDOUT:\n", stdout.read().decode())
err = stderr.read().decode()
if err:
    print("STDERR:\n", err)
ssh.close()
