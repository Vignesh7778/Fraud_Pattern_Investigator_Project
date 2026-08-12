import math
import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class DocumentChunk(BaseModel):
    chunk_id: str
    document_id: str
    title: str
    category: str
    content: str
    source: str = "internal_policy"
    doc_metadata: Dict[str, Any] = Field(default_factory=dict)
    embedding: List[float] = Field(default_factory=list)


class RetrievalResult(BaseModel):
    chunk_id: str
    document_id: str
    title: str
    category: str
    content: str
    source: str
    relevance_score: float
    doc_metadata: Dict[str, Any] = Field(default_factory=dict)


class LocalEmbeddingProvider:
    """
    Lightweight, deterministic local embedding provider for vector similarity calculations.
    Uses n-gram term frequency vector space with L2 normalization.
    """
    def __init__(self, vector_dim: int = 64):
        self.vector_dim = vector_dim

    def embed_text(self, text: str) -> List[float]:
        tokens = re.findall(r"\w+", text.lower())
        vec = [0.0] * self.vector_dim
        for token in tokens:
            idx = sum(ord(c) for c in token) % self.vector_dim
            vec[idx] += 1.0

        # L2 Normalize
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [v / norm for v in vec]
        return vec


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot = sum(a * b for a, b in zip(vec1, vec2))
    return float(dot)


class RAGEngine:
    def __init__(self):
        self.embedding_provider = LocalEmbeddingProvider(vector_dim=64)
        self.chunks: List[DocumentChunk] = []

    def chunk_and_index_document(
        self,
        document_id: str,
        title: str,
        category: str,
        content: str,
        source: str = "internal_policy",
        doc_metadata: Optional[Dict[str, Any]] = None,
        chunk_size_words: int = 100
    ):
        words = content.split()
        doc_meta = doc_metadata or {}

        # Simple sliding window chunking
        if not words:
            return

        for i in range(0, len(words), max(1, chunk_size_words - 20)):
            chunk_words = words[i:i + chunk_size_words]
            chunk_text = " ".join(chunk_words)
            chunk_id = f"{document_id}_chk_{i}"

            embedding = self.embedding_provider.embed_text(chunk_text)

            chunk = DocumentChunk(
                chunk_id=chunk_id,
                document_id=document_id,
                title=title,
                category=category,
                content=chunk_text,
                source=source,
                doc_metadata=doc_meta,
                embedding=embedding
            )
            self.chunks.append(chunk)

    def search(
        self,
        query: str,
        top_k: int = 3,
        category_filter: Optional[str] = None
    ) -> List[RetrievalResult]:
        query_vec = self.embedding_provider.embed_text(query)
        results = []

        for chunk in self.chunks:
            if category_filter and chunk.category.lower() != category_filter.lower():
                continue

            sim = cosine_similarity(query_vec, chunk.embedding)
            results.append(RetrievalResult(
                chunk_id=chunk.chunk_id,
                document_id=chunk.document_id,
                title=chunk.title,
                category=chunk.category,
                content=chunk.content,
                source=chunk.source,
                relevance_score=round(sim, 4),
                doc_metadata=chunk.doc_metadata
            ))

        # Sort by relevance score descending
        results.sort(key=lambda r: r.relevance_score, reverse=True)
        return results[:top_k]

    def format_grounded_context(self, retrieval_results: List[RetrievalResult]) -> str:
        """
        Formats retrieved chunks with explicit prompt isolation boundaries to prevent prompt injection.
        Retrieved content is tagged as UNTRUSTED DATA.
        """
        if not retrieval_results:
            return "NO RELEVANT POLICY DOCUMENTS FOUND."

        formatted_blocks = ["=== BEGIN RETRIEVED KNOWLEDGE (UNTRUSTED DATA) ==="]
        for idx, res in enumerate(retrieval_results, 1):
            block = (
                f"[{idx}] SOURCE: {res.document_id} | TITLE: {res.title} | RELEVANCE: {res.relevance_score:.2f}\n"
                f"    CATEGORY: {res.category}\n"
                f"    PASSAGE: \"{res.content}\""
            )
            formatted_blocks.append(block)
        formatted_blocks.append("=== END RETRIEVED KNOWLEDGE ===")
        return "\n\n".join(formatted_blocks)


rag_engine = RAGEngine()
