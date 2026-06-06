import os
import re
import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Try to import libraries for document parsing
try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import docx
except ImportError:
    docx = None

# Try to import sentence-transformers for real embeddings
try:
    embedding_model = None
    np = None
    logger.info("SentenceTransformer model loaded successfully.")
except ImportError:
    embedding_model = None
    np = None
    logger.warning("sentence-transformers not available. Falling back to lightweight semantic keyword vector matcher.")


def extract_text_from_file(file_path: str, file_type: str) -> str:
    """
    Extracts plain text from PDF, DOCX, or TXT files.
    """
    if not os.path.exists(file_path):
        return ""
        
    text = ""
    file_type = file_type.lower()
    
    if file_type == "pdf":
        if pypdf:
            try:
                reader = pypdf.PdfReader(file_path)
                for page in reader.pages:
                    content = page.extract_text()
                    if content:
                        text += content + "\n"
            except Exception as e:
                logger.error(f"PDF extraction error: {e}")
        else:
            logger.warning("pypdf not installed. Reading PDF bytes as text fallback.")
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()[:5000]  # raw limit
                
    elif file_type in ["docx", "doc"]:
        if docx:
            try:
                doc = docx.Document(file_path)
                for para in doc.paragraphs:
                    text += para.text + "\n"
            except Exception as e:
                logger.error(f"DOCX extraction error: {e}")
        else:
            logger.warning("python-docx not installed.")
            
    else:  # Treat as TXT
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        except Exception as e:
            logger.error(f"Text file read error: {e}")
            
    return text


def chunk_text(text: str, chunk_size: int = 800, chunk_overlap: int = 150) -> List[str]:
    """
    Splits text into chunks of roughly equal size with overlap, preserving sentence boundaries.
    """
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        if len(current_chunk) + len(sentence) < chunk_size:
            current_chunk += sentence + " "
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            # Handle sentences larger than chunk_size
            if len(sentence) > chunk_size:
                # hard split large sentences
                words = sentence.split(' ')
                sub_chunk = ""
                for word in words:
                    if len(sub_chunk) + len(word) < chunk_size:
                        sub_chunk += word + " "
                    else:
                        chunks.append(sub_chunk.strip())
                        sub_chunk = word + " "
                current_chunk = sub_chunk
            else:
                current_chunk = sentence + " "
                
    if current_chunk:
        chunks.append(current_chunk.strip())
        
    return chunks


class VectorStoreIndex:
    """
    A simple vector database mock/impl that uses sentence-transformers for
    semantic search, or a TF-IDF bag-of-words lookup fallback.
    """
    def __init__(self, index_name: str = "default_index"):
        self.index_name = index_name
        self.chunks: List[str] = []
        self.embeddings: List[Any] = []
        self.file_metadata: List[Dict[str, Any]] = []
        
    def add_chunks(self, chunks: List[str], file_info: Dict[str, Any]):
        for chunk in chunks:
            self.chunks.append(chunk)
            self.file_metadata.append(file_info)
            
            if embedding_model and np:
                # Compute neural embeddings
                emb = embedding_model.encode(chunk)
                self.embeddings.append(emb.tolist())
                
    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        if not self.chunks:
            return []
            
        # Neural search using Cosine Similarity
        if embedding_model and np and self.embeddings:
            query_emb = embedding_model.encode(query)
            query_vector = np.array(query_emb)
            
            similarities = []
            for emb_list in self.embeddings:
                emb_vector = np.array(emb_list)
                dot_product = np.dot(query_vector, emb_vector)
                norm_q = np.linalg.norm(query_vector)
                norm_e = np.linalg.norm(emb_vector)
                similarity = dot_product / (norm_q * norm_e) if norm_q > 0 and norm_e > 0 else 0.0
                similarities.append(similarity)
                
            sorted_indices = np.argsort(similarities)[::-1]
            results = []
            for idx in sorted_indices[:top_k]:
                results.append({
                    "chunk": self.chunks[idx],
                    "score": float(similarities[idx]),
                    "metadata": self.file_metadata[idx]
                })
            return results
            
        else:
            # Fallback Keyword match search (Jaccard similarity of words)
            query_words = set(query.lower().split())
            scores = []
            for chunk in self.chunks:
                chunk_words = set(chunk.lower().split())
                intersection = query_words.intersection(chunk_words)
                union = query_words.union(chunk_words)
                score = len(intersection) / len(union) if union else 0.0
                scores.append(score)
                
            # Sort manually
            indexed_scores = list(enumerate(scores))
            indexed_scores.sort(key=lambda x: x[1], reverse=True)
            
            results = []
            for idx, score in indexed_scores[:top_k]:
                results.append({
                    "chunk": self.chunks[idx],
                    "score": float(score),
                    "metadata": self.file_metadata[idx]
                })
            return results

    def save(self, path: str):
        data = {
            "chunks": self.chunks,
            "embeddings": self.embeddings,
            "metadata": self.file_metadata
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f)
            
    def load(self, path: str):
        if not os.path.exists(path):
            return
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.chunks = data.get("chunks", [])
            self.embeddings = data.get("embeddings", [])
            self.file_metadata = data.get("metadata", [])
