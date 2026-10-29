import json, sys, paramiko
sys.stdout.reconfigure(encoding="utf-8")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("103.90.227.117", port=22, username="root", password="Taovipko0!")

js_code = """
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const ids = [
        '0274ec40-ea8f-405a-9cdd-c56e806a8559',
        '33355128-1f73-48ce-8155-229429714a5b'
    ];
    const exams = await prisma.exam.findMany({
        where: { id: { in: ids } },
        include: {
            parts: {
                include: { questions: true }
            }
        }
    });
    console.log(JSON.stringify(exams, null, 2));
}
main().finally(() => prisma.$disconnect());
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/inspect_broken.js', 'w') as f:
    f.write(js_code)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("docker cp /tmp/inspect_broken.js 100eba9cfa4d:/app/inspect_broken.js && docker exec 100eba9cfa4d node /app/inspect_broken.js")
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
ssh.close()

if err: print("ERR:", err)
print("EXAMS RESULT:")
print(out)
