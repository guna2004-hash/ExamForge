import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.session import get_db
from app.models.models import Exam, Question, ExamAttempt, AnswerSubmission, User, Leaderboard
from app.schemas.schemas import ExamCreate, ExamOut, ExamGenerateRequest, ExamSubmitRequest, ExamAttemptOut
from app.ai.llm import generate_exam_ai, evaluate_subjective_answer_ai
from app.utils.code_evaluator import execute_code_safely, get_mock_test_cases
from app.api import deps
from app.api.ws import manager

router = APIRouter(prefix="/exams", tags=["exams"])

async def broadcast_score_update(exam_id: int, user_name: str, score: float, max_marks: float):
    await manager.broadcast_to_exam(exam_id, {
        "type": "score_update",
        "user_name": user_name,
        "score": score,
        "max_marks": max_marks
    })

@router.post("/generate", response_model=ExamOut)
def generate_exam(
    req: ExamGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_teacher)
):
    try:
        # Call LLM logic
        ai_data = generate_exam_ai(req)
        
        # Create exam in DB
        db_exam = Exam(
            title=ai_data.get("title", f"AI Generated: {req.topic}"),
            description=ai_data.get("description", "No description provided."),
            subject=req.subject,
            topic=req.topic,
            difficulty=req.difficulty,
            duration=req.duration,
            max_marks=0.0,  # calculated later
            created_by_id=current_user.id,
            status="Active"
        )
        db.add(db_exam)
        db.commit()
        db.refresh(db_exam)
        
        total_marks = 0.0
        # Add generated questions
        for q in ai_data.get("questions", []):
            marks_val = float(q.get("marks", 5.0))
            total_marks += marks_val
            
            db_question = Question(
                exam_id=db_exam.id,
                text=q.get("text", ""),
                type=q.get("type", "MCQ"),
                options=q.get("options"),
                correct_answer=str(q.get("correct_answer", "")),
                explanation=q.get("explanation", ""),
                difficulty=q.get("difficulty", req.difficulty),
                topic=q.get("topic", req.topic),
                tags=q.get("tags", []),
                marks=marks_val,
                bloom_level=q.get("bloom_level", "Understand"),
                is_ai_generated=True
            )
            db.add(db_question)
            
        db_exam.max_marks = total_marks
        db.commit()
        db.refresh(db_exam)
        
        return db_exam
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate exam: {str(e)}"
        )

@router.post("/create", response_model=ExamOut)
def create_exam(
    exam_in: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_teacher)
):
    db_exam = Exam(
        title=exam_in.title,
        description=exam_in.description,
        subject=exam_in.subject,
        topic=exam_in.topic,
        difficulty=exam_in.difficulty,
        duration=exam_in.duration,
        max_marks=exam_in.max_marks,
        negative_marking=exam_in.negative_marking,
        shuffle_questions=exam_in.shuffle_questions,
        shuffle_options=exam_in.shuffle_options,
        status=exam_in.status,
        scheduled_at=exam_in.scheduled_at,
        created_by_id=current_user.id
    )
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)
    
    if exam_in.questions:
        total_marks = 0.0
        for q in exam_in.questions:
            total_marks += q.marks
            db_q = Question(
                exam_id=db_exam.id,
                text=q.text,
                type=q.type,
                options=q.options,
                correct_answer=q.correct_answer,
                explanation=q.explanation,
                difficulty=q.difficulty,
                topic=q.topic,
                tags=q.tags,
                marks=q.marks,
                bloom_level=q.bloom_level,
                is_ai_generated=q.is_ai_generated
            )
            db.add(db_q)
        db_exam.max_marks = total_marks
        db.commit()
        db.refresh(db_exam)
        
    return db_exam

