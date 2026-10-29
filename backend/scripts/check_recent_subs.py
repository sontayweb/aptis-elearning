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
        where: { email: 'hoanghiep310102@gmail.com' }
    });
    const subs = await prisma.examSubmission.findMany({
        where: { user_id: user.id },
        orderBy: { started_at: 'desc' },
        take: 5,
        include: {
            exam: { select: { id: true, title: true } },
            answers: true
        }
    });
    for (const s of subs) {
        console.log(`SUB: ${s.id} | Exam: ${s.exam.title} | Status: ${s.status} | StartedAt: ${s.started_at} | TotalScore: ${s.total_score} | CEFR: ${s.cefr_level} | Answers: ${s.answers.length}`);
    }
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
"""
sftp = ssh.open_sftp()
with sftp.file('/tmp/check_recent_subs.js', 'w') as f:
    f.write(js)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker cp /tmp/check_recent_subs.js 100eba9cfa4d:/app/check_recent_subs.js && docker exec 100eba9cfa4d node /app/check_recent_subs.js')
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
if err: print("ERR:\n" + err)
print("OUT:\n" + out)
ssh.close()
