import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Let's test a couple of famous Kindle / ebook reader photos on Unsplash
candidates = [
    # woman reading kindle
    ("kindle1.jpg", "https://images.unsplash.com/photo-1510519138161-58474ebf8804?w=1000&q=80"),
    # person reading tablet in bed/couch
    ("kindle2.jpg", "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=1000&q=80"),
    # hands holding ereader
    ("kindle3.jpg", "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1000&q=80")
]

for name, u in candidates:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req, context=ctx, timeout=10)
        with open(name, "wb") as f:
            f.write(res.read())
        print(f"Downloaded {name}")
    except Exception as e:
        print(f"Error {name}: {e}")
