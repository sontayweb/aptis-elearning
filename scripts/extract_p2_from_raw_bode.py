import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("tools/data/aptisacademy/raw_bo_de.json", "r", encoding="utf-8") as f:
    raw_data = json.load(f)

items = raw_data["data"]["data"]["items"]
print(f"Total items in items: {len(items)}")

p2_topics = {}

for ex in items:
    ql = ex.get("questions") or []
    for q in ql:
        q_title = q.get("questionTitle") or ""
        content = q.get("content") or ""
        sug = q.get("suggestion") or ""
        
        if "part 2" in q_title.lower() or "topic :" in content.lower():
            # extract topic name
            topic_match = re.search(r'Topic\s*:\s*([^<\n]+)', content + " " + q_title, re.IGNORECASE)
            topic = topic_match.group(1).strip() if topic_match else q_title
            topic = re.sub(r'[\r\n]+', '', topic).strip()
            
            # extract 5 sentences from suggestion
            # in raw_bo_de, suggestion often has: <p>- sentence ...</p>
            sug_sentences = []
            for p in re.findall(r'<p>\s*[-–]\s*(.*?)</p>', sug):
                clean_p = re.sub(r'<[^>]+>', '', p).strip()
                if clean_p and not clean_p.lower().startswith("dịch") and not clean_p.lower().startswith("chủ đề"):
                    sug_sentences.append(clean_p)
                    
            if len(sug_sentences) == 0:
                # Try finding in <ol><li> or <p>
                for p in re.findall(r'<li[^>]*>(.*?)</li>', sug):
                    clean_p = re.sub(r'<[^>]+>', '', p).strip()
                    if clean_p:
                        sug_sentences.append(clean_p)
                        
            if topic not in p2_topics and len(sug_sentences) == 5:
                p2_topics[topic] = {
                    "topic": topic,
                    "sentences": sug_sentences,
                    "raw_suggestion": sug
                }

print(f"Found {len(p2_topics)} distinct Part 2 topics with clean 5 sentences in raw_bo_de.json items!")
for i, (t, d) in enumerate(list(p2_topics.items())[:25]):
    print(f"[{i+1:02d}] {t}")
    for j, s in enumerate(d["sentences"]):
        print(f"     {j+1}. {s[:60]}...")
