import sys, paramiko
sys.stdout.reconfigure(encoding="utf-8")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("103.90.227.117", port=22, username="root", password="Taovipko0!")

sql = """
SELECT skill, is_published, count(*) 
FROM exams 
GROUP BY skill, is_published 
ORDER BY skill, is_published;
"""

cmd = f"docker exec 100eba9cfa4d node -e \"const {{ PrismaClient }} = require('@prisma/client'); const prisma = new PrismaClient(); async function main() {{ const res = await prisma.exam.groupBy({{ by: ['skill', 'is_published'], _count: true }}); console.log(JSON.stringify(res, null, 2)); }} main().finally(() => prisma.\\$disconnect());\""

stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
print("DB EXAMS BY SKILL & PUBLISHED:")
print(out)
if err: print("ERR:", err)

# Check reading exams specifically
cmd_reading = "docker exec 100eba9cfa4d node -e \"const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { const res = await prisma.exam.findMany({ where: { skill: 'READING' }, select: { id: true, title: true, is_published: true, created_at: true }, orderBy: { title: 'asc' } }); console.log(JSON.stringify(res, null, 2)); } main().finally(() => prisma.\\$disconnect());\""

stdin, stdout, stderr = ssh.exec_command(cmd_reading)
out_reading = stdout.read().decode('utf-8')
print("TOTAL READING EXAMS IN DB:")
import json
try:
    r_list = json.loads(out_reading)
    print(f"Total Reading exams in DB: {len(r_list)}")
    pub = [r for r in r_list if r.get('is_published')]
    unpub = [r for r in r_list if not r.get('is_published')]
    print(f"Published: {len(pub)}, Unpublished: {len(unpub)}")
    print("\nPublished Reading exams:")
    for r in pub:
        print(f"  [{r['id'][:8]}] {r['title']}")
    print("\nUnpublished Reading exams:")
    for r in unpub:
        print(f"  [{r['id'][:8]}] {r['title']}")
except Exception as e:
    print("Parse error:", e, out_reading[:200])

ssh.close()
