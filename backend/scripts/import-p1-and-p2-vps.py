import paramiko
import sys
import json
import uuid

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def run_sql(sql):
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/query.sql', 'wb') as f:
        f.write(sql.encode('utf-8'))
    sftp.close()
    
    cmd = 'docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" < /tmp/query.sql'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if err and "ERROR" in err:
        print("SQL ERROR:", err)
    return out

print("=== NẠP BỔ SUNG ĐỀ APTIS TIÊN PHONG & CHUẨN HÓA PART 2 + 3 ===")

# ==============================================================================
# BƯỚC 1: NẠP CÁC ĐỀ PART 1 MỚI TỪ APTIS TIÊN PHONG
# ==============================================================================
print("\n[Bước 1] Nạp các đề Part 1 mới từ Aptis Tiên Phong...")

with open('tools/data/aptisacademy/bo_de_key/exams/reading-part1.json', 'r', encoding='utf-8') as f:
    p1_data = json.load(f)

# Danh sách số thứ tự được user yêu cầu (1-based index):
target_indices = [2, 5, 8, 11, 12, 13, 14, 16, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42]

# Bắt đầu đánh số đề mới từ Đề 21
next_de_num = 21

for raw_idx in target_indices:
    if raw_idx > len(p1_data):
        continue
    item = p1_data[raw_idx - 1]
    raw_title = item.get('data', {}).get('title', f"Exam {raw_idx}").strip()
    sub_qs = item.get('data', {}).get('questions', {}).get('subQuestion', [])
    if len(sub_qs) < 5:
        continue
    
    qs5 = sub_qs[:5]
    answers = [str(q.get('correctAnswer', '')).strip().lower() for q in qs5]
    
    # Chuẩn hóa tiêu đề đẹp mắt
    clean_title = f"Đề {next_de_num:02d} - {raw_title}"
    exam_id = str(uuid.uuid4())
    part_id = str(uuid.uuid4())
    
    # 1. Insert Exam
    ins_exam_sql = f"""
    INSERT INTO "Exam" (id, title, description, skill, duration_minutes, is_published, is_pro, hot_level, created_at, updated_at)
    VALUES (
      '{exam_id}', 
      '{clean_title.replace("'", "''")}', 
      'Bộ đề trọng điểm Reading Part 1 – Gap Fill từ Aptis Tiên Phong', 
      'READING', 
      10, 
      true, 
      false, 
      4, 
      NOW(), 
      NOW()
    );
    """
    run_sql(ins_exam_sql)
    
    # 2. Insert ExamPart
    ins_part_sql = f"""
    INSERT INTO "ExamPart" (id, exam_id, part_number, title, instructions, created_at, updated_at)
    VALUES (
      '{part_id}',
      '{exam_id}',
      1,
      'Part 1 – Sentence comprehension (Gap fill)',
      'Choose the word that fits in the gap. The first one is done for you.',
      NOW(),
      NOW()
    );
    """
    run_sql(ins_part_sql)
    
    # 3. Insert 5 Questions
    for q_idx, q in enumerate(qs5):
        qid = str(uuid.uuid4())
        prompt = q.get('content', f'Question {q_idx + 1}').replace('tienphongSpace', '[gap]').replace("'", "''")
        cor_ans = answers[q_idx].replace("'", "''")
        
        # Options
        raw_opts = q.get('answerList', [])
        opts_list = [o.get('content', '').strip() for o in raw_opts if o.get('content')]
        opts_lower = [o.lower() for o in opts_list]
        if cor_ans.lower() not in opts_lower:
            opts_list.append(cor_ans)
        
        opts_json = json.dumps(opts_list, ensure_ascii=False).replace("'", "''")
        
        ins_q_sql = f"""
        INSERT INTO "Question" (id, part_id, question_number, question_type, prompt, options, correct_answer, max_score, created_at, updated_at)
        VALUES (
          '{qid}',
          '{part_id}',
          {q_idx + 1},
          'GAP_FILL',
          '{prompt}',
          '{opts_json}'::jsonb,
          '{cor_ans}',
          2.0,
          NOW(),
          NOW()
        );
        """
        run_sql(ins_q_sql)
    
    print(f"  ✓ Đã nạp {clean_title}: {' - '.join(answers)} (5 câu, 2.0đ/câu = 10đ)")
    next_de_num += 1

