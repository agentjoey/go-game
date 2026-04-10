# YiGo 知识库引擎开发计划

**项目**: go-game 知识库引擎
**日期**: 2026-04-10
**知识库**: ~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Brain#2/10_Projects/P020-Go-Learning/04_Knowledge_Base/

---

## 知识库结构分析

```
04_Knowledge_Base/
├── INDEX.md                          # 总索引
├── YiGo_Knowledge_Base_Structure_v1.0.md  # 知识体系结构
├── Level_1/ 🌱 启蒙期 (0→30级)
│   ├── Level_1_Knowledge_Details.md   # 14个知识点
│   ├── Level_1_Problem_Set.md         # 约50题
│   ├── Level_1_AI_Dialogue_Scripts.md # 阿呆对话脚本
│   └── Level_1_Learning_Path.md      # 学习路径
├── Level_2/ 🌿 基础期 (30→20级)
│   ├── Level_2_Knowledge_Details.md   # 12个知识点
│   ├── Level_2_Problem_Set.md
│   ├── Level_2_AI_Dialogue_Scripts.md # 小智对话脚本
│   └── Level_2_Learning_Path.md
├── Level_3/ 🌲 初级期 (20→10级)
│   ├── Level_3_Knowledge_Details.md
│   ├── Level_3_Problem_Set.md
│   └── Level_3_Learning_Path.md       # 悠悠对话脚本
├── Level_4/ 🌳 中级期 (10→1级)
│   ├── Level_4_Knowledge_Details.md
│   ├── Level_4_Problem_Set.md
│   └── Level_4_Learning_Path.md
├── Level_5/ 🌲🌲🌲 高级期 (1级→业余段)
│   ├── Level_5_Knowledge_Details.md
│   ├── Level_5_Problem_Set.md
│   └── Level_5_Learning_Path.md
├── AI_Dialogue_Scripts_You_You.md    # 悠悠AI脚本
├── Go_Teaching_Resources_v1.0.md     # 教学资源
└── GoMagic_Teaching_Method_Analysis_v1.0.md  # 教学方法分析
```

---

## 引擎架构设计

### 核心模块

```
src/
├── kb_engine.py          # 知识库引擎核心 (索引 + 查询)
├── kb_parser.py          # Markdown 解析器
├── kb_rag.py             # RAG 检索模块
├── kb_teaching.py        # AI 教学引擎
└── kb_assessment.py      # 水平评估 + 出题匹配
```

### API 设计

```
GET /api/kb/query?level=1&topic=气        # 查询知识点
GET /api/kb/problems?level=2&count=5      # 获取练习题
GET /api/kb/dialogue?level=3&situation=吃子  # 获取教学对话
GET /api/kb/assess?game_record=<base64>  # 根据棋谱评估水平
POST /api/kb/rag                          # RAG 检索（供 AI 用）
```

---

## 任务清单

| # | 任务 | 文件 | 说明 |
|---|------|------|------|
| 1 | 创建 kb_parser.py — Markdown 解析器 | `src/kb_parser.py` | 解析 Level_X_Knowledge_Details.md |
| 2 | 创建 kb_engine.py — 知识库索引引擎 | `src/kb_engine.py` | 索引所有文档，支持查询 |
| 3 | 创建 kb_rag.py — RAG 检索模块 | `src/kb_rag.py` | 嵌入向量检索 |
| 4 | 创建 kb_teaching.py — 教学引擎 | `src/kb_teaching.py` | AI 教学对话生成 |
| 5 | 创建 kb_assessment.py — 水平评估 | `src/kb_assessment.py` | 棋谱 + 题库评估 |
| 6 | 添加 Flask 路由 | `app.py` | 暴露 KB API |
| 7 | 最终验证 + Git push | — | — |

---

### Task 1: kb_parser.py — Markdown 解析器

**目标**: 将结构化 Markdown 解析为 Python 对象。

**输入格式示例** (Level_X_Knowledge_Details.md):
```markdown
### 📚 知识点 1.2.1: 什么是气

#### 基础概念
"气"是棋子的生命线！...

#### 教学目标
- [ ] 理解"气"的概念
- [ ] 能数出单个棋子的气

#### 教学对话示例 (阿呆)
> 🐼 **阿呆**: "..."

#### 常见错误
| 错误行为 | 正确做法 |
```

**输出结构**:
```python
@dataclass
class KnowledgePoint:
    id: str           # "1.2.1"
    title: str        # "什么是气"
    level: int        # 1
    section: str      # "气的概念"
    concepts: List[str]  # ["气的定义", "气的数量", "气的可视化"]
    teaching_goals: List[str]
    dialogue_examples: List[DialogueEntry]  # [(role, content), ...]
    common_mistakes: List[Tuple[str, str]]
    difficulty: str   # "easy", "medium", "hard"
```

