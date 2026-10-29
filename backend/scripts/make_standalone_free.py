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
    const standaloneIds = exams.filter(e => e.parts.length === 1).map(e => e.id);
    console.log(`Setting ${standaloneIds.length} standalone reading exams to is_pro: false...`);
    const res = await prisma.exam.updateMany({
        where: { id: { in: standaloneIds } },
        data: { is_pro: false }
    });
    console.log(`Updated ${res.count} exams to is_pro: false!`);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
"""
sftp = ssh.open_sftp()
with sftp.file('/tmp/make_standalone_free.js', 'w') as f: f.write(js)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker cp /tmp/make_standalone_free.js 100eba9cfa4d:/app/make_standalone_free.js && docker exec 100eba9cfa4d node /app/make_standalone_free.js')
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
if err: print("ERR:\n" + err)
print("OUT:\n" + out)
ssh.close()
