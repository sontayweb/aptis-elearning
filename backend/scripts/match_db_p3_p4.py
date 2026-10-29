import json, sys, paramiko
sys.stdout.reconfigure(encoding="utf-8")

with open("tools/data/aptiskytich/exam_sets_catalog.json", "r", encoding="utf-8") as f:
    sets = json.load(f)

with open("tools/data/aptiskytich/all_exam_questions.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

q_by_set = {q["exam_set_id"]: q for q in questions}

p3_map = {}
p4_map = {}

for s in sets:
    if (s.get("skill") or "").lower() != "reading": continue
    q = q_by_set.get(s["id"])
    if not q or not q.get("extra_data"): continue
    extra = q["extra_data"]
    
    if "people" in extra and "statements" in extra:
        p3_map[s["title"].strip()] = { "extra": extra, "q": q, "set": s }
    if "paragraphs" in extra and "headings" in extra:
        p4_map[s["title"].strip()] = { "extra": extra, "q": q, "set": s }

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("103.90.227.117", port=22, username="root", password="Taovipko0!")

cmd = "docker exec 100eba9cfa4d node -e \"const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { const exams = await prisma.exam.findMany({ where: { skill: 'READING' }, select: { id: true, title: true, parts: { select: { id: true, part_number: true, title: true, questions: { select: { id: true } } } } } }); console.log(JSON.stringify(exams)); } main().finally(() => prisma.\\$disconnect());\""

stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8').strip()
ssh.close()

db_exams = json.loads(out)
db_map = {e["title"].strip(): e for e in db_exams}

p3_matches = []
for title, data in p3_map.items():
    if title in db_map:
        p3_matches.append((title, db_map[title]["id"], len(db_map[title]["parts"][0]["questions"])))
    else:
        # Check partial match
        matched_db = [t for t in db_map if title.split(" - ")[-1] in t]
        if matched_db:
            p3_matches.append((title, db_map[matched_db[0]]["id"], len(db_map[matched_db[0]]["parts"][0]["questions"])))

p4_matches = []
for title, data in p4_map.items():
    if title in db_map:
        p4_matches.append((title, db_map[title]["id"], len(db_map[title]["parts"][0]["questions"])))
    else:
        matched_db = [t for t in db_map if title.split(" - ")[-1] in t]
        if matched_db:
            p4_matches.append((title, db_map[matched_db[0]]["id"], len(db_map[matched_db[0]]["parts"][0]["questions"])))

print(f"Matched P3 exams in DB: {len(p3_matches)} / {len(p3_map)}")
print(f"Matched P4 exams in DB: {len(p4_matches)} / {len(p4_map)}")
print("\nSample P3 matches (Title, DB_ID, current_q_count):")
for m in p3_matches[:5]:
    print(" ", m)
print("\nSample P4 matches (Title, DB_ID, current_q_count):")
for m in p4_matches[:5]:
    print(" ", m)