**实现要点**:
- 用正则解析 `### 📚 知识点 X.Y.Z: Title` 标题
- 解析 `- [ ]` 和 `- [x]` 为教学目标
- 解析 `> 🐼 **阿呆**:` 格式的对话
- 解析表格 `| col1 | col2 |` 为常见错误
- 文件路径用 Glob 模式匹配 Level_X/Knowledge_Details.md

**Commit**: `feat(kb): add kb_parser.py for markdown knowledge parsing`

---

### Task 2: kb_engine.py — 知识库索引引擎

**目标**: 索引所有知识库文件，提供查询 API。

**功能**:
1. **索引**: 启动时加载所有 Markdown 文件，建立内存索引
2. **查询**: 按 level、topic、keyword 查询知识点
3. **导航**: 获取某 level 的所有知识点列表
4. **统计**: 知识库概览（各 level 题数、知识点数）

**类设计**:
```python
class GoKnowledgeBase:
    def __init__(self, kb_path: str):
        self.parser = KBMarkdownParser()
        self.knowledge_points: Dict[str, KnowledgePoint] = {}
        self.problems: Dict[int, List[Problem]] = {}  # level -> problems
        self.dialogue_scripts: Dict[int, List[DialogueScript]] = {}
        
    def load_all(self):
        """加载所有知识库文件"""
        
    def query(self, level: int = None, topic: str = None, 
              keyword: str = None) -> List[KnowledgePoint]:
        """查询知识点"""
        
    def get_knowledge_point(self, level: int, point_id: str) -> KnowledgePoint:
        """获取指定知识点"""
        
    def get_problems(self, level: int, count: int = 10, 
                     topic: str = None) -> List[Problem]:
        """获取练习题"""
        
    def get_dialogue(self, level: int, situation: str = None) -> DialogueScript:
        """获取教学对话脚本"""
        
    def get_learning_path(self, level: int) -> LearningPath:
        """获取学习路径"""
        
    def get_overview(self) -> dict:
        """获取知识库总览"""
```

**Commit**: `feat(kb): add kb_engine.py - knowledge base indexing engine`

---

### Task 3: kb_rag.py — RAG 检索模块

**目标**: 为 AI 教学提供上下文检索（Retrieval Augmented Generation）。

**功能**:
1. **文本嵌入**: 使用 TAVILY_API_KEY 或简单关键词检索
2. **向量存储**: 内存向量库（轻量级，无需额外服务）
3. **相似度检索**: 给定查询，返回最相关的 N 个知识点/段落
4. **上下文组装**: 将检索结果格式化为 AI prompt 上下文

**类设计**:
```python
class KBRAG:
    def __init__(self, knowledge_base: GoKnowledgeBase):
        self.kb = knowledge_base
        self.chunks: List[KBChunk] = []  # 已切分的知识块
        
    def index(self):
        """将所有知识库内容切分为 chunk 并建立索引"""
        # 1. 解析所有文档
        # 2. 按段落切分
        # 3. 为每个 chunk 生成元数据 (level, type, topic)
        
    def retrieve(self, query: str, top_k: int = 5, 
                 level: int = None) -> List[RetrievedChunk]:
        """检索最相关的知识块"""
        # 方案A: 关键词 BM25 (无外部依赖)
        # 方案B: TAVILY_API_KEY 嵌入向量搜索
        pass
        
    def build_context(self, query: str, level: int = None) -> str:
        """为 AI 构建 prompt 上下文"""
        chunks = self.retrieve(query, top_k=5, level=level)
        return self._format_chunks(chunks)
```

**Commit**: `feat(kb): add kb_rag.py - RAG retrieval module for AI teaching`

---

### Task 4: kb_teaching.py — AI 教学引擎

**目标**: 根据学生水平和游戏状态，生成个性化教学对话。

**类设计**:
```python
class TeachingEngine:
    # AI 角色映射
    CHARACTERS = {
        "阿呆": {"level": [1, 2], "style": "warm_encouraging", "avatar": "🐼"},
        "小智": {"level": [2, 3, 4], "style": "challenging", "avatar": "🦊"},
        "悠悠": {"level": [3, 4, 5], "style": "socratic", "avatar": "🐱"},
    }
    
    def __init__(self, knowledge_base: GoKnowledgeBase, rag: KBRAG):
        self.kb = kb
        self.rag = rag
        
    def get_teaching_dialogue(
        self,
        student_level: int,
        game_state: GameState,  # 当前棋局状态
        topic: str = None       # 教学主题（可选）
    ) -> TeachingResponse:
        """
        根据学生水平和棋局状态，返回教学对话内容。
        """
        # 1. 确定 AI 角色
        character = self._select_character(student_level)
        
        # 2. 分析棋局，识别教学时机
        teaching_moment = self._analyze_game_state(game_state)
        
        # 3. 检索相关知识
        context = self.rag.build_context(
            query=teaching_moment.topic,
            level=student_level
        )
        
        # 4. 获取对应角色的对话脚本风格
        style = self.CHARACTERS[character]["style"]
        
        # 5. 返回 TeachingResponse
        return TeachingResponse(
            character=character,
            avatar=self.CHARACTERS[character]["avatar"],
            dialogue_type=style,
            topic=teaching_moment.topic,
            ai_lines=...,  # AI 说的话
            game_advice=...,  # 针对棋局的建议
            knowledge_refs=...  # 引用的知识点
        )
        
    def _select_character(self, level: int) -> str:
        """根据学生水平选择合适的 AI 角色"""
        if level <= 2:
            return "阿呆"
        elif level <= 4:
            return "小智"
        else:
            return "悠悠"
            
    def _analyze_game_state(self, game_state: GameState) -> TeachingMoment:
        """分析棋局，识别教学时机"""
        # 检测: 危险棋子、布局问题、死活问题等
        pass
```

