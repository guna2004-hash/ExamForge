from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List

from app.database.session import get_db
from app.models.models import Exam, ExamAttempt, Question, AnswerSubmission, User, Leaderboard
from app.api import deps

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/student", response_model=Dict[str, Any])
def get_student_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Computes analytics for the student's progress.
    """
    # 1. Basic stats
    attempts = db.query(ExamAttempt).filter(ExamAttempt.user_id == current_user.id, ExamAttempt.status == "Completed").all()
    total_attempts = len(attempts)
    
    if total_attempts == 0:
        return {
            "total_attempts": 0,
            "average_score": 0.0,
            "accuracy": 0.0,
            "topic_performance": [],
            "score_history": [],
            "weak_topics": [],
            "recommendations": ["Take your first generated quiz to see AI recommendations!"]
        }
        
    avg_score = sum(a.score for a in attempts) / total_attempts
    
    # 2. Score History (chronological)
    score_history = []
    for idx, att in enumerate(sorted(attempts, key=lambda x: x.started_at)):
        exam = db.query(Exam).filter(Exam.id == att.exam_id).first()
        score_history.append({
            "attempt_number": idx + 1,
            "exam_title": exam.title if exam else "Unknown Exam",
            "score": att.score,
            "max_marks": exam.max_marks if exam else 100.0,
            "percentage": (att.score / exam.max_marks * 100) if exam and exam.max_marks > 0 else 0.0,
            "date": att.submitted_at.strftime("%Y-%m-%d")
        })

    # 3. Topic-wise Performance
    # We load all submitted answers for this user
    user_submissions = db.query(AnswerSubmission).join(ExamAttempt).filter(
        ExamAttempt.user_id == current_user.id,
        ExamAttempt.status == "Completed"
    ).all()
    
    topic_data = {}
    for sub in user_submissions:
        q = db.query(Question).filter(Question.id == sub.question_id).first()
        if not q:
            continue
        if q.topic not in topic_data:
            topic_data[q.topic] = {"total_marks": 0.0, "earned_marks": 0.0, "questions_count": 0, "correct_count": 0}
        
        topic_data[q.topic]["total_marks"] += q.marks
        topic_data[q.topic]["earned_marks"] += sub.score if sub.score else 0.0
        topic_data[q.topic]["questions_count"] += 1
        if sub.is_correct:
            topic_data[q.topic]["correct_count"] += 1

    topic_performance = []
    weak_topics = []
    recommendations = []
    
    for topic, stats in topic_data.items():
        pct = (stats["earned_marks"] / stats["total_marks"] * 100) if stats["total_marks"] > 0 else 0.0
        topic_performance.append({
            "topic": topic,
            "accuracy": round(pct, 2),
            "questions_answered": stats["questions_count"]
        })
        
        if pct < 70.0:
            weak_topics.append(topic)
            recommendations.append(f"Revise the fundamental definitions of '{topic}' and generate an Easy-level practice quiz.")
            
    # Add generic recommendation if student is doing fine
    if not weak_topics:
        recommendations.append("Excellent performance overall! Try raising the difficulty to 'Hard' on your favorite subjects.")

    # Leaderboard position
    leaderboard = db.query(Leaderboard).filter(Leaderboard.user_id == current_user.id).all()
    total_xp = sum(item.xp_points for item in leaderboard)
    badges = list(set([badge for item in leaderboard if item.badges for badge in item.badges]))

    return {
        "total_attempts": total_attempts,
        "average_score": round(avg_score, 2),
        "total_xp": total_xp,
        "badges": badges,
        "topic_performance": topic_performance,
        "score_history": score_history,
        "weak_topics": weak_topics,
        "recommendations": recommendations
    }

@router.get("/teacher", response_model=Dict[str, Any])
def get_teacher_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_teacher)
):
    """
    Computes analytics for exams created by the teacher.
    """
    exams = db.query(Exam).filter(Exam.created_by_id == current_user.id).all()
    exam_ids = [e.id for e in exams]
    
    total_exams = len(exams)
    if total_exams == 0:
        return {
            "total_exams": 0,
            "total_student_attempts": 0,
            "average_class_score": 0.0,
            "exams_breakdown": []
        }
        
    attempts = db.query(ExamAttempt).filter(ExamAttempt.exam_id.in_(exam_ids), ExamAttempt.status == "Completed").all()
    total_attempts = len(attempts)
    avg_score = sum(a.score for a in attempts) / total_attempts if total_attempts > 0 else 0.0
    
    exams_breakdown = []
    for exam in exams:
        exam_attempts = [a for a in attempts if a.exam_id == exam.id]
        ex_attempts_count = len(exam_attempts)
        ex_avg = sum(a.score for a in exam_attempts) / ex_attempts_count if ex_attempts_count > 0 else 0.0
        
        exams_breakdown.append({
            "exam_id": exam.id,
            "title": exam.title,
            "subject": exam.subject,
            "topic": exam.topic,
            "max_marks": exam.max_marks,
            "attempts_count": ex_attempts_count,
            "average_score": round(ex_avg, 2)
        })

    return {
        "total_exams": total_exams,
        "total_student_attempts": total_attempts,
        "average_class_score": round(avg_score, 2),
        "exams_breakdown": exams_breakdown
    }

@router.get("/leaderboard", response_model=List[Dict[str, Any]])
def get_global_leaderboard(
    topic: str = "Global",
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieves leaderboard ranking for display.
    """
    entries = db.query(Leaderboard).filter(Leaderboard.topic == topic).order_by(Leaderboard.xp_points.desc()).limit(20).all()
    
    res = []
    for idx, entry in enumerate(entries):
        user = db.query(User).filter(User.id == entry.user_id).first()
        res.append({
            "rank": idx + 1,
            "user_id": entry.user_id,
            "full_name": user.full_name if user else "Unknown User",
            "xp_points": entry.xp_points,
            "accuracy": round(entry.accuracy * 100, 2),
            "badges": entry.badges or []
        })
    return res
