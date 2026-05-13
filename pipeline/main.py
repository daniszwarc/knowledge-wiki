from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router

app = FastAPI(title="Knowledge Capture Pipeline", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://wiki:3000"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

app.include_router(router)