print(f"\n✅ Đã nạp thành công {len(target_indices)} đề Part 1 mới (từ Đề 21 đến Đề {next_de_num - 1}).")

# ==============================================================================
# BƯỚC 2: CHUẨN HÓA 6 ĐOẠN VĂN PART 2 + 3 (TEXT COHESION - 5 CÂU KÉO THẢ)
# ==============================================================================
print("\n[Bước 2] Chuẩn hóa 6 câu chuyện Part 2 + 3 (5 câu kéo thả, 1đ/câu, tổng 10đ)...")

stories_data = [
    {
        "title": "Making films",
        "sentences": [
            "The films in that time period were very different from the films of today.",
            "This is because these films were only in all 2 black and white, and they also had no sound.",
            "In addition to these technological limitations, the film producers has also a very low budget",
            "This lack of money affected mostly the actors, so they didn’t earn much money.",
            "Things have changed over time, and some of them now earn thousands of dollars after appearing in films."
        ]
    },
    {
        "title": "Family sport days",
        "sentences": [
            "It took place on Saturday morning, there was a 10-meter race for adults.",
            "Sixty people took part, and among them, Ms. Kamus kept the fastest pace and won the race.",
            "After she received her prize, the following time was dedicated to children’s activities.",
            "The activities included football, swimming, skipping, and more, and the kids played happily together.",
            "After finishing the games, the children were very hungry and ate with their parents."
        ]
    },
    {
        "title": "My visit to a new coffee shop",
        "sentences": [
            "When I arrived, the place was very crowded, and the staff were extremely busy on the first day.",
            "Even though it was crowded, the staff still managed to find a table for me.",
            "They handed me the menu, and when I looked through it, I saw quite a variety of dishes.",
            "After checking them all, I decided to order the most expensive sandwich.",
            "It tasted really good with melted cheese on top, and I'll definitely come back to this place again."
        ]
    },
    {
        "title": "A famous singer",
        "sentences": [
            "Before becoming famous at this young age, he studied art and music at high school.",
            "During this education, he learned to be creative and to practise singing on stage.",
            "In these performances, he liked to wear bright clothes and paint his face.",
            "This strange way of dressing and his songs have attracted people's attention.",
            "They started to follow him on social media, and now he is very popular."
        ]
    },
    {
        "title": "End-of-term project",
        "sentences": [
            "Your end of term project needs to focus on at least two of them.",
            "It has to include relevant pictures and your own written text about the topic",
            "You then have to use these pictures and your written work to create a presentation for the class.",
            "This talk will give your key points and it should be around five minutes.",
            "After this time, other students will be able to ask some questions and you will answer those."
        ]
    },
    {
        "title": "Eating at a cafe",
        "sentences": [
            "I decided to try a new café located at the end of the street.",
            "The place was quite busy, with a lively atmosphere.",
            "Even so, a staff member quickly noticed me and brought over the menu.",
            "I was a bit surprised to see that there were only a few items to choose from.",
            "In the end, I went for the most expensive salad on the menu."
        ]
    }
]

# Tạo 3 bộ đề Tủ Part 2 (mỗi đề gồm 2 bài đọc = 10 câu = 10 điểm)
exam_pairs = [
    {
        "title": "Đề Thi Thử Reading – Bộ Đề Tủ Part 2 (Đề 01: Making films + Family sport days)",
        "stories": [stories_data[0], stories_data[1]]
    },
    {
        "title": "Đề Thi Thử Reading – Bộ Đề Tủ Part 2 (Đề 02: My visit to a new coffee shop + A famous singer)",
        "stories": [stories_data[2], stories_data[3]]
    },
    {
        "title": "Đề Thi Thử Reading – Bộ Đề Tủ Part 2 (Đề 03: End-of-term project + Eating at a cafe)",
        "stories": [stories_data[4], stories_data[5]]
    }
]

