from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import users_collection
from app.routers import health, predict


@asynccontextmanager
async def lifespan(app: FastAPI):
    users_collection.create_index("email", unique=True)
    yield


app = FastAPI(title="Smart Tomato Backend", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(predict.router)