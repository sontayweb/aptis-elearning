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
        include: {
            parts: {
                include: {
                    _count: { select: { questions: true } }
                }
            }
        }
    });
    const res = exams.map(e => ({
        id: e.id,
        title: e.title,
        parts: e.parts.map(p => ({
            id: p.id,
            title: p.title,
            qCount: p._count.questions
        }))
    }));
    console.log(JSON.stringify(res));
}
main().finally(() => prisma.$disconnect());
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/list_standalone.js', 'w') as f:
    f.write(js)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker cp /tmp/list_standalone.js 100eba9cfa4d:/app/list_standalone.js && docker exec 100eba9cfa4d node /app/list_standalone.js')
out = stdout.read().decode('utf-8')
ssh.close()

data = json.loads(out)
standalone = [e for e in data if len(e['parts']) == 1]
print(f"Total standalone exams: {len(standalone)}")

p1_list = []
p2_list = []
p3_list = []
p4_list = []
other_list = []

for e in standalone:
    p = e['parts'][0]
    p_title = p['title'] or ''
    e_title = e['title'] or ''
    t = p_title + ' ' + e_title
    if 'Gap Fill' in t or 'Part 1' in t:
        p1_list.append(e)
    elif 'Cohesion' in t or 'Part 2' in t or 'Order' in t:
        p2_list.append(e)
    elif 'Opinion' in t or 'Part 3' in p_title or 'Part 4' in e_title:
        p3_list.append(e)
    elif 'Long' in t or 'Part 4' in p_title or 'Part 5' in e_title:
        p4_list.append(e)
    else:
        other_list.append(e)

print(f"\n--- Standalone with Part 3 in part title: ---")
for e in standalone:
    p = e['parts'][0]
    if 'Part 3' in (p['title'] or ''):
        print(f"ID: {e['id']} | Title: {e['title']} | PartTitle: {p['title']} | Qs: {p['qCount']}")


print(f"\n--- Standalone Part 4 (Long Reading): {len(p4_list)} ---")
for e in p4_list:
    p = e['parts'][0]
    print(f"ID: {e['id']} | Title: {e['title']} | PartTitle: {p['title']} | Qs: {p['qCount']}")
