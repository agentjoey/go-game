"""
AI Teaching Engine for YiGo Go Teaching

Generates personalized AI teaching dialogues based on student level and game state.
Uses GoKnowledgeBase for knowledge retrieval and KBRAG for context building.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from kb_engine import GoKnowledgeBase
from kb_rag import KBRAG


@dataclass
class TeachingMoment:
    """Represents a teaching moment identified in the game."""
    topic: str           # "气", "吃子", "连接" etc.
    urgency: str         # "high", "medium", "low"
    description: str     # what happened in the game
    advice: str          # specific advice


@dataclass
class TeachingResponse:
    """Response from the teaching engine with dialogue and metadata."""
    character: str       # "阿呆", "小智", "悠悠"
    avatar: str          # "🐼", "🦊", "🐱"
    dialogue_type: str   # "warm_encouraging", "challenging", "socratic"
    topic: str
    ai_lines: List[str]  # what the AI says
    knowledge_refs: List[str]  # knowledge point IDs
    game_advice: str     # advice for current game situation
    context_used: str    # RAG context used

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            'character': self.character,
            'avatar': self.avatar,
            'dialogue_type': self.dialogue_type,
            'topic': self.topic,
            'ai_lines': self.ai_lines,
            'knowledge_refs': self.knowledge_refs,
            'game_advice': self.game_advice,
            'context_used': self.context_used
        }


@dataclass
class GameState:
    """Minimal game state for teaching analysis."""
    board_size: int = 19
    current_player: int = 1  # 1=black, 2=white
    last_move: Tuple[int, int] = None
    captures: Dict[int, int] = field(default_factory=dict)  # player -> count
    board: List[List[int]] = None  # 2D array, 0=empty, 1=black, 2=white


class TeachingEngine:
    """AI Teaching Engine that generates personalized teaching dialogues."""

    # AI Character definitions
    CHARACTERS = {
        "阿呆": {
            "level": [1, 2],
            "style": "warm_encouraging",
            "avatar": "🐼",
            "greeting": "小朋友，今天我们学习{}，来，一起加油！",
            "examples_prefix": "你看，就像这样..."
        },
        "小智": {
            "level": [2, 3, 4],
            "style": "challenging",
            "avatar": "🦊",
            "greeting": "嘿！{}这步棋有点意思，让我来考考你...",
            "examples_prefix": "试试这样下："
        },
        "悠悠": {
            "level": [3, 4, 5],
            "style": "socratic",
            "avatar": "🐱",
            "greeting": "{}...我们来想想，为什么会这样呢？",
            "examples_prefix": "记住这个道理："
        }
    }

    def __init__(self, knowledge_base: GoKnowledgeBase):
        """
        Initialize the teaching engine.

        Args:
            knowledge_base: GoKnowledgeBase instance for knowledge retrieval
        """
        self.kb = knowledge_base
        self.rag = KBRAG(knowledge_base)
        self.rag.index()

    def get_teaching_dialogue(
        self,
        student_level: int,
        game_state: dict = None,
        topic: str = None
    ) -> TeachingResponse:
        """
        Main entry point - generates a teaching dialogue.

        Args:
            student_level: Student's level (1-5)
            game_state: Optional game state dict for context-aware teaching
            topic: Optional specific topic to teach

        Returns:
            TeachingResponse with dialogue and references
        """
        # 1. Select character based on student level
        character = self._select_character(student_level)
        char_info = self.CHARACTERS[character]

        # 2. Analyze game state if provided
        teaching_moment = None
        if game_state:
            teaching_moment = self._analyze_game_state(game_state)

        # 3. Determine teaching topic
        if not topic:
            topic = teaching_moment.topic if teaching_moment else "围棋基础"

        # 4. Retrieve relevant knowledge via RAG
        context = self.rag.build_context(query=topic, level=student_level, top_k=3)

        # 5. Generate dialogue lines based on character style
        ai_lines = self._generate_dialogue(
            character=character,
            char_info=char_info,
            topic=topic,
            teaching_moment=teaching_moment,
            context=context
        )

        # 6. Get knowledge references
        knowledge_refs = self._get_knowledge_refs(topic, student_level)

        return TeachingResponse(
            character=character,
            avatar=char_info["avatar"],
            dialogue_type=char_info["style"],
            topic=topic,
            ai_lines=ai_lines,
            knowledge_refs=knowledge_refs,
            game_advice=teaching_moment.advice if teaching_moment else "",
            context_used=context
        )

    def _select_character(self, level: int) -> str:
        """Select AI character based on student level."""
        if level <= 2:
            return "阿呆"
        elif level <= 4:
            return "小智"
        else:
            return "悠悠"

    def _analyze_game_state(self, game_state: dict) -> TeachingMoment:
        """
        Analyze the game state and identify teaching moments.
        This is a simplified heuristic - in production could use AI analysis.
        """
        # Simple heuristics based on game state
        topic = "围棋基础"
        urgency = "medium"
        description = "当前棋局"
        advice = "继续观察，寻找机会。"

        # Check board state if available
        if game_state.get('board'):
            board = game_state['board']
            # Detect early game (mostly empty)
            filled = sum(1 for row in board for cell in row if cell != 0)
            if filled <= 5:
                topic = "布局基础"
                description = "开局阶段，适合学习布局"
                advice = "优先占角，注意棋子的连接"
            elif filled <= 30:
                topic = "中盘战斗"
                description = "中盘阶段，战斗开始"
                advice = "注意气的计算，寻找吃子机会"
            else:
                topic = "官子技巧"
                description = "收官阶段"
                advice = "计算目数，寻找最大的官子"

        return TeachingMoment(
            topic=topic,
            urgency=urgency,
            description=description,
            advice=advice
        )

    def _generate_dialogue(
        self,
        character: str,
        char_info: dict,
        topic: str,
        teaching_moment: TeachingMoment,
        context: str
    ) -> List[str]:
        """Generate dialogue lines based on character personality."""
        style = char_info["style"]
        greeting_template = char_info["greeting"]
        greeting = greeting_template.format(topic)

        lines = [greeting]

        if style == "warm_encouraging":
            lines.append(f"围棋的{topic}很重要哦！")
            lines.append("让我来教你一个好方法～")
            lines.append("不要着急，慢慢来一定能学会！")

        elif style == "challenging":
            lines.append(f"你知道吗？{topic}有很多技巧！")
            lines.append("让我来考考你：如果你这样下，会发生什么？")
            lines.append("错了也没关系，重要的是思考的过程！")

        elif style == "socratic":
            lines.append(f"关于{topic}，我想问你一个问题...")
            lines.append("为什么这个位置的棋子气更多呢？")
            lines.append("思考一下：连接和分断有什么区别？")

        return lines

    def _get_knowledge_refs(self, topic: str, level: int) -> List[str]:
        """Get relevant knowledge point IDs for a topic."""
        kps = self.kb.query(level=level, topic=topic)
        return [kp.id for kp in kps[:3]]


# Backwards compatibility alias
def teaching_dialogue(student_level: int, game_state: dict = None,
                      topic: str = None, knowledge_base: GoKnowledgeBase = None) -> TeachingResponse:
    """
    Convenience function for generating teaching dialogue.

    Args:
        student_level: Student's level (1-5)
        game_state: Optional game state dict
        topic: Optional teaching topic
        knowledge_base: GoKnowledgeBase instance (required for new calls)

    Returns:
        TeachingResponse with dialogue
    """
    if knowledge_base is None:
        raise ValueError("knowledge_base is required")
    engine = TeachingEngine(knowledge_base)
    return engine.get_teaching_dialogue(student_level, game_state, topic)
