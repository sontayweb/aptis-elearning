import urllib.request, json, sys
sys.stdout.reconfigure(encoding='utf-8')
for skill in ['SPEAKING', 'READING', 'WRITING']:
    req = urllib.request.urlopen(f'http://localhost:5000/api/exams?skill={skill}&limit=1')
    data = json.loads(req.read().decode('utf-8'))
    first_exam = data.get('data', [])[0]
    print(skill, 'ID:', first_exam.get('id'), '| Title:', first_exam.get('title'))
