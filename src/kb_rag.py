"""
RAG Retrieval Module for YiGo Go Teaching

Provides Retrieval Augmented Generation capabilities - given a query,
retrieves the most relevant knowledge chunks to use as context for AI teaching.
"""

from dataclasses import dataclass
from typing import List, Dict, Optional

from kb_engine import GoKnowledgeBase


@dataclass
class KBChunk:
    """A chunk of indexed knowledge base content."""
    chunk_id: str
    content: str
    level: int
    chunk_type: str  # "knowledge_point", "problem", "dialogue", "learning_path"
    metadata: dict   # {title, topic, difficulty, ...}


@dataclass
class RetrievedChunk:
    """A knowledge chunk retrieved for a query with relevance scoring."""
    chunk: KBChunk
    score: float
    match_reason: str


class KBRAG:
    """Lightweight RAG retrieval using BM25 (no external vector DB needed)"""
    
    def __init__(self, knowledge_base: GoKnowledgeBase):
        self.kb = knowledge_base
        self.chunks: List[KBChunk] = []
        self._index_built = False
    
    def index(self):
        """Index all knowledge base content into chunks"""
        self.chunks = []
        
        # Index knowledge points
        for kp in self.kb.knowledge_points.values():
            content_parts = []
            content_parts.append(f"知识点: {kp.title}")
            content_parts.append(f"难度: {kp.difficulty}")
            content_parts.append(f"概念: {' '.join(kp.concepts)}")
            content_parts.append(f"教学目标: {' '.join(kp.teaching_goals)}")
            if kp.dialogue_examples:
                dialogues = [f"{d.role}: {d.content}" for d in kp.dialogue_examples]
                content_parts.append(f"对话示例: {' '.join(dialogues)}")
            if kp.common_mistakes:
                mistakes = [f"错误:{w} 正确:{c}" for w, c in kp.common_mistakes]
                content_parts.append(f"常见错误: {' '.join(mistakes)}")
            
            chunk = KBChunk(
                chunk_id=f"kp-{kp.level}-{kp.id}",
                content=" | ".join(content_parts),
                level=kp.level,
                chunk_type="knowledge_point",
                metadata={
                    "title": kp.title,
                    "section": kp.section,
                    "difficulty": kp.difficulty,
                    "concepts": kp.concepts
                }
            )
            self.chunks.append(chunk)
        
        # Index problems
        for level, problems in self.kb.problems.items():
            for prob in problems:
                chunk = KBChunk(
                    chunk_id=f"prob-{level}-{prob.id}",
                    content=f"题目类型:{prob.question_type} | 主题:{prob.topic} | 难度:{prob.difficulty} | 问题:{prob.question} | 答案:{prob.answer} | 解析:{prob.explanation}",
                    level=level,
                    chunk_type="problem",
                    metadata={
                        "topic": prob.topic,
                        "difficulty": prob.difficulty,
                        "question_type": prob.question_type
                    }
                )
                self.chunks.append(chunk)
        
        self._index_built = True
        print(f"Indexed {len(self.chunks)} chunks")
    
    def _bm25_score(self, query_terms: List[str], content: str) -> float:
        """Simple BM25-like scoring"""
        content_lower = content.lower()
        score = 0.0
        for term in query_terms:
            count = content_lower.count(term.lower())
            if count > 0:
                score += (2 * count) / (1 + count)  # TF component
        return score
    
    def retrieve(self, query: str, top_k: int = 5,
                 level: int = None) -> List[RetrievedChunk]:
        """Retrieve most relevant chunks for a query"""
        if not self._index_built:
            self.index()
        
        query_terms = query.split()
        scored_chunks = []
        
        for chunk in self.chunks:
            if level is not None and chunk.level != level:
                continue
            score = self._bm25_score(query_terms, chunk.content)
            if score > 0:
                scored_chunks.append(RetrievedChunk(
                    chunk=chunk,
                    score=score,
                    match_reason=f"Matched {sum(1 for t in query_terms if t.lower() in chunk.content.lower())} terms"
                ))
        
        scored_chunks.sort(key=lambda x: x.score, reverse=True)
        return scored_chunks[:top_k]
    
    def build_context(self, query: str, level: int = None, top_k: int = 5) -> str:
        """Build a context string for AI teaching"""
        retrieved = self.retrieve(query, top_k=top_k, level=level)
        
        if not retrieved:
            return "未找到相关知识点。"
        
        context_parts = ["【相关知识点】"]
        for i, r in enumerate(retrieved, 1):
            chunk = r.chunk
            context_parts.append(f"\n{i}. [{chunk.chunk_type}] {chunk.metadata.get('title', chunk.chunk_id)}")
            context_parts.append(f"   内容: {chunk.content[:200]}")
            if chunk.metadata.get('concepts'):
                context_parts.append(f"   核心概念: {', '.join(chunk.metadata['concepts'][:3])}")
        
        return "\n".join(context_parts)
