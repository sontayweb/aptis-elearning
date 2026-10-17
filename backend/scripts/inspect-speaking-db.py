import psycopg2

conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/aptis_db')
cur = conn.cursor()

# Find speaking exams
cur.execute("""
    SELECT e.id, e.title, COUNT(p.id) as part_count
    FROM exams e
    JOIN parts p ON p.exam_id = e.id
    WHERE e.type ILIKE '%speaking%' OR e.title ILIKE '%speaking%'
    GROUP BY e.id, e.title
    ORDER BY e.created_at DESC
    LIMIT 6;
""")
exams = cur.fetchall()
print('Found speaking exams:', len(exams))
for ex in exams:
    print(f'\n=== Exam: {ex[0]} - {ex[1]} ===')
    cur.execute("""
        SELECT p.id, p.part_number, p.title, p.image_url, p.passage_text, COUNT(q.id)
        FROM parts p
        LEFT JOIN questions q ON q.part_id = p.id
        WHERE p.exam_id = %s
        GROUP BY p.id, p.part_number, p.title, p.image_url, p.passage_text
        ORDER BY p.part_number;
    """, (ex[0],))
    parts = cur.fetchall()
    for part in parts:
        passage_snippet = (part[4] or "")[:60].replace("\n", " ")
        print(f'  Part {part[1]}: title="{part[2]}", img="{part[3]}", passage="{passage_snippet}", q_count={part[5]}')
        cur.execute("""
            SELECT id, question_number, prompt, image_url, options, explanation
            FROM questions
            WHERE part_id = %s
            ORDER BY question_number
            LIMIT 4;
        """, (part[0],))
        for q in cur.fetchall():
            prompt_snip = (q[2] or "")[:50].replace("\n", " ")
            print(f'    Q{q[1]}: img="{q[3]}", options={str(q[4])[:50]}, prompt="{prompt_snip}"')