for p_idx, pair in enumerate(exam_pairs):
    e_id = str(uuid.uuid4())
    part_id = str(uuid.uuid4())
    p_title = pair["title"].replace("'", "''")
    
    # 1. Insert Exam
    run_sql(f"""
    INSERT INTO "Exam" (id, title, description, skill, duration_minutes, is_published, is_pro, hot_level, created_at, updated_at)
    VALUES (
      '{e_id}',
      '{p_title}',
      'Bộ đề tủ Part 2 & 3 Text Cohesion chuẩn 5 câu kéo thả (1đ/câu, tổng 10đ)',
      'READING',
      15,
      true,
      false,
      5,
      NOW(),
      NOW()
    );
    """)
    
    # 2. Insert ExamPart
    run_sql(f"""
    INSERT INTO "ExamPart" (id, exam_id, part_number, title, instructions, created_at, updated_at)
    VALUES (
      '{part_id}',
      '{e_id}',
      2,
      'Part 2 & 3 – Text cohesion (Sentence ordering)',
      'The sentences below make a complete text. Put them in the correct order. There is NO fixed sentence.',
      NOW(),
      NOW()
    );
    """)
    
    # 3. Insert 2 Story Questions
    for q_idx, story in enumerate(pair["stories"]):
        qid = str(uuid.uuid4())
        s_title = story["title"].replace("'", "''")
        
        # Tạo 5 sentences với ID s1..s5
        sent_objs = [
            {"id": f"s{s_i + 1}", "text": sent_text}
            for s_i, sent_text in enumerate(story["sentences"])
        ]
        
        options_dict = {
            "title": story["title"],
            "fixedSentence": None,
            "sentences": sent_objs
        }
        
        correct_order = ["s1", "s2", "s3", "s4", "s5"]
        opts_json = json.dumps(options_dict, ensure_ascii=False).replace("'", "''")
        cor_json = json.dumps(correct_order).replace("'", "''")
        
        run_sql(f"""
        INSERT INTO "Question" (id, part_id, question_number, question_type, prompt, options, correct_answer, max_score, created_at, updated_at)
        VALUES (
          '{qid}',
          '{part_id}',
          {q_idx + 1},
          'SENTENCE_ORDER',
          '{s_title}',
          '{opts_json}'::jsonb,
          '{cor_json}',
          5.0,
          NOW(),
          NOW()
        );
        """)
        
    print(f"  ✓ Đã tạo {pair['title']} (2 đoạn văn x 5.0đ = 10.0đ)")

# Cập nhật các đề đơn lẻ hiện có cho 6 câu chuyện trên
for story in stories_data:
    st_title = story["title"]
    # Tìm các câu hỏi có prompt chứa st_title
    find_sql = f"""
    SELECT q.id, e.title 
    FROM "Question" q
    JOIN "ExamPart" p ON q.part_id = p.id
    JOIN "Exam" e ON p.exam_id = e.id
    WHERE q.question_type = 'SENTENCE_ORDER' AND (q.prompt ILIKE '%{st_title}%' OR e.title ILIKE '%{st_title}%');
    """
    res = run_sql(find_sql)
    lines = [l for l in res.split('\n') if l.strip()]
    if lines:
        sent_objs = [
            {"id": f"s{s_i + 1}", "text": sent_text}
            for s_i, sent_text in enumerate(story["sentences"])
        ]
        options_dict = {
            "title": story["title"],
            "fixedSentence": None,
            "sentences": sent_objs
        }
        correct_order = ["s1", "s2", "s3", "s4", "s5"]
        opts_json = json.dumps(options_dict, ensure_ascii=False).replace("'", "''")
        cor_json = json.dumps(correct_order).replace("'", "''")
        
        for l in lines:
            parts = l.split('|||')
            qid = parts[0]
            exam_t = parts[1]
            run_sql(f"""
            UPDATE "Question"
            SET options = '{opts_json}'::jsonb,
                correct_answer = '{cor_json}',
                max_score = 5.0
            WHERE id = '{qid}';
            """)
            print(f"    - Đã chuẩn hóa câu hỏi trong '{exam_t}' cho chủ đề '{st_title}'")

ssh.close()
print("\n🎉 HOÀN THÀNH TOÀN BỘ VIỆC NẠP DỮ LIỆU & CHUẨN HÓA TRÊN VPS!")
