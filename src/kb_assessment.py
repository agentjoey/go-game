"""
Student Level Assessment Engine for YiGo Go Teaching

Assesses student Go level based on problem answers and game records.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
from collections import defaultdict

from kb_engine import GoKnowledgeBase
from kb_parser import Problem


@dataclass
class ProblemAnswer:
    """Record of a student's answer to a problem."""
    problem_id: str
    correct: bool
    time_seconds: int = 0
    hint_used: bool = False


@dataclass
class LevelAssessment:
    """Assessment result of student level based on problem answers."""
    estimated_level: int  # 1-5
    estimated_rank: str  # e.g., "30级", "20级", "1级"
    topic_scores: Dict[str, float]  # topic -> score (0.0-1.0)
    weak_areas: List[str]  # topics needing work
    strong_areas: List[str]  # topics mastered
    recommendations: List[str]  # suggested next steps

    def to_dict(self) -> dict:
        """Convert to dictionary for Flask JSON serialization."""
        return {
            'estimated_level': self.estimated_level,
            'estimated_rank': self.estimated_rank,
            'topic_scores': self.topic_scores,
            'weak_areas': self.weak_areas,
            'strong_areas': self.strong_areas,
            'recommendations': self.recommendations
        }


@dataclass
class GameAnalysis:
    """Analysis result of a game record."""
    opening_level: int  # 1-5 rating for opening
    midgame_level: int
    endgame_level: int
    life_and_death: int
    fighting_ability: int
    overall_level: int
    key_moves: List[dict]  # [{"move": 15, "quality": "good", "reason": "..."}]
    weak_points: List[str]
    recommendations: List[str]

    def to_dict(self) -> dict:
        """Convert to dictionary for Flask JSON serialization."""
        return {
            'opening_level': self.opening_level,
            'midgame_level': self.midgame_level,
            'endgame_level': self.endgame_level,
            'life_and_death': self.life_and_death,
            'fighting_ability': self.fighting_ability,
            'overall_level': self.overall_level,
            'key_moves': self.key_moves,
            'weak_points': self.weak_points,
            'recommendations': self.recommendations
        }


