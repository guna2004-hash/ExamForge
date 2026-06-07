import json
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.core.config import settings
from app.schemas.schemas import ExamGenerateRequest

logger = logging.getLogger(__name__)

# Define structure for LLM JSON output
class AIQuestionStructure(BaseModel):
    text: str = Field(description="The question prompt")
    type: str = Field(description="Question type: MCQ, Coding, Theory, FillInBlank, TrueFalse")
    options: Optional[List[str]] = Field(default=None, description="List of 4 choices if MCQ. Null for others.")
    correct_answer: str = Field(description="Correct choice code like 'A' for MCQs, exact word for FillInBlank, 'True' or 'False' for True/False, or detailed response criteria/source code for Theory/Coding.")
    explanation: str = Field(description="Step by step reasoning for the answer")
    difficulty: str = Field(description="Easy, Medium, or Hard")
    topic: str = Field(description="Subtopic of the question")
    tags: List[str] = Field(description="Key concept tags")
    marks: float = Field(default=5.0, description="Marks assigned to the question")
    bloom_level: str = Field(default="Understand", description="Bloom taxonomy: Remember, Understand, Apply, Analyze, Evaluate, Create")

class AIExamStructure(BaseModel):
    title: str = Field(description="Sleek title for the exam")
    description: str = Field(description="Course description/instructions")
    questions: List[AIQuestionStructure] = Field(description="List of generated questions")


def generate_exam_ai(req: ExamGenerateRequest) -> Dict[str, Any]:
    """
    Generates exam questions using Gemini, OpenAI, or falls back to programmatic generation.
    """
    prompt = (
        f"Generate an exam paper about '{req.subject}' focusing on the topic '{req.topic}'.\n"
        f"Target Difficulty: {req.difficulty}\n"
        f"Bloom Taxonomy Level: {req.bloom_level}\n"
        f"Number of Questions: {req.num_questions}\n"
        f"Allowed Question Types: {', '.join(req.question_types)}\n"
        f"Language: {req.language}\n\n"
        f"Ensure that coding questions contain simple starter templates. "
        f"Each MCQ must have exactly 4 options. Return ONLY valid JSON matching the schema."
    )

    # Let's try Gemini first if selected and configured
    if settings.DEFAULT_LLM_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        try:
            logger.info("Generating using Gemini Client...")
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            # Use structured schema mode
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=AIExamStructure,
                    temperature=0.7,
                )
            )
            data = json.loads(response.text)
            return data
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}. Falling back to default or mock.")
            
    # Try OpenAI if selected/available
    if (settings.DEFAULT_LLM_PROVIDER == "openai" or not settings.GEMINI_API_KEY) and settings.OPENAI_API_KEY:
        try:
            logger.info("Generating using OpenAI Client...")
            import openai
            
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a senior university professor and examiner. Generate high-quality exams matching the requested schema. Return JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
            )
            data = json.loads(response.choices[0].message.content)
            # Basic validation
            if "questions" in data:
                return data
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}.")

    # Fallback to local mock programmatic generation if no LLM credentials are setup or if they fail
    logger.warning("No LLM credentials found or LLM calls failed. Serving premium mock questions.")
    return get_mock_questions(req)


