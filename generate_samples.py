import urllib.request
import urllib.parse
import ssl
import os
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

out_dir = "frontend/public/uploads/speaking/ai-samples"
os.makedirs(out_dir, exist_ok=True)

prompts = {
    "cong_vien_giai_tri_p2.jpg": "authentic photo, Aptis exam picture, children and families enjoying a colorful vibrant amusement park with ferris wheel and roller coaster in background, sunny daytime, natural lighting, candid documentary photography",
    "cong_vien_giai_tri_p3_indoor.jpg": "authentic photo, Aptis exam picture, people playing basketball on an indoor sports hall court in a modern gym, bright indoor lighting, candid sports action photography",
    "cong_vien_giai_tri_p3_outdoor.jpg": "authentic photo, Aptis exam picture, young people playing soccer football on an outdoor sunny green grass field in public park, natural daylight, candid photography",
    "voi_vang_p2_news.jpg": "authentic photo, Aptis exam picture, a person sitting at a wooden cafe table holding and reading a wide printed daily newspaper with a warm coffee cup, soft morning light, candid photography",
    "voi_vang_p3_paper_book.jpg": "authentic photo, Aptis exam picture, a person sitting in a comfortable armchair in a warm quiet library reading a printed paper hardcover book, bookshelves background, candid photography",
    "voi_vang_p3_ebook.jpg": "authentic photo, Aptis exam picture, a person holding an electronic e-book reader tablet device reading on a commute train journey, modern screen, candid photography"
}

for filename, p in prompts.items():
    file_path = os.path.join(out_dir, filename)
    encoded = urllib.parse.quote(p)
    url = f"https://image.pollinations.ai/prompt/{encoded}?width=800&height=533&model=flux&nologo=true&seed={int(time.time())}"
    print(f"Generating {filename}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    res = urllib.request.urlopen(req, context=ctx, timeout=45)
    data = res.read()
    with open(file_path, "wb") as f:
        f.write(data)
    print(f"  ✓ Saved {filename} ({len(data)} bytes)")
    time.sleep(1)

print("\nAll 6 sample images generated successfully!")
