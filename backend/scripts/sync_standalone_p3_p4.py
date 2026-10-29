import paramiko, json, re, sys
sys.stdout.reconfigure(encoding='utf-8')

print("1. Loading local catalogs and questions...")
with open('tools/data/aptiskytich/exam_sets_catalog.json', encoding='utf-8') as f:
    cat = json.load(f)

with open('tools/data/aptiskytich/all_exam_questions.json', encoding='utf-8') as f:
    raw_questions = json.load(f)

q_by_set = {q['exam_set_id']: q for q in raw_questions if q.get('exam_set_id')}

p3_catalog_data = []
p4_catalog_data = []

for item in cat:
    s_id = item.get('id')
    q = q_by_set.get(s_id)
    if not q: continue
    ed = q.get('extra_data')
    if not ed or not isinstance(ed, dict): continue
    
    if 'people' in ed and 'statements' in ed:
        p3_catalog_data.append((item, ed, q))
    elif 'paragraphs' in ed and 'headings' in ed:
        p4_catalog_data.append((item, ed, q))

print(f"Loaded {len(p3_catalog_data)} P3 sets and {len(p4_catalog_data)} P4 sets with full extra_data.")

def clean_key(s):
    s = re.sub(r'^(?:Đề|Test|Exam)\s*\d+\s*[-–—:]\s*', '', s, flags=re.I)
    s = re.sub(r'\(.*?\)', '', s)
    s = re.sub(r'[^\w\s]', ' ', s)
    return s.lower().strip()

def find_best_p3(db_title):
    # 1. Exact match on title or title without Đề XX -
    clean_t = re.sub(r'^(?:Đề|Test|Exam)\s*\d+\s*[-–—:]\s*', '', db_title).strip().lower()
    for item, ed, q in p3_catalog_data:
        c_title = item.get('title', '').strip().lower()
        c_sub = re.sub(r'^(?:Đề|Test|Exam)\s*\d+\s*[-–—:]\s*', '', c_title).strip().lower()
        if clean_t == c_sub or db_title.strip().lower() == c_title:
            return item, ed, q
    # 2. Fuzzy match via clean_key
    k = clean_key(db_title)
    for item, ed, q in p3_catalog_data:
        ik = clean_key(item.get('title', ''))
        if k in ik or ik in k:
            return item, ed, q
    return None

def find_best_p4(db_title):
    # 1. Exact match
    clean_t = re.sub(r'^(?:Đề|Test|Exam)\s*\d+\s*[-–—:]\s*', '', db_title).strip().lower()
    for item, ed, q in p4_catalog_data:
        c_title = item.get('title', '').strip().lower()
        c_sub = re.sub(r'^(?:Đề|Test|Exam)\s*\d+\s*[-–—:]\s*', '', c_title).strip().lower()
        if clean_t == c_sub or db_title.strip().lower() == c_title:
            return item, ed, q
    # 2. Fuzzy match via clean_key
    k = clean_key(db_title)
    for item, ed, q in p4_catalog_data:
        ik = clean_key(item.get('title', ''))
        if k in ik or ik in k:
            return item, ed, q
    return None

