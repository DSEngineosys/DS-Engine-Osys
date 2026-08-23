import urllib.request
import json
import urllib.error

url = "http://localhost:3000/api/auth/login"
data = json.dumps({"email": "zaidkhanadale@gmail.com", "password": "Zaid@123"}).encode("utf-8")
headers = {"Content-Type": "application/json"}

req = urllib.request.Request(url, data=data, headers=headers, method="POST")

try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Body:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("Status:", e.code)
    print("Body:", e.read().decode('utf-8'))
