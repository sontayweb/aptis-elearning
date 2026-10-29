import paramiko, json, re, sys
sys.stdout.reconfigure(encoding='utf-8')

print("1. Loading local catalogs and questions...", flush=True)
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

print(f"Loaded {len(p3_catalog_data)} P3 sets and {len(p4_catalog_data)} P4 sets with full extra_data.", flush=True)

# Target DB exams
db_p3_exams = [
    ("205f1e06-63d8-4a1c-b105-181e8f4f7346", "Đề 18 - Watching television"),
    ("29f60f9d-6711-4515-8ec1-e46b6c56feb6", "Đề 20 - Eating and cooking"),
    ("952a294f-1e4d-4d77-b5ea-613fb599ad71", "Đề 19 - Volunteering"),
    ("6718b71d-7a41-426e-b936-3d593680b158", "Đề 02 - A new restaurant"),
    ("05af4a95-266f-418b-bdfe-7e51bd43b21f", "Đề 03 - Reading books"),
    ("f7276aa8-707d-464f-966b-fe9167025d33", "Đề 04 - Visit a city (Stevenson)"),
    ("64451df2-5353-40a4-9c7c-b0c5b1c801f0", "Đề 05 - Art"),
    ("ef132cfd-4da7-4826-af9d-138eb5805591", "Đề 12 - Plans for a new station"),
    ("79262329-2fe2-45d7-b67f-315964098837", "Đề 15 - Going on holiday"),
    ("9eb53f62-17d6-4e11-bfb4-adc10907109c", "Đề 16 - Sports"),
    ("88b34ce5-550f-4c1e-9974-820d00ea7034", "Đề 17 - Visit an island"),
    ("009c6974-c9e9-4115-9e1a-eebab03ecbe5", "Đề 01 - Opinions on flying"),
    ("a97a22da-fb62-4904-a59b-9e3b8ac66617", "Đề 08 - Extreme sports. (2026)"),
    ("0274ec40-ea8f-405a-9cdd-c56e806a8559", "Đề 10 - Technology in childhood (2026)"),
    ("fd78b42d-319d-4a77-b387-ed23b020d9f8", "Đề 14 - Volunteering to clean a local park"),
]

db_p4_exams = [
    ("4c4fe630-4e46-4c05-80fb-2ddfb51ad441", "Đề 17 - Music"),
    ("c4cdae95-98cc-480d-96e5-4af1363c6256", "Đề 18 - Tulips"),
    ("817c1cbd-4632-47a5-b266-fd596ba618e3", "Đề 19 - Tulips"),
    ("eb14ce02-f037-42ee-b599-e300e5e8998f", "Đề 20 - Early Australia"),
    ("b1e0daeb-00a1-40b1-aeab-ebf2947086b6", "Đề 02 - Children and Exercises"),
    ("c554bdca-e08a-400c-8af4-71f296771f10", "Đề 03 - Coffee"),
    ("16d67427-8119-438c-af78-5ec69b02888c", "Đề 04 - Consumer age"),
    ("65e332fd-260b-4572-a9c3-d0981430c0ec", "Đề 05 - Early Australia"),
    ("1cebd293-7576-4998-89df-557ef392f434", "Đề 14 - Eating"),
    ("dd069187-6ec6-4e29-b2d8-27632dd3c0b8", "Đề 15 - Frozen land"),
    ("9b975de4-e0f3-486a-9a16-ac856277560b", "Đề 16 - Meatless"),
    ("b20f4199-383a-4339-9609-34b5bdc2fd94", "Đề 08 - Digital"),
    ("49a6f4fd-8292-4c32-b716-1db4ff5fc8f0", "Đề 10 - Doggett’s coat and badge"),
    ("ed3143ba-3065-4837-8cd2-1b13fef6c99e", "Đề 12 - Wellness Trends"),
    ("a63fb7b0-b549-43bd-9e87-e7fb87d0c4fc", "Đề 01 - Charles Dicken"),
    ("e92de0d5-df34-4dd4-aac8-e501917f7dd7", "Đề 33 - Early Australia (Version 2)"),
    ("33355128-1f73-48ce-8155-229429714a5b", "Đề 34 - Mountain (Version 5)"),
    ("379e5c58-1cd7-4256-b864-8ef4d61e959c", "Đề 35 - The Arrival of the Four-Day Work Week (Version 2)"),
]

