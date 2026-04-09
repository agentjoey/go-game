"""
Knowledge Base Markdown Parser for YiGo Go Teaching

Parses Obsidian Markdown knowledge base files into structured Python objects.
"""

import re
from dataclasses import dataclass, field
from typing import List, Tuple, Optional
from pathlib import Path


# Obsidian Knowledge Base Path
OBSIDIAN_PATH = Path("/Users/xtation/Library/Mobile Documents/iCloud~md~obsidian/Documents/Brain#2/10_Projects/P020-Go-Learning/04_Knowledge_Base/")


@dataclass
class DialogueEntry:
    """Represents a dialogue entry in teaching materials."""
    role: str  # e.g., "阿呆", "小朋友"
    avatar: str  # e.g., "🐼"
    content: str

    def to_dict(self) -> dict:
        return {
            'role': self.role,
            'avatar': self.avatar,
            'content': self.content
        }


@dataclass
class KnowledgePoint:
    """Represents a single knowledge point in the Go teaching curriculum."""
    id: str  # e.g., "1.2.1"
    title: str  # e.g., "什么是气"
    level: int  # 1-5
    section: str  # e.g., "气的概念"
    concepts: List[str] = field(default_factory=list)
    teaching_goals: List[str] = field(default_factory=list)
    dialogue_examples: List[DialogueEntry] = field(default_factory=list)
    common_mistakes: List[Tuple[str, str]] = field(default_factory=list)  # (wrong, correct)
    difficulty: str = "easy"  # "easy", "medium", "hard"

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'title': self.title,
            'level': self.level,
            'section': self.section,
            'concepts': self.concepts,
            'teaching_goals': self.teaching_goals,
            'dialogue_examples': [d.to_dict() for d in self.dialogue_examples],
            'common_mistakes': [{'wrong': m[0], 'correct': m[1]} for m in self.common_mistakes],
            'difficulty': self.difficulty
        }


@dataclass
class Problem:
    """Represents a problem/exercise in the problem set."""
    id: str
    level: int
    topic: str
    question_type: str  # "multiple_choice", "true_false", "fill_blank", "tsumego", "identification"
    question: str
    answer: str
    explanation: str = ""
    difficulty: str = "easy"

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'level': self.level,
            'topic': self.topic,
            'question_type': self.question_type,
            'question': self.question,
            'answer': self.answer,
            'explanation': self.explanation,
            'difficulty': self.difficulty
        }


@dataclass
class LearningPathItem:
    """Represents a step in the learning path."""
    step: int
    title: str
    knowledge_points: List[str] = field(default_factory=list)
    practice_games: int = 0
    estimated_time: str = ""

    def to_dict(self) -> dict:
        return {
            'step': self.step,
            'title': self.title,
            'knowledge_points': self.knowledge_points,
            'practice_games': self.practice_games,
            'estimated_time': self.estimated_time
        }