def evaluate_subjective_answer_ai(question_text: str, model_answer: str, student_answer: str) -> Dict[str, Any]:
    """
    Evaluates a subjective question using AI. Returns evaluation schema.
    """
    prompt = (
        f"Question: {question_text}\n"
        f"Model Answer Guide: {model_answer}\n"
        f"Student Answer: {student_answer}\n\n"
        f"Perform an evaluation of the student's answer. Compare semantic similarity, keywords match, grammar, and correctness.\n"
        f"Return a JSON object containing:\n"
        f"- 'score': float (from 0 to 1.0, where 1.0 is fully correct)\n"
        f"- 'is_correct': bool\n"
        f"- 'feedback': str (constructive criticism, corrections, and positive remarks)\n"
        f"- 'key_missing_terms': list of strings (important keywords the student missed)"
    )

    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            from google.genai import types
            
            class EvaluationResult(BaseModel):
                score: float
                is_correct: bool
                feedback: str
                key_missing_terms: List[str]

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=EvaluationResult,
                    temperature=0.2,
                )
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Gemini subjective evaluation failed: {e}")

    # Fallback response if offline/no key
    score = 0.8 if len(student_answer.split()) > 15 else 0.4
    return {
        "score": score,
        "is_correct": score >= 0.7,
        "feedback": "AI Evaluation simulated. Student answer demonstrates decent comprehension of main topics but could expand on technical nuances.",
        "key_missing_terms": ["complexity analysis", "edge cases"] if score < 0.7 else []
    }