def clean_key(s):
    s = re.sub(r'^(?:Đề|Test|Exam)\s*\d+\s*[-–—:]\s*', '', s, flags=re.I)
    s = re.sub(r'\(.*?\)', '', s)
    s = re.sub(r'[^\w\s]', ' ', s)
    return s.lower().strip()

def find_best_p3(db_title):
    clean_t = re.sub(r'^(?:Đề|Test|Exam)\s*\d+\s*[-–—:]\s*', '', db_title).strip().lower()
    for item, ed, q in p3_catalog_data:
        c_title = item.get('title', '').strip().lower()
        c_sub = re.sub(r'^(?:Đề|Test|Exam)\s*\d+\s*[-–—:]\s*', '', c_title).strip().lower()
        if clean_t == c_sub or db_title.strip().lower() == c_title:
            return item, ed, q
    k = clean_key(db_title)
    for item, ed, q in p3_catalog_data:
        ik = clean_key(item.get('title', ''))
        if k in ik or ik in k:
            return item, ed, q
    return None

def find_best_p4(db_title):
    clean_t = re.sub(r'^(?:Đề|Test|Exam)\s*\d+\s*[-–—:]\s*', '', db_title).strip().lower()
    for item, ed, q in p4_catalog_data:
        c_title = item.get('title', '').strip().lower()
        c_sub = re.sub(r'^(?:Đề|Test|Exam)\s*\d+\s*[-–—:]\s*', '', c_title).strip().lower()
        if clean_t == c_sub or db_title.strip().lower() == c_title:
            return item, ed, q
    k = clean_key(db_title)
    for item, ed, q in p4_catalog_data:
        ik = clean_key(item.get('title', ''))
        if k in ik or ik in k:
            return item, ed, q
    return None

updates = []

print("\n2. Building P3 (Opinion Matching) updates...", flush=True)
for exam_id, db_title in db_p3_exams:
    match = find_best_p3(db_title)
    if not match:
        print(f"[ERROR] No match for P3 exam {exam_id}: {db_title}", flush=True)
        continue
    c_item, ed, raw_q = match
    people = ed.get('people', [])
    statements = ed.get('statements', [])
    
    passage_parts = []
    for p in people:
        letter = p.get('name', '').strip()
        text = p.get('text', '').strip()
        passage_parts.append(f"Person {letter}:\n{text}")
    passage_text = "\n\n".join(passage_parts)
    
    instructions = ed.get('instruction') or "Four people write reviews. Read the texts and answer the questions."
    
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
        "exam_id": exam_id,
        "part_title": "Part 4 – Opinion matching",
        "instructions": instructions,
        "passage_text": passage_text,
        "questions": new_questions
    })
    print(f"P3: {db_title} -> {len(new_questions)} questions", flush=True)

print("\n3. Building P4 (Long Reading) updates...", flush=True)
for exam_id, db_title in db_p4_exams:
    match = find_best_p4(db_title)
    if not match:
        print(f"[ERROR] No match for P4 exam {exam_id}: {db_title}", flush=True)
        continue
    c_item, ed, raw_q = match
    paragraphs = ed.get('paragraphs', [])
    headings = ed.get('headings', [])
    
    all_headings_options = [h['text'].strip() for h in headings]
    article_title = ed.get('title') or re.sub(r'^(?:Đề|Test|Exam)\s*\d+\s*[-–—:]\s*', '', db_title).strip()
    instructions = ed.get('instruction') or "Read the passage quickly. Choose a heading for each numbered paragraph from the drop-down box."
    
    new_questions = []
    for p in paragraphs:
        p_idx = p.get('index', 1)
        p_text = p.get('text', '').strip()
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
        "exam_id": exam_id,
        "part_title": "Part 5 – Long reading",
        "instructions": instructions,
        "passage_text": article_title,
        "questions": new_questions
    })
    print(f"P4: {db_title} -> {len(new_questions)} questions", flush=True)

