# 围棋学堂 - Go Learning Platform

> 青少儿围棋学习平台 | A Go (围棋) learning platform for young learners

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 功能 Features

| 模块 | 功能描述 |
|------|----------|
| **对弈模式** `/play` | 人机对弈，支持 AI 下棋逻辑 |
| **死活题** `/tsumego` | 10 道入门级死活题，带 AI 教练反馈 |
| **教程** `/tutorial` | 8 章围棋基础教程，带练习棋盘 |
| **棋谱管理** `/records` | 管理和回放历史对局 |
| **对局复盘** `/review` | 逐手回放分析 |

## 技术栈 Tech Stack

```
Frontend: HTML5 + CSS3 + Vanilla JavaScript
Backend:  Python 3.11 + Flask
Game AI:  Python GoEngine (启发式 + MCTS 模拟)
Storage:  Local JSON files
```

## 快速开始 Quick Start

```bash
# 克隆项目
git clone https://github.com/agentjoey/go-game.git
cd go-game

# 安装依赖
pip install flask

# 启动服务
python app.py
```

访问 http://127.0.0.1:1010

## 目录结构 Project Structure

```
go-game/
├── app.py              # Flask 主入口
├── src/
│   └── go_game.py     # Python 围棋规则引擎 + AI
├── static/
│   ├── css/
│   │   └── style.css  # 全局样式
│   └── js/
│       ├── go-board.js   # 棋盘 SVG 渲染
│       ├── go-game.js    # 游戏状态管理
│       ├── go-engine.js  # (规划中) 前端规则引擎
│       ├── go-ai.js      # (规划中) AI 策略层
│       └── *.js         # 各页面逻辑
├── templates/            # Jinja2 模板
├── data/                 # 死活题/教程 JSON 数据
└── tests/                # 单元测试
```

## AI 下棋逻辑 AI Architecture (规划中)

**Phase A:** 独立规则引擎
- `go-engine.js` — 纯 JS 围棋规则引擎（气/提子/打劫/自杀/终局计算）
- `/api/game/*` — Flask 验证 API

**Phase B:** AI 策略分层
- Layer 1: 必然走法（提子必应、救危子）
- Layer 2: 战术走法（眼位、连接、分割）
- Layer 3: 战略评估（MCTS 模拟）

## 开发规范 Development Standards

- Python: `black` 格式化，`pytest` 单元测试
- JS: ES6+，无框架依赖，原始实现
- CSS: BEM 命名约定，自定义 CSS 变量
- Git: Conventional Commits 规范

## 贡献 Contributing

1. Fork → Feature Branch → PR
2. 确保所有测试通过
3. 遵循现有代码风格

## 许可证 License

MIT License
