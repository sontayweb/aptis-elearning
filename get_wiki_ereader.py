import urllib.request
import json
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Let's search Wikimedia for "reading an e-reader" or "Kindle e-reader"
url = "https://en.wikipedia.org/w/api.php?action=query&titles=E-reader&prop=images&format=json"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
res = urllib.request.urlopen(req, context=ctx, timeout=10)
data = json.loads(res.read().decode('utf-8'))
for k, v in data['query']['pages'].items():
    for img in v.get('images', []):
        print(img['title'])