class AssessmentEngine:
    """
    Engine for assessing student Go level based on problem answers and game records.
    """

    def __init__(self, kb: GoKnowledgeBase):
        """
        Initialize the assessment engine.

        Args:
            kb: GoKnowledgeBase instance for problem retrieval
        """
        self.kb = kb
        # Level ranges mapping
        self.level_ranges = {
            1: (0, 30),  # 启蒙期
            2: (30, 20),  # 基础期
            3: (20, 10),  # 初级期
            4: (10, 1),  # 中级期
            5: (1, 0),  # 高级期
        }

    def assess_level(self, answers: List[ProblemAnswer]) -> LevelAssessment:
        """
        Assess student level based on problem answers.

        Args:
            answers: List of ProblemAnswer objects or dicts with keys:
                     problem_id, correct, time_seconds (optional), hint_used (optional)

        Returns:
            LevelAssessment object with estimated level, rank, and recommendations
        """
        # Convert dicts to ProblemAnswer if needed
        parsed_answers = []
        for ans in answers:
            if isinstance(ans, dict):
                parsed_answers.append(ProblemAnswer(
                    problem_id=ans.get('problem_id', ''),
                    correct=ans.get('correct', False),
                    time_seconds=ans.get('time', ans.get('time_seconds', 0)),
                    hint_used=ans.get('hint_used', False)
                ))
            else:
                parsed_answers.append(ans)

        if not parsed_answers:
            return LevelAssessment(
                estimated_level=1,
                estimated_rank="初学者",
                topic_scores={},
                weak_areas=[],
                strong_areas=[],
                recommendations=["开始学习围棋基础"]
            )

        # Group answers by topic
        topic_correct = defaultdict(lambda: {"correct": 0, "total": 0})
        for ans in parsed_answers:
            # Parse problem_id to get level and topic
            parts = ans.problem_id.split(".")
            if len(parts) >= 2:
                topic = ".".join(parts[:2])

                topic_correct[topic]["total"] += 1
                if ans.correct:
                    topic_correct[topic]["correct"] += 1
                    # Speed bonus: fast correct answers count more
                    if ans.time_seconds < 30:
                        topic_correct[topic]["correct"] += 0.2

        # Calculate topic scores
        topic_scores = {}
        for topic, data in topic_correct.items():
            if data["total"] > 0:
                topic_scores[topic] = min(1.0, data["correct"] / data["total"])

        # Determine overall level based on performance
        total_correct = sum(1 for a in parsed_answers if a.correct)
        accuracy = total_correct / len(parsed_answers) if parsed_answers else 0

        # Level estimation based on accuracy
        if accuracy >= 0.9:
            estimated_level = 5
        elif accuracy >= 0.75:
            estimated_level = 4
        elif accuracy >= 0.6:
            estimated_level = 3
        elif accuracy >= 0.4:
            estimated_level = 2
        else:
            estimated_level = 1

        # Rank string
        rank_map = {
            1: "30级",
            2: "20级",
            3: "10级",
            4: "5级",
            5: "1级+"
        }
        estimated_rank = rank_map.get(estimated_level, "初学者")

        # Identify weak and strong areas
        weak_areas = [t for t, s in topic_scores.items() if s < 0.5]
        strong_areas = [t for t, s in topic_scores.items() if s >= 0.8]

        # Recommendations
        recommendations = []
        if weak_areas:
            recommendations.append(f"建议加强练习: {', '.join(weak_areas[:3])}")
        if accuracy < 0.5:
            recommendations.append("建议重新学习当前级别的基础知识")
        elif accuracy >= 0.8:
            recommendations.append("可以开始挑战更高难度")

        return LevelAssessment(
            estimated_level=estimated_level,
            estimated_rank=estimated_rank,
            topic_scores=topic_scores,
            weak_areas=weak_areas,
            strong_areas=strong_areas,
            recommendations=recommendations
        )

    def get_next_problems(self, current_level: int,
                          weak_areas: List[str]) -> List[Problem]:
        """
        Get recommended next problems based on weak areas.

        Args:
            current_level: Current estimated level (1-5)
            weak_areas: List of weak topic areas to focus on

        Returns:
            List of Problem objects recommended for next practice
        """
        problems = []

        for area in weak_areas[:2]:  # Top 2 weak areas
            area_problems = self.kb.get_problems(level=current_level, count=5, topic=area)
            problems.extend(area_problems)

        # Fill remaining with level problems
        if len(problems) < 10:
            all_level_problems = self.kb.get_problems(level=current_level, count=20)
            for p in all_level_problems:
                if p not in problems:
                    problems.append(p)
                    if len(problems) >= 10:
                        break

        return problems[:10]

    def analyze_game_record(self, game_record: dict) -> GameAnalysis:
        """
        Analyze a game record and provide feedback.

        Args:
            game_record: Dictionary with keys:
                - moves: List of (player, row, col) tuples
                - result: "black_win" or "white_win"
                - captures: {"black": int, "white": int}

        Returns:
            GameAnalysis object with ratings and recommendations
        """
        moves = game_record.get("moves", [])
        total_moves = len(moves)

        # Phase detection
        if total_moves <= 20:
            opening_level = 3
            midgame_level = 0
            endgame_level = 0
        elif total_moves <= 60:
            opening_level = 3
            midgame_level = 2
            endgame_level = 0
        else:
            opening_level = 3
            midgame_level = 2
            endgame_level = 2

        # Life and death assessment (simplified - based on captures)
        captures = game_record.get("captures", {})
        total_captures = captures.get("black", 0) + captures.get("white", 0)
        if total_captures >= 10:
            life_and_death = 3
        elif total_captures >= 5:
            life_and_death = 2
        else:
            life_and_death = 1

        # Fighting ability
        fighting_ability = 2  # default
        if captures.get("black", 0) > captures.get("white", 0) * 2:
            fighting_ability = 3

        # Overall level (weighted average)
        overall_level = max(1, round(
            (opening_level + midgame_level + endgame_level + life_and_death + fighting_ability) / 5
        ))

        # Recommendations
        recommendations = []
        if opening_level >= 3:
            recommendations.append("布局基础较好，可学习中盘战术")
        if life_and_death < 2:
            recommendations.append("建议加强死活训练")
        if fighting_ability < 2:
            recommendations.append("提高中盘战斗力，多做练习题")

        return GameAnalysis(
            opening_level=opening_level,
            midgame_level=midgame_level,
            endgame_level=endgame_level,
            life_and_death=life_and_death,
            fighting_ability=fighting_ability,
            overall_level=overall_level,
            key_moves=[],
            weak_points=recommendations,
            recommendations=recommendations
        )