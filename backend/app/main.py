import uvicorn
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback

from app.core.config import settings
from app.database.session import engine, Base, get_db
from app.models.models import User
from app.core import security
from app.api import auth, exams, analytics, rag, subscriptions, study_plans, classrooms, ws

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack AI platform to generate exams, manage attempts, score code, and evaluate subjective answers.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.exception_handler(Exception)
async def debug_exception_handler(request: Request, exc: Exception):
    print("=" * 80)
    print(f"Exception during request: {request.method} {request.url}")
    traceback.print_exc()
    print("=" * 80)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}", "traceback": traceback.format_exc()}
    )

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Seeding
@app.on_event("startup")
def seed_database():
    db = next(get_db())
    try:
        # Check if database is empty
        user_count = db.query(User).count()
        if user_count == 0:
            print("Database empty. Seeding default demo accounts...")
            
            # Create student
            student = User(
                email="student@example.com",
                hashed_password=security.get_password_hash("password123"),
                full_name="Demo Student",
                role="Student"
            )
            # Create teacher
            teacher = User(
                email="teacher@example.com",
                hashed_password=security.get_password_hash("password123"),
                full_name="Dr. Sarah Teacher",
                role="Teacher"
            )
            # Create admin
            admin = User(
                email="admin@example.com",
                hashed_password=security.get_password_hash("password123"),
                full_name="Platform Administrator",
                role="Admin"
            )
            
            db.add_all([student, teacher, admin])
            db.commit()
            print("Seeding completed successfully! Accounts created:")
            print("- Student: student@example.com / password123")
            print("- Teacher: teacher@example.com / password123")
            print("- Admin: admin@example.com / password123")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

# Root endpoint
@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "swagger_docs": "/docs",
        "redoc_url": "/redoc"
    }

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(exams.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(rag.router, prefix=settings.API_V1_STR)
app.include_router(subscriptions.router, prefix=settings.API_V1_STR)
app.include_router(study_plans.router, prefix=settings.API_V1_STR)
app.include_router(classrooms.router, prefix=settings.API_V1_STR)
app.include_router(ws.router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
