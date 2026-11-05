import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

urls = [
    "https://aptisesolpremier.com/uploads/speaking/ai-samples/cong_vien_giai_tri_p2.jpg",
    "https://aptisesolpremier.com/uploads/speaking/ai-samples/cong_vien_giai_tri_p3_indoor.jpg",
    "https://aptisesolpremier.com/uploads/speaking/ai-samples/cong_vien_giai_tri_p3_outdoor.jpg",
    "https://aptisesolpremier.com/uploads/speaking/ai-samples/voi_vang_p2_news.jpg",
    "https://aptisesolpremier.com/uploads/speaking/ai-samples/voi_vang_p3_paper_book.jpg",
    "https://aptisesolpremier.com/uploads/speaking/ai-samples/voi_vang_p3_ebook.jpg",
]

for u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req, context=ctx, timeout=5)
        print(f"PASS: {u} -> Status {res.status}, Type {res.headers.get('content-type')}, Size {len(res.read())} bytes")
    except Exception as e:
        print(f"FAIL: {u} -> {e}")