print(f"\n4. Prepared {len(updates)} exam updates. Saving locally and transferring to VPS...", flush=True)

local_json = 'backend/scripts/standalone_p3_p4_updates.json'
with open(local_json, 'w', encoding='utf-8') as f:
    json.dump(updates, f, ensure_ascii=False, indent=2)

js_apply = """
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const raw = fs.readFileSync('/tmp/standalone_p3_p4_updates.json', 'utf8');
    const updates = JSON.parse(raw);
    console.log(`Processing ${updates.length} exam updates...`);

    let count = 0;
    for (const item of updates) {
        // Find examPart by exam_id
        const part = await prisma.examPart.findFirst({
            where: { exam_id: item.exam_id }
        });
        if (!part) {
            console.log(`[SKIP] ExamPart not found for exam ${item.exam_id}`);
            continue;
        }

        await prisma.$transaction(async (tx) => {
            // 1. Update ExamPart
            await tx.examPart.update({
                where: { id: part.id },
                data: {
                    title: item.part_title,
                    instructions: item.instructions,
                    passage_text: item.passage_text
                }
            });

            // 2. Fetch existing questions for this part
            const existingQuestions = await tx.question.findMany({
                where: { part_id: part.id },
                orderBy: { question_number: 'asc' }
            });

            // 3. Update existing questions or create new ones
            for (let i = 0; i < item.questions.length; i++) {
                const q = item.questions[i];
                if (i < existingQuestions.length) {
                    await tx.question.update({
                        where: { id: existingQuestions[i].id },
                        data: {
                            question_number: q.question_number,
                            question_type: q.question_type,
                            prompt: q.prompt,
                            options: q.options,
                            correct_answer: q.correct_answer,
                            max_score: q.max_score,
                            explanation: q.explanation || null
                        }
                    });
                } else {
                    await tx.question.create({
                        data: {
                            part_id: part.id,
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
            }

            // 4. If there were extra existing questions, clean them up
            if (existingQuestions.length > item.questions.length) {
                const extraIds = existingQuestions.slice(item.questions.length).map(q => q.id);
                await tx.submissionAnswer.deleteMany({
                    where: { question_id: { in: extraIds } }
                });
                await tx.question.deleteMany({
                    where: { id: { in: extraIds } }
                });
            }
        });
        count++;
        console.log(`[${count}/${updates.length}] Updated ${item.exam_id} (${item.type})`);
    }
    console.log(`SUCCESS: ${count} exams updated.`);
}

main().catch(err => {
    console.error("ERROR:", err);
    process.exit(1);
}).finally(() => prisma.$disconnect());
"""

local_js = 'backend/scripts/apply_updates.js'
with open(local_js, 'w', encoding='utf-8') as f:
    f.write(js_apply)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sftp = ssh.open_sftp()
sftp.put(local_json, '/tmp/standalone_p3_p4_updates.json')
sftp.put(local_js, '/tmp/apply_updates.js')
sftp.close()

print("5. Executing Prisma transaction on VPS...", flush=True)
stdin, stdout, stderr = ssh.exec_command(
    'docker cp /tmp/standalone_p3_p4_updates.json 100eba9cfa4d:/tmp/standalone_p3_p4_updates.json && '
    'docker cp /tmp/apply_updates.js 100eba9cfa4d:/app/apply_updates.js && '
    'docker exec 100eba9cfa4d node /app/apply_updates.js'
)
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
print("OUTPUT:\n" + out, flush=True)
if err:
    print("ERR:\n" + err, flush=True)

ssh.close()
print("Done!", flush=True)

