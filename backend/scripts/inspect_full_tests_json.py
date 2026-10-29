import json, sys
sys.stdout.reconfigure(encoding="utf-8")

with open("tools/data/aptiskytich/full_tests.json", "r", encoding="utf-8") as f:
    full_tests = json.load(f)

print(f"Total Full Tests in full_tests.json: {len(full_tests)}")
for ft in full_tests[:2]:
    print(json.dumps(ft, ensure_ascii=False, indent=2)[:500])