@router.get("", response_model=List[ExamOut])
def list_exams(
    subject: Optional[str] = None,
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    query = db.query(Exam)
    if subject:
        query = query.filter(Exam.subject == subject)
    if topic:
        query = query.filter(Exam.topic == topic)
    if difficulty:
        query = query.filter(Exam.difficulty == difficulty)
    
    # Hide drafts for Students
    if current_user.role == "Student":
        query = query.filter(Exam.status.in_(["Active", "Completed"]))
        
    return query.order_by(Exam.created_at.desc()).all()

@router.get("/{id}", response_model=ExamOut)
def get_exam(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

@router.post("/{id}/attempt", response_model=ExamAttemptOut)
def start_exam_attempt(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    # Check if there is already an in-progress attempt for this user
    active_attempt = db.query(ExamAttempt).filter(
        ExamAttempt.exam_id == id,
        ExamAttempt.user_id == current_user.id,
        ExamAttempt.status == "InProgress"
    ).first()
    
    if active_attempt:
        return active_attempt
        
    db_attempt = ExamAttempt(
        exam_id=id,
        user_id=current_user.id,
        started_at=datetime.datetime.utcnow(),
        status="InProgress"
    )
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    return db_attempt

@router.post("/attempts/{attempt_id}/submit", response_model=ExamAttemptOut)
def submit_exam_attempt(
    attempt_id: int,
    submission: ExamSubmitRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    attempt = db.query(ExamAttempt).filter(
        ExamAttempt.id == attempt_id,
        ExamAttempt.user_id == current_user.id
    ).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.status == "Completed":
        raise HTTPException(status_code=400, detail="Attempt has already been submitted")
        
    exam = db.query(Exam).filter(Exam.id == attempt.exam_id).first()
    questions = {q.id: q for q in exam.questions}
    
    total_score = 0.0
    evaluation_breakdown = {}
    
    # Process each answer submission
    answers_map = {ans.question_id: ans.submitted_answer for ans in submission.answers}
    
    for q_id, q in questions.items():
        sub_ans = answers_map.get(q_id, "")
        is_correct = False
        score_earned = 0.0
        ai_feedback = None
        
        # MCQs and True/False grading (case-insensitive exact match)
        if q.type in ["MCQ", "TrueFalse"]:
            is_correct = (sub_ans.strip().upper() == q.correct_answer.strip().upper())
            if is_correct:
                score_earned = q.marks
            else:
                score_earned = -exam.negative_marking
                
        # Fill in the Blanks grading (case-insensitive strip match)
        elif q.type == "FillInBlank":
            is_correct = (sub_ans.strip().lower() == q.correct_answer.strip().lower())
            score_earned = q.marks if is_correct else 0.0
            
        # Coding question auto grading
        elif q.type == "Coding":
            test_cases = get_mock_test_cases(q.topic)
            eval_res = execute_code_safely(sub_ans, "find_sum_pairs", test_cases)
            is_correct = eval_res["success"] and eval_res["score"] >= 0.7
            score_earned = q.marks * eval_res["score"]
            ai_feedback = (
                f"Execution status: {'Success' if eval_res['success'] else 'Failed'}. "
                f"Test cases passed: {int(eval_res['score'] * len(test_cases))}/{len(test_cases)}. "
                f"Compiler Output: {eval_res['output']}"
            )
            
        # Theory/Subjective evaluation (requires AI assessment)
        elif q.type == "Theory":
            eval_res = evaluate_subjective_answer_ai(q.text, q.correct_answer, sub_ans)
            is_correct = eval_res.get("is_correct", False)
            score_earned = q.marks * eval_res.get("score", 0.0)
            missing = ", ".join(eval_res.get("key_missing_terms", []))
            missing_str = f" Key terms missed: {missing}." if missing else ""
            ai_feedback = f"{eval_res.get('feedback', '')}{missing_str}"
            
        total_score += score_earned
        
        # Record response
        db_sub = AnswerSubmission(
            attempt_id=attempt.id,
            question_id=q_id,
            submitted_answer=sub_ans,
            is_correct=is_correct,
            score=score_earned,
            ai_feedback=ai_feedback,
            evaluated_at=datetime.datetime.utcnow()
        )
        db.add(db_sub)
        
        evaluation_breakdown[str(q_id)] = {
            "type": q.type,
            "max_marks": q.marks,
            "score": score_earned,
            "is_correct": is_correct,
            "feedback": ai_feedback
        }

    # Finalize attempt score
    attempt.submitted_at = datetime.datetime.utcnow()
    attempt.status = "Completed"
    attempt.score = max(0.0, total_score)  # avoid negative overall exam score
    attempt.evaluation_report = {
        "total_marks": exam.max_marks,
        "score_obtained": attempt.score,
        "breakdown": evaluation_breakdown
    }
    
    # Simple general feedback
    pct = (attempt.score / exam.max_marks) * 100.0 if exam.max_marks > 0 else 0
    if pct >= 80:
        attempt.feedback = "Excellent! You displayed strong conceptual capability and coding precision."
    elif pct >= 50:
        attempt.feedback = "Good job. Some areas require revision, especially syntax or core semantics."
    else:
        attempt.feedback = "Needs improvement. Review the explanations and retry the topics."
        
    db.commit()
    db.refresh(attempt)
    
    # Update Leaderboard rankings and award XP/badges
    update_leaderboard_for_submission(current_user.id, exam.topic, attempt.score, exam.max_marks, db)
    
    # Trigger Live WebSocket Broadcast
    background_tasks.add_task(broadcast_score_update, exam.id, current_user.full_name, attempt.score, exam.max_marks)
    
    return attempt


def update_leaderboard_for_submission(user_id: int, topic: str, score: float, max_marks: float, db: Session):
    """
    Increments student XP, logs badges, and tracks stats on the leaderboard.
    """
    accuracy_pct = (score / max_marks) if max_marks > 0 else 0.0
    xp_gained = int(score * 10)  # 10 XP per mark scored
    
    # Let's find or create a Leaderboard record for this user & topic
    board_entry = db.query(Leaderboard).filter(
        Leaderboard.user_id == user_id,
        Leaderboard.topic == topic
    ).first()
    
    if not board_entry:
        board_entry = Leaderboard(
            user_id=user_id,
            topic=topic,
            xp_points=0,
            accuracy=0.0,
            badges=[]
        )
        db.add(board_entry)
        
    # Update score stats
    board_entry.xp_points += xp_gained
    # Running average accuracy
    board_entry.accuracy = (board_entry.accuracy + accuracy_pct) / 2.0 if board_entry.accuracy > 0 else accuracy_pct
    
    # Award badges
    badges_list = list(board_entry.badges) if board_entry.badges else []
    
    if accuracy_pct >= 0.95 and "Perfect Score" not in badges_list:
        badges_list.append("Perfect Score")
    if board_entry.xp_points >= 500 and "XP Enthusiast" not in badges_list:
        badges_list.append("XP Enthusiast")
    if board_entry.xp_points >= 1000 and "Sage Master" not in badges_list:
        badges_list.append("Sage Master")
        
    board_entry.badges = badges_list
    board_entry.updated_at = datetime.datetime.utcnow()
    db.commit()
