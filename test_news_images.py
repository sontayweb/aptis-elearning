import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

urls = [
    # Person reading newspaper
    ("newspaper1.jpg", "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1000&q=80"),
    ("newspaper2.jpg", "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1000&q=80"),
    ("newspaper3.jpg", "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1000&q=80"),
]

for name, u in urls:
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
    res = urllib.request.urlopen(req, context=ctx, timeout=10)
    with open(name, "wb") as f:
        f.write(res.read())
    print(f"Downloaded {name}")
