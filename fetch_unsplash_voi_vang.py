import urllib.request
import json
import ssl
import os

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# We can find top quality Unsplash photo IDs for these exact themes:
# 1. Reading morning newspaper at cafe: photo-1504711434969-e33886168f5c (classic morning newspaper coffee)
# 2. Reading printed book library: photo-1512820790803-83ca734da794 (person reading book library)
# 3. Reading ebook tablet train: photo-1544716278-ca5e3f4abd8c (reading ebook on device)

unsplash_map = {
    "voi_vang_p2_news.jpg": "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&q=80&auto=format&fit=crop", # reading newspaper
    "voi_vang_p3_paper_book.jpg": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80&auto=format&fit=crop", # reading printed book
    "voi_vang_p3_ebook.jpg": "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=1200&q=80&auto=format&fit=crop" # reading on tablet/kindle
}

out_dir = "frontend/public/uploads/speaking/ai-samples"
for name, url in unsplash_map.items():
    file_path = os.path.join(out_dir, name)
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req, context=ctx, timeout=15)
        data = res.read()
        with open(file_path, "wb") as f:
            f.write(data)
        print(f"Downloaded {name}: {len(data)} bytes")
    except Exception as e:
        print(f"Error {name}: {e}")
