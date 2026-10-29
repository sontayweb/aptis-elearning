import paramiko, json, sys
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
        select: {
            id: true,
            title: true,
            parts: {
                select: {
                    id: true,
                    part_number: true,
                    title: true,
                    _count: { select: { questions: true } }
                }
            }
        }
    });
    console.log(JSON.stringify(exams));
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
"""
sftp = ssh.open_sftp()
with sftp.file('/tmp/check_reading_parts.js', 'w') as f:
    f.write(js)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker cp /tmp/check_reading_parts.js 100eba9cfa4d:/app/check_reading_parts.js && docker exec 100eba9cfa4d node /app/check_reading_parts.js')
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
ssh.close()

if err:
    print("ERR:", err[:500])
try:
    data = json.loads(out)
    print('Total reading exams:', len(data))
    for e in data[:10]:
        print(e['id'], e['title'], [(p['title'], p['_count']['questions']) for p in e['parts']])
except Exception as ex:
    print("JSON error:", ex)
    print("Raw output:", out[:500])
