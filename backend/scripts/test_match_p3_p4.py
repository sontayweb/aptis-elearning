import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('tools/data/aptiskytich/exam_sets_catalog.json', encoding='utf-8') as f:
    cat = json.load(f)

with open('tools/data/aptiskytich/all_exam_questions.json', encoding='utf-8') as f:
    questions = json.load(f)

q_by_set = {}
for q in questions:
    s_id = q.get('exam_set_id')
    if s_id:
        q_by_set[s_id] = q

# Build lookup by title keyword for Part 3 and Part 4
p3_data_list = []
p4_data_list = []

for item in cat:
    s_id = item.get('id')
    q = q_by_set.get(s_id)
    if not q: continue
    ed = q.get('extra_data')
    if not ed or not isinstance(ed, dict): continue
    
    if 'people' in ed and 'statements' in ed:
        p3_data_list.append((item, ed, q))
    elif 'paragraphs' in ed and 'headings' in ed:
        p4_data_list.append((item, ed, q))

print(f"Loaded {len(p3_data_list)} P3 sets and {len(p4_data_list)} P4 sets with full extra_data.")

# DB Standalone P3 exams
db_p3_titles = [
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

# DB Standalone P4 exams
db_p4_titles = [
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
    # Remove "Đề XX -", "(2026)", "(Version X)"
    s = re.sub(r'^(?:Đề|Test|Exam)\s*\d+\s*[-–—:]\s*', '', s, flags=re.I)
    s = re.sub(r'\(.*?\)', '', s)
    s = re.sub(r'[^\w\s]', ' ', s)
    return s.lower().strip()

print("\n--- MATCHING P3 ---")
for eid, title in db_p3_titles:
    k = clean_key(title)
    # find best match in p3_data_list
    matched = None
    for item, ed, q in p3_data_list:
        ik = clean_key(item.get('title', ''))
        if k in ik or ik in k:
            matched = (item, ed, q)
            break
    if matched:
        print(f"MATCH: '{title}' => '{matched[0]['title']}' (People: {len(matched[1]['people'])}, Stmts: {len(matched[1]['statements'])})")
    else:
        print(f"NO MATCH: '{title}' (key: '{k}')")

print("\n--- MATCHING P4 ---")
for eid, title in db_p4_titles:
    k = clean_key(title)
    # find best match in p4_data_list
    matched = None
    for item, ed, q in p4_data_list:
        ik = clean_key(item.get('title', ''))
        if k in ik or ik in k:
            matched = (item, ed, q)
            break
    if matched:
        print(f"MATCH: '{title}' => '{matched[0]['title']}' (Paras: {len(matched[1]['paragraphs'])}, Headings: {len(matched[1]['headings'])})")
    else:
        print(f"NO MATCH: '{title}' (key: '{k}')")
