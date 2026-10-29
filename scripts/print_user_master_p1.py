import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

user_list = {
    1: ["window", "buy", "market", "cake", "watched"],
    2: ["live", "share", "class", "drive", "cook"],
    3: ["near", "friendly", "practices", "say", "then"],
    4: ["friendly", "walk", "first", "speak", "together"],
    5: ["Clear", "sun", "enjoyable", "working", "read"],
    7: ["station", "stops", "green", "dinner", "films"],
    8: ["window", "buy", "market", "cake", "watched"],
    10: ["morning", "friends", "leave", "good", "food"],
    12: ["early", "lunch", "go", "car", "sleepy"],
    14: ["miss", "called", "ready", "meet", "dinner"],
    15: ["balance", "statement", "think", "slowly", "before"],
    16: ["just", "too", "to", "some", "give"],
    17: ["meetings", "park", "shop", "cook", "late"],
    18: ["great", "boat", "then", "see", "too"],
    19: ["open", "send", "easy", "so", "page"],
    20: ["detail", "copy", "busy", "client", "long"],
}

print("=== User's target master list for Đề 01..20 ===")
for k, v in sorted(user_list.items()):
    print(f"Đề {k:02d}: {v}")