class KBMarkdownParser:
    """
    Parser for YiGo Go teaching knowledge base Markdown files.
    
    Parses:
    - Level_X_Knowledge_Details.md -> List[KnowledgePoint]
    - Level_X_Problem_Set.md -> List[Problem]
    - Level_X_Learning_Path.md -> List[LearningPathItem]
    - Level_X_AI_Dialogue_Scripts.md -> List[DialogueEntry]
    """
    
    # Regex patterns for parsing
    # Knowledge point header: ### 📚 知识点 X.Y.Z: Title
    KNOWLEDGE_POINT_PATTERN = re.compile(r'^### 📚 知识点 (\d+\.\d+\.\d+):\s*(.+)$')
    
    # Section header: ## X.Y 标题
    SECTION_PATTERN = re.compile(r'^## (\d+\.\d+)\s+(.+)$')
    
    # Teaching goals: - [ ] or - [x]
    TEACHING_GOAL_PATTERN = re.compile(r'^-\s+\[([ x])\]\s*(.+)$')
    
    # Dialogue examples: > 🐼 **阿呆**:, > 🦊 **小智**:, etc.
    DIALOGUE_PATTERN = re.compile(r'^>\s*([^\s]+)\s+\*\*([^*]+)\*\*:\s*(.+)$')
    
    # Alternative dialogue with role only: > **阿呆**:
    DIALOGUE_ALT_PATTERN = re.compile(r'^>\s*\*\*([^*]+)\*\*:\s*(.+)$')
    
    # Common mistakes table: | wrong | correct |
    COMMON_MISTAKE_ROW_PATTERN = re.compile(r'^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$')
    
    # Problem header: ### 题目 X.X.X-X [题型] or ## 题目 X
    PROBLEM_HEADER_PATTERN = re.compile(r'^#{1,3}\s*题目\s*[\d\.]+[-–]?\d*\s*\[?([^\]]*)\]?', re.IGNORECASE)
    
    # Answer line
    ANSWER_PATTERN = re.compile(r'^\*\*答案\*\*:\s*(.+)$', re.IGNORECASE)
    
    # Difficulty markers
    DIFFICULTY_EASY = re.compile(r'🌱|简单|容易', re.IGNORECASE)
    DIFFICULTY_MEDIUM = re.compile(r'🌿|中等|普通', re.IGNORECASE)
    DIFFICULTY_HARD = re.compile(r'🌳|困难|挑战', re.IGNORECASE)
    
    def __init__(self):
        """Initialize the parser."""
        self.current_section = ""
        self.current_level = 1
    
    def parse_knowledge_details(self, content: str, level: int) -> List[KnowledgePoint]:
        """
        Parse knowledge details Markdown content.
        
        Args:
            content: Markdown content as string
            level: Level number (1-5)
            
        Returns:
            List of KnowledgePoint objects
        """
        self.current_level = level
        self.current_section = ""
        
        lines = content.split('\n')
        knowledge_points = []
        current_kp: Optional[KnowledgePoint] = None
        current_concepts = []
        current_goals = []
        current_dialogues = []
        current_mistakes = []
        in_table = False
        table_headers_seen = False
        
        i = 0
        while i < len(lines):
            line = lines[i]
            
            # Check for section header (must come before knowledge point)
            section_match = self.SECTION_PATTERN.match(line)
            if section_match:
                self.current_section = section_match.group(2).strip()
                i += 1
                continue
            
            # Check for knowledge point header
            kp_match = self.KNOWLEDGE_POINT_PATTERN.match(line)
            if kp_match:
                # Save previous knowledge point if exists
                if current_kp:
                    current_kp.concepts = current_concepts.copy()
                    current_kp.teaching_goals = current_goals.copy()
                    current_kp.dialogue_examples = current_dialogues.copy()
                    current_kp.common_mistakes = current_mistakes.copy()
                    knowledge_points.append(current_kp)
                
                # Start new knowledge point
                current_kp = KnowledgePoint(
                    id=kp_match.group(1),
                    title=kp_match.group(2).strip(),
                    level=level,
                    section=self.current_section,
                    difficulty=self._detect_difficulty(line)
                )
                current_concepts = []
                current_goals = []
                current_dialogues = []
                current_mistakes = []
                in_table = False
                table_headers_seen = False
                i += 1
                continue
            
            # If we have a current knowledge point, parse its content
            if current_kp:
                # Check for teaching goals
                goal_match = self.TEACHING_GOAL_PATTERN.match(line)
                if goal_match:
                    current_goals.append(goal_match.group(2).strip())
                    i += 1
                    continue
                
                # Check for dialogue examples
                dialogue_match = self.DIALOGUE_PATTERN.match(line)
                if dialogue_match:
                    avatar = dialogue_match.group(1)
                    role = dialogue_match.group(2)
                    content_text = dialogue_match.group(3)
                    current_dialogues.append(DialogueEntry(
                        role=role,
                        avatar=avatar,
                        content=content_text.strip()
                    ))
                    i += 1
                    continue
                
                # Alternative dialogue format: > **阿呆**:
                dialogue_alt_match = self.DIALOGUE_ALT_PATTERN.match(line)
                if dialogue_alt_match and '**:' not in dialogue_alt_match.group(1):
                    # Skip blockquote markers that aren't dialogues
                    pass
                
                # Check for common mistakes table
                if '|' in line and ('错误' in line or '正确' in line or table_headers_seen):
                    if not table_headers_seen:
                        table_headers_seen = True
                        in_table = True
                        i += 1
                        continue
                    
                    mistake_match = self.COMMON_MISTAKE_ROW_PATTERN.match(line)
                    if mistake_match and '---' not in line:
                        wrong = mistake_match.group(1).strip()
                        correct = mistake_match.group(2).strip()
                        if wrong and correct and '错误行为' not in wrong and '正确做法' not in wrong:
                            # Clean up any emojis or markers
                            wrong = re.sub(r'^❌\s*', '', wrong)
                            correct = re.sub(r'^✅\s*', '', correct)
                            if wrong and correct:
                                current_mistakes.append((wrong, correct))
                        i += 1
                        continue
                    elif '---' in line:
                        i += 1
                        continue
                    else:
                        in_table = False
                        table_headers_seen = False
                
                # Check for concept keywords (基础概念, 基本规则, etc.)
                if line.strip().startswith('**') and ('概念' in line or '规则' in line or '定义' in line):
                    i += 1
                    continue
                
                # Extract concepts from bullet points under基础概念
                if line.strip().startswith('-') and not line.strip().startswith('- ['):
                    concept = line.strip().lstrip('-*').strip()
                    if concept and len(concept) < 100:  # Avoid long lines
                        current_concepts.append(concept)
            
            i += 1
        
        # Save last knowledge point
        if current_kp:
            current_kp.concepts = current_concepts.copy()
            current_kp.teaching_goals = current_goals.copy()
            current_kp.dialogue_examples = current_dialogues.copy()
            current_kp.common_mistakes = current_mistakes.copy()
            knowledge_points.append(current_kp)
        
        return knowledge_points
    
    def parse_problem_set(self, content: str, level: int) -> List[Problem]:
        """
        Parse problem set Markdown content.
        
        Args:
            content: Markdown content as string
            level: Level number (1-5)
            
        Returns:
            List of Problem objects
        """
        lines = content.split('\n')
        problems = []
        
        current_problem: Optional[Problem] = None
        current_question = ""
        current_answer = ""
        current_explanation = ""
        current_topic = ""
        question_type = "identification"
        in_options = False
        
        i = 0
        while i < len(lines):
            line = lines[i]
            
            # Check for section header (topic)
            section_match = self.SECTION_PATTERN.match(line)
            if section_match:
                current_topic = section_match.group(2).strip()
                i += 1
                continue
            
            # Check for problem header
            problem_match = re.search(r'(?:###|##)\s*题目\s*([\d\.]+[-–]?\d*)\s*\[?([^\]]*)\]?', line, re.IGNORECASE)
            if problem_match:
                # Save previous problem
                if current_problem:
                    current_problem.explanation = current_explanation.strip()
                    problems.append(current_problem)
                
                problem_id = problem_match.group(1)
                raw_type = problem_match.group(2).strip() if problem_match.group(2) else ""
                question_type = self._normalize_question_type(raw_type)
                
                current_problem = Problem(
                    id=problem_id,
                    level=level,
                    topic=current_topic,
                    question_type=question_type,
                    question="",
                    answer=""
                )
                current_question = ""
                current_answer = ""
                current_explanation = ""
                in_options = False
                i += 1
                continue
            
            # If we have a current problem, parse its content
            if current_problem:
                # Question line
                question_match = re.match(r'^\*\*题目\*\*:\s*(.+)$', line, re.IGNORECASE)
                if question_match:
                    current_question = question_match.group(1).strip()
                    current_problem.question = current_question
                    i += 1
                    continue
                
                # Options (A., B., C., D.)
                option_match = re.match(r'^\s*([A-D])[\.、]\s*(.+)$', line)
                if option_match:
                    current_question += f"\n{option_match.group(1)}. {option_match.group(2)}"
                    current_problem.question = current_question
                    in_options = True
                    i += 1
                    continue
                
                # Answer line
                answer_match = re.match(r'^\*\*答案\*\*:\s*(.+)$', line, re.IGNORECASE)
                if answer_match:
                    current_answer = answer_match.group(1).strip()
                    current_problem.answer = current_answer
                    i += 1
                    continue
                
                # Explanation line
                explanation_match = re.match(r'^\*\*解析\*\*:\s*(.+)$', line, re.IGNORECASE)
                if explanation_match:
                    current_explanation = explanation_match.group(1).strip()
                    i += 1
                    continue
                
                # Continuation of question (indented or code blocks)
                if line.strip() and not line.startswith('#') and not line.startswith('- '):
                    if current_question and not current_answer:
                        current_question += " " + line.strip()
                        current_problem.question = current_question
                
                # Diagram/code block (preserve formatting)
                if line.strip().startswith('```'):
                    if current_question:
                        current_question += "\n" + line.strip()
                        current_problem.question = current_question
            else:
                # Outside any problem, look for standalone question content
                if line.strip() and not line.startswith('#') and '---' not in line:
                    pass  # Skip random content outside problems
            
            i += 1
        
        # Save last problem
        if current_problem:
            current_problem.explanation = current_explanation.strip()
            problems.append(current_problem)
        
        return problems
    
    def parse_learning_path(self, content: str, level: int) -> List[LearningPathItem]:
        """
        Parse learning path Markdown content.
        
        Args:
            content: Markdown content as string
            level: Level number (1-5)
            
        Returns:
            List of LearningPathItem objects
        """
        lines = content.split('\n')
        path_items = []
        current_item: Optional[LearningPathItem] = None
        
        for line in lines:
            # Parse table rows for stages
            # Pattern: | 🌱 阶段一 | 认识围棋 | 2-3天 | ⬜ | - |
            stage_row_match = re.search(r'\|\s*[🌱🌿🌳]+\s*阶段\s*([一二三四五\d]+)\s*\|\s*([^|]+?)\s*\|\s*([\d–-]+天?)\s*\|', line)
            if stage_row_match:
                # Save previous item
                if current_item:
                    path_items.append(current_item)
                
                step_num = self._chinese_to_number(stage_row_match.group(1))
                title = stage_row_match.group(2).strip()
                time_est = stage_row_match.group(3).strip()
                
                current_item = LearningPathItem(
                    step=step_num,
                    title=title,
                    estimated_time=time_est
                )
                continue
            
            # Knowledge point rows: | ├─ 1.1.1 | 认识围棋 | 1天 | ⬜ | - |
            kp_row_match = re.search(r'\|\s*├─\s*([\d\.]+)\s*\|\s*([^|]+?)\s*\|', line)
            if kp_row_match and current_item:
                kp_id = kp_row_match.group(1).strip()
                kp_name = kp_row_match.group(2).strip()
                if kp_name and '---' not in kp_name and len(current_item.knowledge_points) < 20:
                    current_item.knowledge_points.append(f"{kp_id} {kp_name}")
                continue
            
            # Practice games: | ├─ 实战 | 20盘 |
            practice_match = re.search(r'\|\s*├─\s*实战\s*\|\s*(\d+)\s*盘', line)
            if practice_match and current_item:
                current_item.practice_games = int(practice_match.group(1))
                continue
        
        # Save last item
        if current_item:
            path_items.append(current_item)
        
        return path_items
    
    def _chinese_to_number(self, chinese: str) -> int:
        """Convert Chinese number to integer."""
        mapping = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9}
        try:
            return int(chinese)
        except:
            return mapping.get(chinese, 0)
    
    def parse_dialogue_scripts(self, content: str, level: int) -> List[DialogueEntry]:
        """
        Parse AI dialogue scripts Markdown content.
        
        Args:
            content: Markdown content as string
            level: Level number (1-5)
            
        Returns:
            List of DialogueEntry objects
        """
        lines = content.split('\n')
        dialogues = []
        
        in_code_block = False
        
        for line in lines:
            # Track code blocks
            if line.strip().startswith('```'):
                in_code_block = not in_code_block
                continue
            
            # Only parse dialogue inside code blocks
            if in_code_block:
                # Primary dialogue pattern: 🐼 阿呆: "content" or 🐼 阿呆: "content
                # Note: different format - no > prefix inside code blocks
                code_match = re.match(r'^\s*([^\s]+)\s+([^*"]+):\s*["""\'](.+)[ """\']', line)
                if code_match:
                    avatar = code_match.group(1)
                    role = code_match.group(2)
                    content_text = code_match.group(3)
                    dialogues.append(DialogueEntry(
                        role=role.strip(),
                        avatar=avatar.strip(),
                        content=content_text.strip()
                    ))
                    continue
                
                # Alternative inside code blocks: 🐼 阿呆: content
                code_alt_match = re.match(r'^\s*([^\s]+)\s+([^:]+):\s*(.+)$', line)
                if code_alt_match:
                    avatar = code_alt_match.group(1)
                    role = code_alt_match.group(2)
                    content_text = code_alt_match.group(3).strip()
                    # Skip lines that look like stage headers or notes
                    if '阶段' not in content_text and '练习' not in content_text and len(content_text) > 2:
                        dialogues.append(DialogueEntry(
                            role=role.strip(),
                            avatar=avatar.strip(),
                            content=content_text.strip().strip('"').strip("'")
                        ))
                    continue
            
            # Primary dialogue pattern (blockquote style): > 🐼 **阿呆**: content
            match = self.DIALOGUE_PATTERN.match(line)
            if match:
                avatar = match.group(1)
                role = match.group(2)
                content_text = match.group(3)
                dialogues.append(DialogueEntry(
                    role=role,
                    avatar=avatar,
                    content=content_text.strip()
                ))
                continue
            
            # Alternative: > **阿呆**: content (no avatar emoji)
            alt_match = re.match(r'^>\s*\*\*([^*]+)\*\*:\s*(.+)$', line)
            if alt_match:
                role = alt_match.group(1)
                content_text = alt_match.group(2)
                # Infer avatar from role
                avatar = self._infer_avatar(role)
                dialogues.append(DialogueEntry(
                    role=role,
                    avatar=avatar,
                    content=content_text.strip()
                ))
        
        return dialogues
    
    def _detect_difficulty(self, text: str) -> str:
        """Detect difficulty level from text."""
        if self.DIFFICULTY_HARD.search(text):
            return "hard"
        elif self.DIFFICULTY_MEDIUM.search(text):
            return "medium"
        else:
            return "easy"
    
    def _normalize_question_type(self, raw_type: str) -> str:
        """Normalize question type string."""
        raw_type = raw_type.lower().strip()
        
        type_mapping = {
            '选择题': 'multiple_choice',
            '判断题': 'true_false',
            '判断': 'true_false',
            '填空题': 'fill_blank',
            '填空': 'fill_blank',
            '计算题': 'calculation',
            '计算': 'calculation',
            '识别题': 'identification',
            '识别': 'identification',
            '数气题': 'counting',
            '题库': 'tsumego',
            '实战题': 'tsumego',
        }
        
        for key, value in type_mapping.items():
            if key in raw_type:
                return value
        
        return 'identification'
    
    def _infer_avatar(self, role: str) -> str:
        """Infer avatar emoji from role name."""
        role_avatar_map = {
            '阿呆': '🐼',
            '小智': '🦊',
            '悠悠': '🐱',
            '小朋友': '👶',
            '学生': '👦',
            '老师': '👨‍🏫',
            '阿花': '🐰',
        }
        
        for key, avatar in role_avatar_map.items():
            if key in role:
                return avatar
        
        return '👤'


