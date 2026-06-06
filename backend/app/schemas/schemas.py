from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "Student"  # Student, Teacher, Admin
    subscription_tier: str = "Free"
    stripe_customer_id: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str

class TokenData(BaseModel):
    user_id: int
    email: str
    role: str

# --- QUESTION SCHEMAS ---
class QuestionBase(BaseModel):
    text: str
    type: str  # MCQ, Coding, Theory, FillInBlank, TrueFalse
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None
    difficulty: str
    topic: str
    tags: Optional[List[str]] = None
    marks: float = 1.0
    bloom_level: str = "Understand"
    is_ai_generated: bool = False

class QuestionCreate(QuestionBase):
    pass

class QuestionOut(QuestionBase):
    id: int
    exam_id: Optional[int] = None

    class Config:
        from_attributes = True

# --- CLASSROOM SCHEMAS ---
class ClassroomBase(BaseModel):
    name: str

class ClassroomCreate(ClassroomBase):
    pass

class ClassroomOut(ClassroomBase):
    id: int
    join_code: str
    teacher_id: int
    created_at: datetime
    students: List[UserOut] = []

    class Config:
        from_attributes = True

# --- EXAM SCHEMAS ---
class ExamBase(BaseModel):
    title: str
    description: Optional[str] = None
    subject: str
    topic: str
    difficulty: str
    duration: int  # in minutes
    max_marks: float = 100.0
    negative_marking: float = 0.0
    shuffle_questions: bool = False
    shuffle_options: bool = False
    status: str = "Draft"  # Draft, Scheduled, Active, Completed, Archived
    classroom_id: Optional[int] = None
    scheduled_at: Optional[datetime] = None

class ExamCreate(ExamBase):
    questions: Optional[List[QuestionCreate]] = None

class ExamOut(ExamBase):
    id: int
    created_by_id: int
    created_at: datetime
    questions: List[QuestionOut] = []

    class Config:
        from_attributes = True

class ExamGenerateRequest(BaseModel):
    subject: str
    topic: str
    difficulty: str = "Medium"  # Easy, Medium, Hard
    num_questions: int = 5
    question_types: List[str] = ["MCQ"]  # MCQ, Coding, Theory, FillInBlank, TrueFalse
    bloom_level: str = "Understand"  # Remember, Understand, Apply, Analyze, Evaluate, Create
    duration: int = 30
    language: str = "English"

# --- EXAM ATTEMPT & SUBMISSION SCHEMAS ---
class AnswerSubmissionCreate(BaseModel):
    question_id: int
    submitted_answer: str

class ExamSubmitRequest(BaseModel):
    answers: List[AnswerSubmissionCreate]

class AnswerSubmissionOut(BaseModel):
    id: int
    question_id: int
    submitted_answer: Optional[str]
    is_correct: Optional[bool]
    score: Optional[float]
    ai_feedback: Optional[str]
    evaluated_at: Optional[datetime]

    class Config:
        from_attributes = True

class ExamAttemptOut(BaseModel):
    id: int
    exam_id: int
    user_id: int
    started_at: datetime
    submitted_at: Optional[datetime]
    status: str
    score: Optional[float]
    evaluation_report: Optional[Dict[str, Any]] = None
    feedback: Optional[str] = None
    answers: List[AnswerSubmissionOut] = []

    class Config:
        from_attributes = True

# --- LEADERBOARD & GAMIFICATION ---
class LeaderboardOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    topic: str
    xp_points: int
    accuracy: float
    speed_seconds: int
    badges: Optional[List[str]] = None

    class Config:
        from_attributes = True
