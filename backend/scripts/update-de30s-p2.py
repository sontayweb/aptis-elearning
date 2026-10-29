import paramiko
import sys
import json
import uuid

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

# Define clean stories
stories = {
    # Đề 36
    "36_1": {
        "title": "Making films",
        "sentences": [
            {"id": "s1", "text": "The films in that time period were very different from the films of today."},
            {"id": "s2", "text": "This is because these films were only in all 2 black and white, and they also had no sound."},
            {"id": "s3", "text": "In addition to these technological limitations, the film producers has also a very low budget"},
            {"id": "s4", "text": "This lack of money affected mostly the actors, so they didn’t earn much money."},
            {"id": "s5", "text": "Things have changed over time, and some of them now earn thousands of dollars after appearing in films."}
        ]
    },
    "36_2": {
        "title": "My visit to a new coffee shop",
        "sentences": [
            {"id": "s1", "text": "When I arrived, the place was very crowded, and the staff were extremely busy on the first day."},
            {"id": "s2", "text": "Even though it was crowded, the staff still managed to find a table for me."},
            {"id": "s3", "text": "They handed me the menu, and when I looked through it, I saw quite a variety of dishes."},
            {"id": "s4", "text": "After checking them all, I decided to order the most expensive sandwich."},
            {"id": "s5", "text": "It tasted really good with melted cheese on top, and I'll definitely come back to this place again."}
        ]
    },
    # Đề 34
    "34_1": {
        "title": "Family sport days",
        "sentences": [
            {"id": "s1", "text": "It took place on Saturday morning, there was a 10-meter race for adults."},
            {"id": "s2", "text": "Sixty people took part, and among them, Ms. Kamus kept the fastest pace and won the race."},
            {"id": "s3", "text": "After she received her prize, the following time was dedicated to children’s activities."},
            {"id": "s4", "text": "The activities included football, swimming, skipping, and more, and the kids played happily together."},
            {"id": "s5", "text": "After finishing the games, the children were very hungry and ate with their parents."}
        ]
    },
    "34_2": {
        "title": "The first American woman in space",
        "sentences": [
            {"id": "s1", "text": "Encouraged by her parents, Mae decided to study science at university."},
            {"id": "s2", "text": "Her strong academic record earned her a place in a training program in the United States."},
            {"id": "s3", "text": "Her passion for space led Mae to join a dedicated research team."},
            {"id": "s4", "text": "As a member of the team, she traveled into space and carried out numerous experiments."},
            {"id": "s5", "text": "Some of these experiments involved growing plants and observing animals aboard the spacecraft."}
        ]
    },
    # Đề 37
    "37_1": {
        "title": "End-of-term project",
        "sentences": [
            {"id": "s1", "text": "Your end of term project needs to focus on at least two of them."},
            {"id": "s2", "text": "It has to include relevant pictures and your own written text about the topic"},
            {"id": "s3", "text": "You then have to use these pictures and your written work to create a presentation for the class."},
            {"id": "s4", "text": "This talk will give your key points and it should be around five minutes."},
            {"id": "s5", "text": "After this time, other students will be able to ask some questions and you will answer those."}
        ]
    },
    "37_2": {
        "title": "Music show at the park",
        "sentences": [
            {"id": "s1", "text": "The local authorities planned, sponsored and paid for everything."},
            {"id": "s2", "text": "Because it was free, nearly 5,000 people attended."},
            {"id": "s3", "text": "They came early and sat in nearby shops where they could see the performances."},
            {"id": "s4", "text": "Although the staff had a busy day, they closed the shops early to watch the singer perform."},
            {"id": "s5", "text": "The singer performed for two hours, and everyone had great fun."}
        ]
    },
    # Đề 33
    "33_1": {
        "title": "Wellness fair",
        "sentences": [
            {"id": "s1", "text": "The wellness fair took place on Saturday afternoon, promoting healthy habits and lifestyles."},
            {"id": "s2", "text": "Over sixty participants joined the event, with Dr Patel leading an exciting fitness workshop."},
            {"id": "s3", "text": "The fair also featured activities such as cooking demonstrations, mindfulness sessions and a fun run."},
            {"id": "s4", "text": "After the workshops, prizes were given to those with the most creative health posters."},
            {"id": "s5", "text": "Families had a great time sampling healthy snacks and learning useful tips about overall wellness."}
        ]
    },
    "33_2": {
        "title": "A group presentation",
        "sentences": [
            {"id": "s1", "text": "First, we prepared the materials for our group presentation."},
            {"id": "s2", "text": "Throughout the presentation, we used images to explain our ideas."},
            {"id": "s3", "text": "Then, we presented our topic for 10 minutes."},
            {"id": "s4", "text": "After the presentation, other students asked questions."},
            {"id": "s5", "text": "Finally, each group member took turns answering the questions."}
        ]
    }
}

