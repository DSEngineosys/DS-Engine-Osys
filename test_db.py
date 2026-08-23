from pymongo import MongoClient
import os

client = MongoClient("mongodb://127.0.0.1:27017/")
db = client["ds-engine-osys"]

hr = db["hrs"].find_one({"email": "hr@admin.com"})
print("HR:", hr)