**Commit**: `feat(kb): add kb_teaching.py - AI teaching engine with character system`

---

### Task 5: kb_assessment.py — 水平评估引擎

**目标**: 通过题库和棋谱评估学生真实水平。

**类设计**:
```python
class AssessmentEngine:
    def __init__(self, knowledge_base: GoKnowledgeBase):
        self.kb = kb
        
    def assess_level(self, answers: List[ProblemAnswer]) -> LevelAssessment:
        """
        根据答题结果评估水平。
        answers: [{"problem_id": "1.2.1", "correct": True, "time": 30}, ...]
        """
        # 1. 统计各 topic 正确率
        # 2. 结合正确率和速度评估
        # 3. 返回等级估计和建议
        pass
        
    def get_next_problems(self, current_level: int, 
                          weak_areas: List[str]) -> List[Problem]:
        """
        根据薄弱环节，推荐下一组练习题。
        """
        # 1. 找到薄弱 topic 对应的知识点
        # 2. 从题库中筛选
        # 3. 按难度递进排序
        pass
        
    def analyze_game_record(self, game_record: GameRecord) -> GameAnalysis:
        """
        分析一盘棋，给出水平评估和改进建议。
        game_record: {"moves": [...], "result": "black_win", "captures": {...}}
        """
        # 1. 检测棋局阶段（开局/中盘/官子）
        # 2. 识别关键手（好棋/坏棋）
        # 3. 对照知识库推荐相关学习内容
        pass
```

**Commit**: `feat(kb): add kb_assessment.py - student level assessment engine`

---

### Task 6: Flask API 路由

**在 app.py 添加**:

```python
from kb_engine import GoKnowledgeBase
from kb_teaching import TeachingEngine
from kb_assessment import AssessmentEngine

# 初始化知识库
kb = GoKnowledgeBase(kb_path="...")
teaching = TeachingEngine(kb)
assessment = AssessmentEngine(kb)

@app.route('/api/kb/overview')
def api_kb_overview():
    return jsonify(kb.get_overview())

@app.route('/api/kb/query')
def api_kb_query():
    level = request.args.get('level', type=int)
    topic = request.args.get('topic')
    keyword = request.args.get('keyword')
    results = kb.query(level=level, topic=topic, keyword=keyword)
    return jsonify({'results': [kp.__dict__ for kp in results]})

@app.route('/api/kb/problems')
def api_kb_problems():
    level = request.args.get('level', type=int)
    count = request.args.get('count', default=10, type=int)
    topic = request.args.get('topic')
    problems = kb.get_problems(level, count, topic)
    return jsonify({'problems': [p.__dict__ for p in problems]})

@app.route('/api/kb/dialogue')
def api_kb_dialogue():
    level = request.args.get('level', type=int)
    situation = request.args.get('situation')
    script = kb.get_dialogue(level, situation)
    return jsonify(script.__dict__)

@app.route('/api/kb/teach', methods=['POST'])
def api_kb_teach():
    data = request.json
    game_state = data.get('gameState')
    student_level = data.get('level', 1)
    response = teaching.get_teaching_dialogue(student_level, game_state)
    return jsonify(response.__dict__)

@app.route('/api/kb/assess', methods=['POST'])
def api_kb_assess():
    data = request.json
    answers = data.get('answers', [])
    result = assessment.assess_level(answers)
    return jsonify(result.__dict__)
```

**Commit**: `feat(kb): add Flask API routes for knowledge base engine`

---

### Task 7: 验证 + Push

```bash
cd ~/projects/go-game
python3 -c "
from src.kb_parser import KBMarkdownParser
from src.kb_engine import GoKnowledgeBase
print('KB engine imports OK')
"
# 验证 API
python app.py &
curl -s http://127.0.0.1:1010/api/kb/overview | python3 -m json.tool
git add -A && git commit -m "feat(kb): complete YiGo knowledge base engine (Phase C)" && git push
```

---

## 验证清单

- [ ] kb_parser.py 能正确解析 Level_1_Knowledge_Details.md
- [ ] kb_engine.py 能加载所有 5 个 level 的文档
- [ ] kb_rag.py retrieve() 返回相关知识块
- [ ] teaching engine 正确选择 AI 角色
- [ ] Flask /api/kb/* 所有路由正常工作
- [ ] git push 成功
