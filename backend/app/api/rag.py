import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.core.config import settings
from app.database.session import get_db
from app.models.models import UploadedFile, User, Exam, Question
from app.schemas.schemas import ExamOut, ExamGenerateRequest
from app.utils.rag_engine import (
    extract_text_from_file,
    chunk_text,
    VectorStoreIndex
)
from app.ai.llm import generate_exam_ai
from app.api import deps

router = APIRouter(prefix="/rag", tags=["RAG Document Processing"])

# Path to serialize our in-memory vector index
INDEX_PATH = os.path.join(settings.UPLOAD_DIR, "vector_index.json")

def get_vector_index() -> VectorStoreIndex:
    index = VectorStoreIndex()
    if os.path.exists(INDEX_PATH):
        try:
            index.load(INDEX_PATH)
        except Exception:
            # handle corruption
            pass
    return index


@router.post("/upload", response_model=Dict[str, Any])
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_teacher)
):
    """
    Upload a textbook or notes PDF/DOCX/TXT file.
    Extracts text, creates chunks, updates vector database index, and saves DB record.
    """
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in ["pdf", "docx", "txt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF, DOCX, and TXT are supported."
        )

    # Save file physically
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save file: {str(e)}"
        )

    # Extract text and chunk
    extracted_text = extract_text_from_file(file_path, file_ext)
    if not extracted_text:
        raise HTTPException(
            status_code=400,
            detail="No text could be extracted from the uploaded document."
        )

    chunks = chunk_text(extracted_text)
    
    # Save file metadata in SQL Database
    db_file = UploadedFile(
        filename=file.filename,
        file_type=file_ext,
        storage_path=file_path,
        owner_id=current_user.id
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    # Update Vector Index
    index = get_vector_index()
    index.add_chunks(
        chunks=chunks,
        file_info={"file_id": db_file.id, "filename": db_file.filename}
    )
    index.save(INDEX_PATH)

    return {
        "message": "File processed and indexed successfully",
        "file_id": db_file.id,
        "filename": db_file.filename,
        "chunks_created": len(chunks)
    }


@router.get("/files", response_model=List[Dict[str, Any]])
def list_uploaded_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Lists metadata of files uploaded by the user or visible to the platform.
    """
    files = db.query(UploadedFile).all()
    return [
        {
            "id": f.id,
            "filename": f.filename,
            "file_type": f.file_type,
            "created_at": f.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        for f in files
    ]


@router.post("/generate-exam", response_model=ExamOut)
def generate_exam_from_document(
    file_id: int = Form(...),
    subject: str = Form(...),
    topic: str = Form(...),
    difficulty: str = Form("Medium"),
    num_questions: int = Form(5),
    duration: int = Form(30),
    question_types_raw: str = Form("MCQ"),  # Comma separated, e.g. "MCQ,Theory"
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_teacher)
):
    """
    Performs retrieval on the vector index and prompts the LLM to generate questions
    exclusively from the retrieved document paragraphs.
    """
    # 1. Fetch file record
    uploaded_file = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not uploaded_file:
        raise HTTPException(status_code=404, detail="Indexed file not found.")

    # 2. Retrieve top matching chunks from index
    index = get_vector_index()
    search_query = f"{subject} {topic}"
    results = index.search(search_query, top_k=5)
    
    # Filter chunks belonging to this file
    matched_chunks = [r["chunk"] for r in results if r["metadata"]["file_id"] == file_id]
    
    if not matched_chunks:
        raise HTTPException(
            status_code=400,
            detail="No matching content found inside the vector index for this specific file."
        )

    context_str = "\n---\n".join(matched_chunks)
    
    # 3. Create modified generation request
    # We embed the retrieved context text into the subject/topic request
    q_types = [qt.strip() for qt in question_types_raw.split(",") if qt.strip()]
    
    # Build prompt addition
    context_instruction = (
        f"\n\nCONTEXT FROM TEXTBOOK '{uploaded_file.filename}':\n"
        f"{context_str}\n\n"
        f"CRITICAL REQUIREMENT: Generate questions based ONLY on facts, concepts, and templates "
        f"described in the above textbook context. Do not invent details outside of this context."
    )

    req = ExamGenerateRequest(
        subject=subject,
        topic=topic + f" (Context: {uploaded_file.filename})",
        difficulty=difficulty,
        num_questions=num_questions,
        question_types=q_types,
        duration=duration
    )
    
    try:
        # Call LLM generation (this is identical to normal generate, but prompt builder handles custom context)
        # We append context instructions to the prompt
        # Let's adjust topic to contain a hint, and append context inside generate_exam_ai
        # To avoid altering the shared generate_exam_ai signature, we can hijack the request parameters
        req.topic = f"{topic}. Use context: {context_instruction}"
        
        # We can trigger the exam generator helper
        from app.api.exams import generate_exam as create_generated_exam
        return create_generated_exam(req, db, current_user)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate quiz from RAG context: {str(e)}"
        )
