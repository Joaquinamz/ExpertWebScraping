"""
Main.py ULTRA MINIMALISTA - Sin imports de config ni database
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Crear app
app = FastAPI(title="Test API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "working"}

@app.get("/health")
def health():
    return {"healthy": True}

@app.get("/test")
def test():
    return {"message": "Backend funcionando correctamente", "data": [1, 2, 3]}
