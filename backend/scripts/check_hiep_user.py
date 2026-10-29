import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

js = """
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const user = await prisma.user.findFirst({
        where: { email: 'hoanghiep310102@gmail.com' },
        include: { subscriptions: true }
    });
    console.log(JSON.stringify(user, null, 2));
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
"""
sftp = ssh.open_sftp()
with sftp.file('/tmp/check_hiep.js', 'w') as f:
    f.write(js)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker cp /tmp/check_hiep.js 100eba9cfa4d:/app/check_hiep.js && docker exec 100eba9cfa4d node /app/check_hiep.js')
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
if err: print("ERR:\n" + err)
print("OUT:\n" + out)
ssh.close()
