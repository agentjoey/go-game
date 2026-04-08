# �围棋 Go Game

一个用 Python 实现的完整围棋游戏，支持 AI 对战。

## 功能

- 19x19 标准棋盘
- 黑白双方对弈
- 完整围棋规则（禁着、打劫、气和提子）
- AI 对战（3 种难度）
- 命令行交互界面

## 运行

```bash
python3 src/go_game.py
```

## 游戏模式

1. 人人对战
2. 人机对战（easy/medium/hard）
3. AI 演示（AI vs AI）

## 项目结构

```
go-game/
├── src/          # 源代码
├── tests/        # 测试
├── docs/         # 文档
└── assets/       # 资源文件
```

## TODO

- [ ] Web 界面
- [ ] 棋谱保存/回放
- [ ] 在线对战
- [ ] 更强的 AI（MCTS）
- [ ] 死活题模式

## 许可证

MIT
