import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Text,
    JSON,
    Enum,
    Table,
)
from sqlalchemy.orm import relationship
from app.database.session import Base

classroom_students = Table(
    "classroom_students",
    Base.metadata,
    Column("classroom_id", Integer, ForeignKey("classrooms.id"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False, default="Student")  # Student, Teacher, Admin
    subscription_tier = Column(String(255), default="Free")  # Free, Pro
    stripe_customer_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    exams_created = relationship("Exam", back_populates="creator")
    attempts = relationship("ExamAttempt", back_populates="user")
    uploaded_files = relationship("UploadedFile", back_populates="owner")
    leaderboard_entries = relationship("Leaderboard", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    
    classrooms_taught = relationship("Classroom", back_populates="teacher")
    classrooms_enrolled = relationship("Classroom", secondary=classroom_students, back_populates="students")

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    subject = Column(String(255), index=True, nullable=False)
    topic = Column(String(255), index=True, nullable=False)
    difficulty = Column(String(255), nullable=False)  # Easy, Medium, Hard
    duration = Column(Integer, nullable=False)  # in minutes
    max_marks = Column(Float, nullable=False, default=100.0)
    negative_marking = Column(Float, nullable=False, default=0.0)
    shuffle_questions = Column(Boolean, default=False)
    shuffle_options = Column(Boolean, default=False)
    status = Column(String(255), default="Draft")  # Draft, Scheduled, Active, Completed, Archived
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=True)
    scheduled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="exams_created")
    questions = relationship("Question", back_populates="exam", cascade="all, delete-orphan")
    attempts = relationship("ExamAttempt", back_populates="exam", cascade="all, delete-orphan")
    classroom = relationship("Classroom", back_populates="exams")

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    join_code = Column(String(255), unique=True, index=True, nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    teacher = relationship("User", back_populates="classrooms_taught")
    students = relationship("User", secondary=classroom_students, back_populates="classrooms_enrolled")
    exams = relationship("Exam", back_populates="classroom")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=True)  # nullable if floating in pool
    text = Column(Text, nullable=False)
    type = Column(String(255), nullable=False)  # MCQ, Coding, Theory, FillInBlank, TrueFalse
    options = Column(JSON, nullable=True)  # list of strings for MCQs
    correct_answer = Column(Text, nullable=False)  # standard format: "A" or text or code
    explanation = Column(Text, nullable=True)
    difficulty = Column(String(255), nullable=False)  # Easy, Medium, Hard
    topic = Column(String(255), index=True, nullable=False)
    tags = Column(JSON, nullable=True)  # list of tag strings
    marks = Column(Float, nullable=False, default=1.0)
    bloom_level = Column(String(255), nullable=False, default="Understand")  # Remember, Understand, Apply, Analyze, Evaluate, Create
    is_ai_generated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    exam = relationship("Exam", back_populates="questions")
    submissions = relationship("AnswerSubmission", back_populates="question")

class ExamAttempt(Base):
    __tablename__ = "exam_attempts"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    status = Column(String(255), default="InProgress")  # InProgress, Completed
    score = Column(Float, nullable=True)
    evaluation_report = Column(JSON, nullable=True)  # breakdown of score, suggestions
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    exam = relationship("Exam", back_populates="attempts")
    user = relationship("User", back_populates="attempts")
    answers = relationship("AnswerSubmission", back_populates="attempt", cascade="all, delete-orphan")

class AnswerSubmission(Base):
    __tablename__ = "answer_submissions"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("exam_attempts.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    submitted_answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    score = Column(Float, nullable=True)
    ai_feedback = Column(Text, nullable=True)
    evaluated_at = Column(DateTime, nullable=True)

    # Relationships
    attempt = relationship("ExamAttempt", back_populates="answers")
    question = relationship("Question", back_populates="submissions")

class Leaderboard(Base):
    __tablename__ = "leaderboards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic = Column(String(255), index=True, nullable=False, default="Global")
    xp_points = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    speed_seconds = Column(Integer, default=0)
    badges = Column(JSON, nullable=True)  # list of badges earned
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="leaderboard_entries")

class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(255), nullable=False)  # pdf, docx, txt, etc.
    storage_path = Column(String(255), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="uploaded_files")

class AiGeneration(Base):
    __tablename__ = "ai_generations"

    id = Column(Integer, primary_key=True, index=True)
    prompt = Column(Text, nullable=False)
    response_raw = Column(Text, nullable=True)
    token_count = Column(Integer, nullable=True)
    provider = Column(String(255), nullable=False)  # gemini, openai
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(255), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
