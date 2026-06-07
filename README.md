# ExamForge- AI-Powered Online Exam Generator

A highly polished, resume-worthy, and production-ready full-stack AI application designed to revolutionize the way examinations are generated, taken, and evaluated. AegisExam leverages the power of Large Language Models (LLMs) to automatically generate comprehensive exams, evaluate subjective/coding answers, and provide actionable analytics for both students and teachers.

## 🚀 Features

- **Role-Based Access Control:** Secure JWT authentication for Students, Teachers, and Admins.
- **AI Exam Generation:** Dynamic prompt engineering pipeline to generate MCQs, True/False, Fill in the Blanks, Theory, and Coding questions using Gemini or OpenAI APIs.
- **RAG Document Indexer:** Upload PDF/DOCX/TXT study materials to generate contextual, accurate questions based directly on the uploaded corpus.
- **Interactive Exam Environment:** Fullscreen mode, anti-cheat warnings, timed sessions, code editors for programming questions, and mark-for-review capabilities.
- **AI Answer Evaluation:** Semantic grading for theory questions and sandbox execution simulation for coding challenges, returning intelligent feedback and missing keywords.
- **Advanced Analytics:** Comprehensive Recharts-powered dashboard showing historical performance, score trends, and AI-recommended study topics.
- **PDF Reports:** High-resolution, professional PDF exports of student evaluation reports using HTML2Canvas and jsPDF.
- **Modern UI/UX:** Built with TailwindCSS, Framer Motion, and Shadcn UI with responsive design, glassmorphism aesthetics, and dark mode support.

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 13 (App Router) & React 18
- **Styling:** Tailwind CSS, Framer Motion, Shadcn UI
- **State Management:** Zustand
- **Data Fetching:** Axios, React Query
- **Charts:** Recharts

### Backend
- **Framework:** Python FastAPI
- **Database:** PostgreSQL (with SQLite zero-config fallback)
- **ORM:** SQLAlchemy & Alembic
- **AI Integration:** Google GenAI SDK (Gemini 2.5 Flash), OpenAI
- **Security:** Passlib (Bcrypt), PyJWT, FastAPI CORS Middleware

## ⚙️ Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- (Optional) Docker

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Activate virtual environment (Windows: .\venv\Scripts\activate | Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
# Set up your environment variables
echo "GEMINI_API_KEY=your_api_key_here" > .env
# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The platform will be available at [http://localhost:3000](http://localhost:3000).

## 🐋 Docker Deployment
For production deployment, you can use the provided Docker Compose configuration:
```bash
docker compose up -d --build
```
This will automatically provision the PostgreSQL database, FastAPI backend, and Next.js frontend in isolated containers.

## 📈 System Architecture & AI Flow
1. **Request Phase:** Teacher submits exam parameters (Topic, Difficulty, Bloom Level) via the React dashboard.
2. **Prompt Builder:** FastAPI constructs a highly-constrained system prompt dictating the exact JSON schema required.
3. **LLM Generation:** The payload is sent to Gemini (or OpenAI). The response is parsed and validated using Pydantic schemas.
4. **Data Persistence:** The generated exam and its questions are saved to the relational database (PostgreSQL).
5. **Evaluation Phase:** When a student submits their attempt, subjective answers are bundled with the model answer and sent back to the LLM for semantic evaluation (assigning a float score and feedback).

## 🤝 Contribution Guide
Please read `CONTRIBUTING.md` for details on our code of conduct, and the process for submitting pull requests to us. Ensure your code is thoroughly tested (Pytest/Jest) before opening a PR.

---
*Built as a showcase for Advanced Agentic AI Engineering.*
