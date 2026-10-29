import urllib.request, json, sys
sys.stdout.reconfigure(encoding='utf-8')

exam_id = "0274ec40-ea8f-405a-9cdd-c56e806a8559"
url_q = f"https://api.aptisesolpremier.com/api/exams/{exam_id}/questions"

req = urllib.request.Request(url_q, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as resp:
    data = json.loads(resp.read().decode('utf-8'))

print("GET Questions Success:", data.get('success'))
exam = data.get('data', {})
print("Exam Title:", exam.get('title'))
parts = exam.get('parts', [])
print("Parts:", len(parts))

qs = parts[0].get('questions', [])
print(f"Total questions in Part: {len(qs)}")
for idx, q in enumerate(qs):
    print(f"  Q{idx+1} [id: {q.get('id')}]: {q.get('prompt')}")
    print(f"    Options: {q.get('options')}")

correct_map = {
    qs[0]['id']: "Person D",
    qs[1]['id']: "Person B",
    qs[2]['id']: "Person A",
    qs[3]['id']: "Person B",
    qs[4]['id']: "Person A",
    qs[5]['id']: "Person C",
    qs[6]['id']: "Person D"
}

answers = [{"question_id": qid, "selected_option": ans} for qid, ans in correct_map.items()]

sub_payload = {
    "exam_id": exam_id,
    "answers": answers,
    "time_spent": 120
}

url_sub = "https://api.aptisesolpremier.com/api/submissions"
sub_req = urllib.request.Request(
    url_sub,
    data=json.dumps(sub_payload).encode('utf-8'),
    headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}
)

with urllib.request.urlopen(sub_req, timeout=10) as resp:
    sub_data = json.loads(resp.read().decode('utf-8'))

print("\nSUBMIT RESULT:")
print("Success:", sub_data.get('success'))
res_data = sub_data.get('data', {})
print("Total score:", res_data.get('total_score'))
print("CEFR level:", res_data.get('cefr_level'))
print("Status:", res_data.get('status'))
print("Breakdown / details:")
for a in res_data.get('answers', [])[:7]:
    print(f"  Q: {a.get('question_id')} | user: {a.get('selected_option')} | correct: {a.get('correct_answer')} | is_correct: {a.get('is_correct')} | score: {a.get('score')}")
