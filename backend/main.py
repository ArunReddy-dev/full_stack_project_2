from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.employee_router import employee_router
from app.routers.user_router import users_router
from app.routers.task_router import task_router
from app.routers.remark_router import remark_router
from app.routers.auth_router import auth_router
from app.middleware.error_handler import error_handler_middleware
from app.middleware.logging_middleware import logging_middleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="UST Employee Task Management",
    description="JIRA-lite Employee Management System with role-based access control",
    version="1.0.0"
)

# CORS Configuration for Frontend Integration
origins = [
    "http://localhost:5173",  # Vite default port
    "http://localhost:3000",  # Alternative React port
    "http://localhost:8080",  # Current frontend port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware
app.middleware("http")(error_handler_middleware)
app.middleware("http")(logging_middleware)

# Include routers with API prefix
app.include_router(auth_router, prefix="/api", tags=["Authentication"])
app.include_router(employee_router, prefix="/api", tags=["Employees"])
app.include_router(users_router, prefix="/api", tags=["Users"])
app.include_router(task_router, prefix="/api", tags=["Tasks"])
app.include_router(remark_router, prefix="/api", tags=["Remarks"])

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "UST Employee Task Management API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "UST Employee Management API"}