def main():
    """Test the parser with Level_1_Knowledge_Details.md"""
    import sys
    
    kb_path = OBSIDIAN_PATH / "Level_1" / "Level_1_Knowledge_Details.md"
    
    if not kb_path.exists():
        print(f"Error: File not found: {kb_path}")
        sys.exit(1)
    
    content = kb_path.read_text(encoding='utf-8')
    parser = KBMarkdownParser()
    
    print(f"Parsing: {kb_path}")
    print("=" * 60)
    
    knowledge_points = parser.parse_knowledge_details(content, 1)
    
    print(f"\nParsed {len(knowledge_points)} knowledge points\n")
    
    for kp in knowledge_points[:3]:  # Show first 3
        print(f"ID: {kp.id}")
        print(f"Title: {kp.title}")
        print(f"Section: {kp.section}")
        print(f"Difficulty: {kp.difficulty}")
        print(f"Teaching Goals: {len(kp.teaching_goals)} items")
        print(f"Dialogue Examples: {len(kp.dialogue_examples)} entries")
        print(f"Common Mistakes: {len(kp.common_mistakes)} items")
        print("-" * 40)
    
    if len(knowledge_points) > 3:
        print(f"... and {len(knowledge_points) - 3} more knowledge points")


if __name__ == "__main__":
    main()
