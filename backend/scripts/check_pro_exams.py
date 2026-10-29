import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

js = """
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const exams = await prisma.exam.findMany({
        where: { skill: 'READING' },
        include: { parts: true }
    });
    const standalone = exams.filter(e => e.parts.length === 1);
    console.log('Standalone count:', standalone.length);
    console.log('Standalone PRO count:', standalone.filter(e => e.is_pro).length);
    console.log('Standalone FREE count:', standalone.filter(e => !e.is_pro).length);

}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
"""
sftp = ssh.open_sftp()
with sftp.file('/tmp/check_pro.js', 'w') as f:
    f.write(js)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker cp /tmp/check_pro.js 100eba9cfa4d:/app/check_pro.js && docker exec 100eba9cfa4d node /app/check_pro.js')
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
if err: print("ERR:", err)
print("OUT:\n" + out)
ssh.close()