# Connect to VPS
print("\n2. Connecting to VPS...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

# Fetch standalone exams from DB
js_fetch = """
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const exams = await prisma.exam.findMany({
        where: { skill: 'READING' },
        include: {
            parts: {
                include: {
                    questions: true
                }
            }
        }
    });
    console.log(JSON.stringify(exams));
}
main().finally(() => prisma.$disconnect());
"""
sftp = ssh.open_sftp()
with sftp.file('/tmp/fetch_all_reading.js', 'w') as f:
    f.write(js_fetch)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker cp /tmp/fetch_all_reading.js 100eba9cfa4d:/app/fetch_all_reading.js && docker exec 100eba9cfa4d node /app/fetch_all_reading.js')
out = stdout.read().decode('utf-8')
all_exams = json.loads(out)
standalone_exams = [e for e in all_exams if len(e['parts']) == 1]
print(f"Total reading exams in DB: {len(all_exams)}, Standalone: {len(standalone_exams)}")

# Prepare updates payload
updates = []
p3_count = 0
p4_count = 0

for exam in standalone_exams:
    part = exam['parts'][0]
    p_title = (part['title'] or '').strip()
    e_title = (exam['title'] or '').strip()
    
    # Check if Part 3 (Opinion matching)
    is_p3 = ('Part 3' in p_title and 'Gap Fill' in p_title) or ('Opinion' in p_title) or ('Part 4' in e_title and 'Opinion' in e_title)
    # Check if Part 4 (Long reading)
    is_p4 = ('Part 4' in p_title and 'Long' in p_title) or ('Long' in p_title) or ('Part 5' in e_title and 'Long' in e_title)

    if is_p3:
        match = find_best_p3(e_title)
        if not match:
            print(f"[WARN] No P3 match for DB exam: {exam['id']} - {e_title}")
            continue
        c_item, ed, raw_q = match
        people = ed.get('people', [])
        statements = ed.get('statements', [])
        if len(people) < 4 or len(statements) < 7:
            print(f"[WARN] Incomplete P3 data for {e_title}: {len(people)} people, {len(statements)} statements")
            continue
        
        # Build passage_text
        passage_parts = []
        for p in people:
            letter = p.get('name', '').strip()
            text = p.get('text', '').strip()
            passage_parts.append(f"Person {letter}:\n{text}")
        passage_text = "\n\n".join(passage_parts)
        
        instructions = ed.get('instruction') or "Four people write reviews. Read the texts and answer the questions."
        
        # Build questions
        new_questions = []
        for idx, stmt in enumerate(statements):
            correct_person_idx = stmt.get('correctPerson', 0)
            correct_letter = chr(65 + correct_person_idx)
            new_questions.append({
                "question_number": idx + 1,
                "question_type": "MATCHING",
                "prompt": stmt.get('text', '').strip(),
                "options": ["Person A", "Person B", "Person C", "Person D"],
                "correct_answer": f"Person {correct_letter}",
                "max_score": 1.0,
                "explanation": raw_q.get('explanation') if idx == 0 else None
            })
            
        updates.append({
            "type": "P3",
            "exam_id": exam['id'],
            "part_id": part['id'],
            "part_title": "Part 4 – Opinion matching",
            "instructions": instructions,
            "passage_text": passage_text,
            "questions": new_questions
        })
        p3_count += 1
        print(f"[OK] Queued P3 update for: {e_title} ({len(new_questions)} questions)")

    elif is_p4:
        match = find_best_p4(e_title)
        if not match:
            print(f"[WARN] No P4 match for DB exam: {exam['id']} - {e_title}")
            continue
        c_item, ed, raw_q = match
        paragraphs = ed.get('paragraphs', [])
        headings = ed.get('headings', [])
        if len(paragraphs) < 7 or len(headings) < 7:
            print(f"[WARN] Incomplete P4 data for {e_title}: {len(paragraphs)} paras, {len(headings)} headings")
            continue
        
        # Build options list
        all_headings_options = [h['text'].strip() for h in headings]
        
        article_title = ed.get('title') or re.sub(r'^(?:Đề|Test|Exam)\s*\d+\s*[-–—:]\s*', '', e_title).strip()
        instructions = ed.get('instruction') or "Read the passage quickly. Choose a heading for each numbered paragraph from the drop-down box."
        
        # Build questions
        new_questions = []
        for p in paragraphs:
            p_idx = p.get('index', 1)
            p_text = p.get('text', '').strip()
            # find heading with matching paragraphIndex
            correct_h = next((h['text'].strip() for h in headings if h.get('paragraphIndex') == p_idx), "")
            new_questions.append({
                "question_number": p_idx,
                "question_type": "MATCHING",
                "prompt": f"Paragraph {p_idx}: {p_text}",
                "options": all_headings_options,
                "correct_answer": correct_h,
                "max_score": 1.0,
                "explanation": raw_q.get('explanation') if p_idx == 1 else None
            })
            
        updates.append({
            "type": "P4",
            "exam_id": exam['id'],
            "part_id": part['id'],
            "part_title": "Part 5 – Long reading",
            "instructions": instructions,
            "passage_text": article_title,
            "questions": new_questions
        })
        p4_count += 1
        print(f"[OK] Queued P4 update for: {e_title} ({len(new_questions)} questions)")

print(f"\n3. Prepared {len(updates)} updates ({p3_count} P3, {p4_count} P4). Writing apply script to VPS...")

# Save updates payload to JSON file on VPS
sftp = ssh.open_sftp()
with sftp.file('/tmp/standalone_p3_p4_updates.json', 'w') as f:
    json.dump(updates, f, ensure_ascii=False)
sftp.close()

# Node.js script to execute Prisma transaction on VPS
js_apply = """
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const raw = fs.readFileSync('/tmp/standalone_p3_p4_updates.json', 'utf8');
    const updates = JSON.parse(raw);
    console.log(`Processing ${updates.length} exam updates...`);

    let successCount = 0;
    for (const item of updates) {
        await prisma.$transaction(async (tx) => {
            // 1. Update Part
            await tx.part.update({
                where: { id: item.part_id },
                data: {
                    title: item.part_title,
                    instructions: item.instructions,
                    passage_text: item.passage_text
                }
            });

            // 2. Delete existing questions
            await tx.question.deleteMany({
                where: { part_id: item.part_id }
            });

            // 3. Create fresh questions
            for (const q of item.questions) {
                await tx.question.create({
                    data: {
                        part_id: item.part_id,
                        question_number: q.question_number,
                        question_type: q.question_type,
                        prompt: q.prompt,
                        options: q.options,
                        correct_answer: q.correct_answer,
                        max_score: q.max_score,
                        explanation: q.explanation || null
                    }
                });
            }
        });
        successCount++;
        console.log(`[${successCount}/${updates.length}] Updated exam ${item.exam_id} (${item.type})`);
    }
    console.log(`All ${successCount} exams updated successfully!`);
}

main().catch(err => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
}).finally(() => prisma.$disconnect());
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/apply_updates.js', 'w') as f:
    f.write(js_apply)
sftp.close()

print("\n4. Running updates in backend container...")
stdin, stdout, stderr = ssh.exec_command(
    'docker cp /tmp/standalone_p3_p4_updates.json 100eba9cfa4d:/tmp/standalone_p3_p4_updates.json && '
    'docker cp /tmp/apply_updates.js 100eba9cfa4d:/app/apply_updates.js && '
    'docker exec 100eba9cfa4d node /app/apply_updates.js'
)
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
print("OUTPUT:")
print(out)
if err:
    print("ERRORS:")
    print(err)

ssh.close()
print("Done!")
