from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017/")
db = client["ds-engine-osys"]

input_email = "zaidkhanadale@gmail.com"
password = "Zaid@123"

user = db["employees"].find_one({ "$or": [{"email": input_email.lower()}, {"employeeId": input_email}] })
if not user:
    user = db["dsengineers"].find_one({"email": input_email.lower()})
if not user:
    user = db["hrs"].find_one({ "$or": [{"email": input_email.lower()}, {"hrId": input_email}] })
if not user:
    user = db["admins"].find_one({"email": input_email.lower()})

if not user:
    print("User not found!")
else:
    print("Found user:", user.get("email"))
    db_pass = user.get("password")
    print("DB Password:", db_pass, "Input Password:", password)
    print("Matches?", db_pass == password)
    print("Status:", user.get("status"))
    print("Role:", user.get("role"))
