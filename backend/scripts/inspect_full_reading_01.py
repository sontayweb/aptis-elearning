import json, sys, paramiko
sys.stdout.reconfigure(encoding="utf-8")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("103.90.227.117", port=22, username="root", password="Taovipko0!")

cmd = "docker exec 100eba9cfa4d node -e \"const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { const exam = await prisma.exam.findFirst({ where: { title: { contains: 'Đề 01 — Full Reading' } }, include: { parts: { include: { questions: true } } } }); console.log(JSON.stringify(exam)); } main().finally(() => prisma.\\$disconnect());\""

stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8').strip()
ssh.close()

exam = json.loads(out)
print("Title:", exam.get("title"))
print("Parts count:", len(exam.get("parts", [])))
for p in exam.get("parts", []):
    print(f"\nPart {p['part_number']}: Title: '{p['title']}', passage_text len: {len(p['passage_text'] or '')}, questions count: {len(p['questions'])}")
    for q in p['questions'][:2]:
        print(f"  Q{q['question_number']}: prompt: '{q['prompt'][:50]}...', options: {q['options']}, correct: '{q['correct_answer']}'")
