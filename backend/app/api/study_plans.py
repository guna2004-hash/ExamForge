from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import User, ExamAttempt
from app.ai.llm import generate_study_plan_ai
from app.api import deps
import json

router = APIRouter(prefix="/study-plans", tags=["study-plans"])

@router.post("/generate")
def generate_study_plan(db: Session = Depends(get_db), current_user: User = Depends(deps.get_current_user)):
    if current_user.subscription_tier != "Pro":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Study Plans are a Pro feature. Please upgrade your subscription."
        )

    # Gather user performance data
    attempts = db.query(ExamAttempt).filter(ExamAttempt.user_id == current_user.id, ExamAttempt.status == "Completed").all()
    
    performance_data = []
    for att in attempts[-5:]:  # Last 5 exams
        if att.evaluation_report and att.exam:
            performance_data.append({
                "topic": att.exam.topic,
                "score": att.score,
                "max_marks": att.exam.max_marks,
                "feedback": att.feedback
            })
            
    if not performance_data:
        raise HTTPException(
            status_code=400,
            detail="Not enough exam history to generate a personalized study plan. Please complete at least one exam."
        )

    # Generate plan via LLM
    try:
        study_plan = generate_study_plan_ai(performance_data)
        return {"status": "success", "study_plan": study_plan}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate study plan: {str(e)}"
        )
