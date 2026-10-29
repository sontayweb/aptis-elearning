import paramiko, json, sys
sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

js = """
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const exam = await prisma.exam.findFirst({
        where: { title: { contains: 'Full Reading' } },
        include: {
            parts: {
                include: { questions: true }
            }
        }
    });
    if (!exam) {
        console.log("No full reading exam found");
        return;
    }
    console.log("Exam:", exam.title);
    for (const p of exam.parts) {
        console.log('PART:', p.title, 'questions count:', p.questions.length);
        if (p.questions.length > 0) {
            console.log('SAMPLE Q in', p.title, ':', JSON.stringify(p.questions[0], null, 2));
        }
    }
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
"""
sftp = ssh.open_sftp()
with sftp.file('/tmp/check_full_q.js', 'w') as f:
    f.write(js)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker cp /tmp/check_full_q.js 100eba9cfa4d:/app/check_full_q.js && docker exec 100eba9cfa4d node /app/check_full_q.js')
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
if err: print("ERR:", err)
print("OUT:\n", out)
ssh.close()