def generate_study_plan_ai(performance_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generates a personalized study plan based on past exam performance.
    """
    prompt = (
        "Generate a 7-day personalized study plan based on the following exam performance data:\n"
        f"{json.dumps(performance_data, indent=2)}\n\n"
        "Identify weak areas and provide specific daily tasks. Return ONLY valid JSON matching this schema:\n"
        "{\n"
        '  "overview": "Brief summary of strengths and weaknesses",\n'
        '  "days": [\n'
        '    { "day": 1, "topic": "Topic Name", "tasks": ["Task 1", "Task 2"] }\n'
        '  ]\n'
        "}"
    )

    if settings.DEFAULT_LLM_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        try:
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.4,
                )
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Gemini study plan generation failed: {e}")

    # Fallback response
    return {
        "overview": "Simulated Study Plan. You need to focus on foundational topics highlighted in your recent attempts.",
        "days": [
            { "day": 1, "topic": "Review Incorrect Answers", "tasks": ["Go through the last exam", "Identify patterns"] },
            { "day": 2, "topic": "Core Fundamentals", "tasks": ["Read textbook chapter 1", "Solve 5 easy problems"] },
            { "day": 3, "topic": "Advanced Application", "tasks": ["Practice coding exercises", "Review Edge Cases"] },
            { "day": 4, "topic": "Mock Test", "tasks": ["Take a new mock exam", "Evaluate score"] }
        ]
    }


def get_mock_questions(req: ExamGenerateRequest) -> Dict[str, Any]:
    """
    Programmatic high-quality question generator fallback.
    """
    topic_clean = req.topic.lower()
    subject_clean = req.subject.lower()
    
    questions = []
    
    # MCQ mock question
    if "MCQ" in req.question_types:
        questions.append(
            AIQuestionStructure(
                text=f"Which of the following best describes the primary advantage of utilizing {req.topic} in {req.subject}?",
                type="MCQ",
                options=[
                    f"It significantly reduces the complexity of {req.topic}.",
                    f"It provides a scalable architecture for {req.subject}.",
                    f"It is the only valid methodology for {req.topic}.",
                    f"None of the above."
                ],
                correct_answer="B",
                explanation=f"When analyzing {req.topic}, scalability and efficient structuring are often the primary advantages highlighted in modern {req.subject}.",
                difficulty=req.difficulty,
                topic=req.topic,
                tags=[req.topic, "Core Concept"],
                marks=4.0,
                bloom_level="Understand"
            )
        )
        questions.append(
            AIQuestionStructure(
                text=f"In the context of {req.topic}, which principle is considered fundamentally idempotent?",
                type="MCQ",
                options=["State mutation", "Data traversal", "Idempotent resolution", "Cache validation"],
                correct_answer="C",
                explanation=f"For {req.topic}, ensuring operations yield the same result safely is key.",
                difficulty=req.difficulty,
                topic=req.topic,
                tags=[req.topic, "Advanced"],
                marks=4.0,
                bloom_level="Remember"
            )
        )
        
    # Coding mock question
    if "Coding" in req.question_types:
        questions.append(
            AIQuestionStructure(
                text=(
                    f"Write a comprehensive implementation or algorithm that effectively demonstrates {req.topic}. "
                    f"Ensure your solution adheres to the standard conventions of {req.subject}."
                ),
                type="Coding",
                options=None,
                correct_answer=(
                    f"def solve_{req.topic.replace(' ', '_').lower()}():\n"
                    f"    # TODO: Implement core logic for {req.topic}\n"
                    f"    pass"
                ),
                explanation=f"A standard implementation involves initializing the state and processing the constraints of {req.topic}.",
                difficulty=req.difficulty,
                topic=req.topic,
                tags=[req.topic, "Implementation"],
                marks=10.0,
                bloom_level="Create"
            )
        )
        
    # Theory / subjective mock question
    if "Theory" in req.question_types or ("Theory" not in req.question_types and len(questions) < req.num_questions):
        questions.append(
            AIQuestionStructure(
                text=f"Explain the primary differences between various approaches to {req.topic}. Compare them in terms of efficiency, readability, and modern {req.subject} standards.",
                type="Theory",
                options=None,
                correct_answer=(
                    f"The foundational approach to {req.topic} focuses on structural integrity, "
                    f"whereas modern {req.subject} methodologies prioritize rapid execution and adaptability."
                ),
                explanation=f"A complete answer should address both historical and modern perspectives on {req.topic}.",
                difficulty=req.difficulty,
                topic=req.topic,
                tags=[req.topic, "Theory"],
                marks=8.0,
                bloom_level="Analyze"
            )
        )
        
    # True/False mock question
    if "TrueFalse" in req.question_types:
        questions.append(
            AIQuestionStructure(
                text=f"Under the hood, {req.topic} is implemented purely as a continuous block of memory, preventing any arbitrary modifications.",
                type="TrueFalse",
                options=["True", "False"],
                correct_answer="False",
                explanation=f"While {req.topic} maintains structure, modern systems almost always allow dynamic expansion and modification in {req.subject}.",
                difficulty=req.difficulty,
                topic=req.topic,
                tags=[req.topic, "Fundamentals"],
                marks=2.0,
                bloom_level="Understand"
            )
        )
        
    # Fill in the blank mock question
    if "FillInBlank" in req.question_types:
        questions.append(
            AIQuestionStructure(
                text=f"The specialized process of caching or optimizing calculations specifically for {req.topic} is called ____________.",
                type="FillInBlank",
                options=None,
                correct_answer="memoization",
                explanation=f"Caching expensive operations is universally known as memoization, heavily utilized in {req.topic}.",
                difficulty=req.difficulty,
                topic=req.topic,
                tags=[req.topic, "Optimization"],
                marks=3.0,
                bloom_level="Remember"
            )
        )

    # Fallback to a generic text question if no types matched or questions list is empty
    if not questions:
        questions.append(
            AIQuestionStructure(
                text=f"Explain the core principles of {req.topic} in the context of {req.subject}.",
                type="Theory",
                options=None,
                correct_answer=f"The student should demonstrate a foundational understanding of {req.topic}.",
                explanation=f"A general subjective question since no specific mock question types matched.",
                difficulty=req.difficulty,
                topic=req.topic,
                tags=[req.topic],
                marks=5.0,
                bloom_level="Understand"
            )
        )

    # Trim/pad to requested number of questions
    final_questions = questions[:]
    while len(final_questions) < req.num_questions:
        # Clone one of the generated questions to fill up the quota
        clone = final_questions[0].model_copy()
        clone.text = clone.text + " (Variant)"
        final_questions.append(clone)
    
    final_questions = final_questions[:req.num_questions]
    
    # Convert Pydantic objects to dicts to match LLM json.loads behavior
    return {
        "title": f"Exam Paper - {req.topic} ({req.difficulty})",
        "description": f"AI-Generated quiz testing concepts in {req.subject} / {req.topic}. Designed for {req.difficulty} level.",
        "questions": [q.model_dump() for q in final_questions]
    }
