from pymongo import MongoClient
from typing import Optional
from gridfs import GridFS
from dotenv import load_dotenv
import os

load_dotenv()

# Get MongoDB configuration from environment variables
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "ust_task_logs")

client = MongoClient(MONGO_URI)
mongodb = client[MONGO_DB]

# Collections
remarks_collection = mongodb["remarks"]
logs_collection = mongodb["logs"]

# GridFS for file upload / download
fs = GridFS(mongodb)
