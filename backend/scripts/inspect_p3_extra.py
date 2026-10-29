import json, sys
sys.stdout.reconfigure(encoding="utf-8")

with open("tools/data/aptiskytich/all_exam_questions.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

for q in questions:
    if q.get("exam_set_id") == "279e6588-e318-48b1-bf0a-f1cf84238fa8":
        print("EXTRA_DATA:", json.dumps(q.get("extra_data"), ensure_ascii=False, indent=2))
        print("IMAGE_URL:", q.get("image_url"))
        print("AUDIO_URL:", q.get("audio_url"))
        print("EXPLANATION:", q.get("explanation"))
        break