exam_mapping = [
    {
        "exam_title": "Đề 36 - Making films + My visit to a new coffee shop",
        "s1": stories["36_1"],
        "s2": stories["36_2"]
    },
    {
        "exam_title": "Đề 34 - Family sports day + The first American woman in space",
        "s1": stories["34_1"],
        "s2": stories["34_2"]
    },
    {
        "exam_title": "Đề 37 - End of term project + Music show at the park",
        "s1": stories["37_1"],
        "s2": stories["37_2"]
    },
    {
        "exam_title": "Đề 33 - Wellness fair + A group presentation",
        "s1": stories["33_1"],
        "s2": stories["33_2"]
    }
]

sql_statements = []

for m in exam_mapping:
    title = m["exam_title"]
    s1 = m["s1"]
    s2 = m["s2"]
    
    opt1 = json.dumps({"title": s1["title"], "sentences": s1["sentences"], "fixedSentence": None}, ensure_ascii=False)
    ans1 = json.dumps(["s1", "s2", "s3", "s4", "s5"])
    
    opt2 = json.dumps({"title": s2["title"], "sentences": s2["sentences"], "fixedSentence": None}, ensure_ascii=False)
    ans2 = json.dumps(["s1", "s2", "s3", "s4", "s5"])
    
    # Escape single quotes in JSON for SQL
    opt1_sql = opt1.replace("'", "''")
    opt2_sql = opt2.replace("'", "''")
    
    # 1. Update existing Q1
    sql_statements.append(f"""
    UPDATE "Question" q
    SET 
        prompt = '{s1["title"].replace("'", "''")}',
        options = '{opt1_sql}'::jsonb,
        correct_answer = '{ans1}',
        max_score = 5.0,
        question_type = 'SENTENCE_ORDER'
    FROM "ExamPart" ep
    JOIN "Exam" e ON ep.exam_id = e.id
    WHERE q.part_id = ep.id
      AND e.title = '{title}'
      AND q.question_number = 1;
    """)
    
    # 2. Delete any existing Q2 or insert if not exists
    new_q_id = str(uuid.uuid4())
    sql_statements.append(f"""
    DO $$
    DECLARE
        v_part_id text;
        v_exists boolean;
    BEGIN
        SELECT ep.id INTO v_part_id
        FROM "ExamPart" ep
        JOIN "Exam" e ON ep.exam_id = e.id
        WHERE e.title = '{title}'
        LIMIT 1;

        IF v_part_id IS NOT NULL THEN
            SELECT count(*) > 0 INTO v_exists
            FROM "Question"
            WHERE part_id = v_part_id AND question_number = 2;

            IF v_exists THEN
                UPDATE "Question"
                SET prompt = '{s2["title"].replace("'", "''")}',
                    options = '{opt2_sql}'::jsonb,
                    correct_answer = '{ans2}',
                    max_score = 5.0,
                    question_type = 'SENTENCE_ORDER'
                WHERE part_id = v_part_id AND question_number = 2;
            ELSE
                INSERT INTO "Question" (id, part_id, question_number, question_type, prompt, options, correct_answer, max_score, created_at)
                VALUES ('{new_q_id}', v_part_id, 2, 'SENTENCE_ORDER', '{s2["title"].replace("'", "''")}', '{opt2_sql}'::jsonb, '{ans2}', 5.0, NOW());
            END IF;
        END IF;
    END $$;
    """)

final_sql = "\n".join(sql_statements)

sftp = ssh.open_sftp()
with sftp.file('/tmp/update_de30s.sql', 'wb') as f:
    f.write(final_sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/update_de30s.sql wlafe5vr5fwx6rn3curavktm:/tmp/update_de30s.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/update_de30s.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
print("STDOUT:", stdout.read().decode('utf-8', errors='replace'))
print("STDERR:", stderr.read().decode('utf-8', errors='replace'))

ssh.close()
print("Updated Đề 33, 34, 36, 37 successfully!")
