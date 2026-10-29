import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("tools/data/aptisacademy/raw_bo_de.json", "r", encoding="utf-8") as f:
    raw_data = json.load(f)

if isinstance(raw_data, dict):
    print("Dict keys:", list(raw_data.keys()))
    exams = raw_data.get("data") or raw_data.get("exams") or []
    if isinstance(exams, list):
        print("Exams len:", len(exams))
    elif isinstance(exams, dict):
        print("Exams dict keys:", list(exams.keys())[:5])
elif isinstance(raw_data, list):
    print("List len:", len(raw_data))
    if len(raw_data) > 0 and isinstance(raw_data[0], str):
        print("List contains strings, first 3:", raw_data[:3])
