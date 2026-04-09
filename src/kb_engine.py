"""
Knowledge Base Indexing Engine for YiGo Go Teaching

Core engine that indexes all YiGo teaching knowledge and provides query APIs.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
from pathlib import Path

from kb_parser import (
    KBMarkdownParser,
    KnowledgePoint,
    Problem,
    LearningPathItem,
    DialogueEntry
)


@dataclass
class OverviewStats:
    """Statistics overview of the knowledge base."""
    total_knowledge_points: Dict[int, int]  # level -> count
    total_problems: Dict[int, int]
    total_dialogues: Dict[int, int]
    characters: List[dict]  # available AI characters per level


class GoKnowledgeBase:
    """
    Core knowledge base engine that indexes all YiGo teaching knowledge
    and provides query APIs.
    """
    
    def __init__(self, kb_path: str):
        """
        Initialize the knowledge base engine.
        
        Args:
            kb_path: Path to the knowledge base directory
        """
        self.kb_path = Path(kb_path)
        self.parser = KBMarkdownParser()
        self.knowledge_points: Dict[str, KnowledgePoint] = {}  # key: "level.id"
        self.problems: Dict[int, List[Problem]] = {}  # level -> problems
        self.learning_paths: Dict[int, List[LearningPathItem]] = {}
        self.dialogue_scripts: Dict[int, List[DialogueEntry]] = {}
        self._index: Dict[int, Dict[str, KnowledgePoint]] = {}  # level -> {title -> kp}
    
    def load_all(self):
        """Load all knowledge base files from all 5 levels"""
        for level in range(1, 6):
            self._load_level(level)
        print(f"Loaded {len(self.knowledge_points)} knowledge points, "
              f"{sum(len(p) for p in self.problems.values())} problems")
    
    def _load_level(self, level: int):
        """Load all files for a specific level"""
        level_dir = self.kb_path / f"Level_{level}"
        
        # Load Knowledge Details
        details_file = level_dir / f"Level_{level}_Knowledge_Details.md"
        if details_file.exists():
            content = details_file.read_text(encoding='utf-8')
            kps = self.parser.parse_knowledge_details(content, level)
            for kp in kps:
                self.knowledge_points[f"{level}.{kp.id}"] = kp
                if level not in self._index:
                    self._index[level] = {}
                self._index[level][kp.title] = kp
        
        # Load Problems
        problems_file = level_dir / f"Level_{level}_Problem_Set.md"
        if problems_file.exists():
            content = problems_file.read_text(encoding='utf-8')
            self.problems[level] = self.parser.parse_problem_set(content, level)
        
        # Load Learning Path
        path_file = level_dir / f"Level_{level}_Learning_Path.md"
        if path_file.exists():
            content = path_file.read_text(encoding='utf-8')
            self.learning_paths[level] = self.parser.parse_learning_path(content, level)
        
        # Load Dialogue Scripts
        dialogue_file = level_dir / f"Level_{level}_AI_Dialogue_Scripts.md"
        if dialogue_file.exists():
            content = dialogue_file.read_text(encoding='utf-8')
            self.dialogue_scripts[level] = self.parser.parse_dialogue_scripts(content, level)
    
    def query(self, level: int = None, topic: str = None,
              keyword: str = None) -> List[KnowledgePoint]:
        """
        Query knowledge points by level, topic, or keyword.
        
        Args:
            level: Filter by level (1-5)
            topic: Filter by topic in title or section
            keyword: Filter by keyword in title or concepts
            
        Returns:
            List of matching KnowledgePoint objects
        """
        results = list(self.knowledge_points.values())
        
        if level is not None:
            results = [kp for kp in results if kp.level == level]
        
        if topic is not None:
            topic = topic.lower()
            results = [kp for kp in results
                     if topic in kp.title.lower() or topic in kp.section.lower()]
        
        if keyword is not None:
            keyword = keyword.lower()
            results = [kp for kp in results
                      if keyword in kp.title.lower()
                      or any(keyword in c.lower() for c in kp.concepts)]
        
        return results
    
    def get_knowledge_point(self, level: int, point_id: str) -> KnowledgePoint:
        """
        Get specific knowledge point by level and ID.
        
        Args:
            level: Level number (1-5)
            point_id: Knowledge point ID (e.g., "1.2.1")
            
        Returns:
            KnowledgePoint object or None if not found
        """
        return self.knowledge_points.get(f"{level}.{point_id}")
    
    def get_problems(self, level: int, count: int = 10,
                     topic: str = None) -> List[Problem]:
        """
        Get practice problems for a level.
        
        Args:
            level: Level number (1-5)
            count: Maximum number of problems to return
            topic: Optional topic filter
            
        Returns:
            List of Problem objects
        """
        problems = self.problems.get(level, [])
        if topic:
            problems = [p for p in problems if topic.lower() in p.topic.lower()]
        return problems[:count]
    
    def get_dialogue(self, level: int, situation: str = None) -> List[DialogueEntry]:
        """
        Get dialogue scripts for a level.
        
        Args:
            level: Level number (1-5)
            situation: Optional situation filter
            
        Returns:
            List of DialogueEntry objects
        """
        scripts = self.dialogue_scripts.get(level, [])
        if situation:
            situation = situation.lower()
            scripts = [d for d in scripts
                      if situation in d.content.lower()]
        return scripts
    
    def get_learning_path(self, level: int) -> List[LearningPathItem]:
        """
        Get learning path for a level.
        
        Args:
            level: Level number (1-5)
            
        Returns:
            List of LearningPathItem objects
        """
        return self.learning_paths.get(level, [])
    
    def get_overview(self) -> OverviewStats:
        """
        Get knowledge base overview statistics.
        
        Returns:
            OverviewStats object with counts per level
        """
        total_kp = {}
        total_prob = {}
        total_diag = {}
        for level in range(1, 6):
            total_kp[level] = len([kp for kp in self.knowledge_points.values()
                                   if kp.level == level])
            total_prob[level] = len(self.problems.get(level, []))
            total_diag[level] = len(self.dialogue_scripts.get(level, []))
        
        characters = [
            {"name": "阿呆", "level": [1, 2], "avatar": "🐼"},
            {"name": "小智", "level": [2, 3, 4], "avatar": "🦊"},
            {"name": "悠悠", "level": [3, 4, 5], "avatar": "🐱"},
        ]
        
        return OverviewStats(
            total_knowledge_points=total_kp,
            total_problems=total_prob,
            total_dialogues=total_diag,
            characters=characters
        )
    
    def to_dict(self) -> dict:
        """
        Convert knowledge base overview to dictionary for JSON serialization.
        
        Returns:
            Dictionary representation suitable for Flask JSON response
        """
        overview = self.get_overview()
        return {
            'total_knowledge_points': overview.total_knowledge_points,
            'total_problems': overview.total_problems,
            'total_dialogues': overview.total_dialogues,
            'characters': overview.characters
        }
