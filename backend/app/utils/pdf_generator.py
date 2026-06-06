import os
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Try importing ReportLab components
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
except ImportError:
    colors = None
    SimpleDocTemplate = None
    logger.warning("reportlab not installed. PDF generation will fall back to text file representation.")


def generate_exam_pdf(exam_title: str, topic: str, questions: List[Dict[str, Any]], output_path: str) -> bool:
    """
    Generates a beautifully formatted PDF containing the exam sheet.
    """
    if SimpleDocTemplate is None:
        # Fallback to writing formatted text file
        try:
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(f"🛡️ AEGISEXAM PAPER: {exam_title}\n")
                f.write(f"Topic: {topic}\n")
                f.write("=" * 40 + "\n\n")
                for idx, q in enumerate(questions):
                    f.write(f"Q{idx+1} ({q.get('type')}) - {q.get('marks')} Marks\n")
                    f.write(f"Question: {q.get('text')}\n")
                    if q.get("options"):
                        for opt_idx, opt in enumerate(q.get("options")):
                            f.write(f"   {chr(65+opt_idx)}. {opt}\n")
                    f.write("\n" + "-"*30 + "\n\n")
            return True
        except Exception as e:
            logger.error(f"Fallback text generator failed: {e}")
            return False

    try:
        doc = SimpleDocTemplate(output_path, pagesize=letter,
                                rightMargin=54, leftMargin=54,
                                topMargin=54, bottomMargin=54)
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            name='ExamTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#1e293b'),
            spaceAfter=6
        )
        
        meta_style = ParagraphStyle(
            name='ExamMeta',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=20
        )

        q_title_style = ParagraphStyle(
            name='QTitle',
            parent=styles['Heading2'],
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=6,
            keepWithNext=True
        )

        opt_style = ParagraphStyle(
            name='QOpt',
            parent=styles['Normal'],
            fontSize=10,
            leading=13,
            leftIndent=20,
            spaceAfter=4
        )

        # Header Title
        story.append(Paragraph(f"🛡️ AEGISEXAM: {exam_title}", title_style))
        story.append(Paragraph(f"Topic: {topic} | Platform AI-Generated Exam Paper", meta_style))
        story.append(Spacer(1, 10))

        # Add questions
        for idx, q in enumerate(questions):
            q_text = f"<b>Q{idx+1}.</b> {q.get('text')} <i>({q.get('marks')} Marks)</i>"
            story.append(Paragraph(q_text, q_title_style))
            
            # Options for MCQ
            if q.get("type") == "MCQ" and q.get("options"):
                for opt_idx, opt in enumerate(q.get("options")):
                    opt_text = f"<b>{chr(65+opt_idx)}.</b> {opt}"
                    story.append(Paragraph(opt_text, opt_style))
                    
            story.append(Spacer(1, 15))
            
        doc.build(story)
        return True
    except Exception as e:
        logger.error(f"Reportlab PDF generation error: {e}")
        return False
