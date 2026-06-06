from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.models import Classroom, User, classroom_students
from app.schemas.schemas import ClassroomCreate, ClassroomOut
from app.api import deps
import random
import string

router = APIRouter(prefix="/classrooms", tags=["classrooms"])

def generate_join_code() -> str:
    # 6 character uppercase alphanumeric PIN
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

@router.post("", response_model=ClassroomOut)
def create_classroom(
    classroom_in: ClassroomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_teacher)
):
    # Ensure join code is unique
    code = generate_join_code()
    while db.query(Classroom).filter(Classroom.join_code == code).first():
        code = generate_join_code()

    new_classroom = Classroom(
        name=classroom_in.name,
        join_code=code,
        teacher_id=current_user.id
    )
    db.add(new_classroom)
    db.commit()
    db.refresh(new_classroom)
    return new_classroom

@router.get("", response_model=List[ClassroomOut])
def get_classrooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if current_user.role == "Teacher" or current_user.role == "Admin":
        return db.query(Classroom).filter(Classroom.teacher_id == current_user.id).all()
    else:
        # For students, return classrooms they are enrolled in
        return current_user.classrooms_enrolled

@router.post("/join")
def join_classroom(
    join_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if current_user.role != "Student":
        raise HTTPException(status_code=403, detail="Only students can join classrooms via code.")

    classroom = db.query(Classroom).filter(Classroom.join_code == join_code.upper().strip()).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Invalid Join Code.")

    # Check if already enrolled
    if current_user in classroom.students:
        return {"status": "success", "detail": "Already enrolled in this classroom."}

    classroom.students.append(current_user)
    db.commit()
    return {"status": "success", "detail": f"Successfully joined {classroom.name}!"}
