from pymongo import MongoClient
from app.config import settings

client = MongoClient(settings.MONGODB_URI)
db = client[settings.DB_NAME]

users_collection = db["users"]
predictions_collection = db["predictions"]
diseases_collection = db["diseases"]