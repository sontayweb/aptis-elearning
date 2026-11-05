import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://commons.wikimedia.org/w/api.php?action=query&titles=File:Amazon_Kindle_3.JPG&prop=imageinfo&iiprop=url&format=json"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
res = urllib.request.urlopen(req, context=ctx, timeout=10)
data = json.loads(res.read().decode('utf-8'))
for k, v in data['query']['pages'].items():
    print(v['imageinfo'][0]['url'])
