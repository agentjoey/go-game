#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Go Learning - 青少儿围棋学习平台
Flask Web 应用主文件
"""

from flask import Flask, render_template, jsonify, request, send_from_directory
import os
import json
import sys
import random
import uuid

app = Flask(__name__)

# 导入GoGame类
sys.path.insert(0, 'src')
from go_game import GoGame

# 存储活跃游戏字典
games = {}

# 加载死活题数据
def load_tsumego_data():
    """加载死活题数据"""
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'tsumego.json')
    with open(data_path, 'r', encoding='utf-8') as f:
        return json.load(f)

# 加载教程数据
def load_tutorial_data():
    """加载教程数据"""
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'tutorial.json')
    with open(data_path, 'r', encoding='utf-8') as f:
        return json.load(f)

@app.route('/onboarding')
def onboarding():
    """新用户引导页"""
    return render_template('onboarding.html')

@app.route('/')
def index():
    """首页 - Dashboard"""
    return render_template('dashboard.html')

@app.route('/home')
def home():
    """旧版首页（保留）"""
    return render_template('index.html')

@app.route('/play')
def play():
    """对弈模式"""
    return render_template('play.html')

@app.route('/tsumego')
def tsumego():
    """死活题模式"""
    return render_template('tsumego.html')

@app.route('/tutorial')
def tutorial():
    """教程模式"""
    return render_template('tutorial.html')

@app.route('/records')
def records():
    """棋谱管理"""
    return render_template('records.html')

@app.route('/review')
def review():
    """对局复盘"""
    return render_template('review.html')

@app.route('/profile')
def profile():
    """个人中心"""
    return render_template('profile.html')

@app.route('/api/tsumego/list')
def api_tsumego_list():
    """获取死活题列表"""
    try:
        data = load_tsumego_data()
        return jsonify({
            'success': True,
            'data': data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/tsumego/<int:problem_id>')
def api_tsumego_detail(problem_id):
    """获取单道死活题详情"""
    try:
        data = load_tsumego_data()
        problem = next((p for p in data['problems'] if p['id'] == problem_id), None)
        if problem:
            return jsonify({
                'success': True,
                'data': problem
            })
        return jsonify({
            'success': False,
            'error': '题目不存在'
        }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/tutorial/list')
def api_tutorial_list():
    """获取教程列表"""
    try:
        data = load_tutorial_data()
        return jsonify({
            'success': True,
            'data': data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/tutorial/<int:tutorial_id>')
def api_tutorial_detail(tutorial_id):
    """获取单个教程详情"""
    try:
        data = load_tutorial_data()
        tutorial = next((t for t in data['tutorials'] if t['id'] == tutorial_id), None)
        if tutorial:
            return jsonify({
                'success': True,
                'data': tutorial
            })
        return jsonify({
            'success': False,
            'error': '教程不存在'
        }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# 静态文件服务
@app.route('/static/<path:filename>')
def static_files(filename):
    """静态文件服务"""
    return send_from_directory('static', filename)

# 错误处理
@app.errorhandler(404)
def not_found(error):
    return render_template('index.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('index.html'), 500

# ==================== 游戏API路由 ====================

def get_or_create_game(game_id):
    """获取或创建游戏实例"""
    if game_id not in games:
        games[game_id] = GoGame()
    return games[game_id]

@app.route('/api/game/validate', methods=['POST'])
def api_validate_move():
    """验证移动是否合法（不实际落子）"""
    try:
        data = request.json
        game_id = data.get('gameId', str(uuid.uuid4()))
        row = data.get('row')
        col = data.get('col')
        
        if row is None or col is None:
            return jsonify({'success': False, 'error': '缺少row或col参数'}), 400
        
        game = get_or_create_game(game_id)
        is_valid = game.is_valid_move(row, col)
        
        return jsonify({
            'success': True,
            'data': {
                'valid': is_valid,
                'gameId': game_id,
                'row': row,
                'col': col,
                'currentPlayer': game.current_player
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/game/move', methods=['POST'])
def api_make_move():
    """执行一步棋"""
    try:
        data = request.json
        game_id = data.get('gameId', str(uuid.uuid4()))
        row = data.get('row')
        col = data.get('col')
        
        if row is None or col is None:
            return jsonify({'success': False, 'error': '缺少row或col参数'}), 400
        
        game = get_or_create_game(game_id)
        
        if not game.is_valid_move(row, col):
            return jsonify({'success': False, 'error': '非法移动'}), 400
        
        result = game.make_move(row, col)
        
        return jsonify({
            'success': True,
            'data': {
                'gameId': game_id,
                'row': row,
                'col': col,
                'currentPlayer': game.current_player,
                'captured': game.captured,
                'moveHistory': game.move_history,
                'result': result
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/game/valid-moves', methods=['GET'])
def api_get_valid_moves():
    """获取所有合法落子位置"""
    try:
        game_id = request.args.get('gameId', str(uuid.uuid4()))
        game = get_or_create_game(game_id)
        valid_moves = game.get_valid_moves()
        
        return jsonify({
            'success': True,
            'data': {
                'gameId': game_id,
                'validMoves': valid_moves,
                'currentPlayer': game.current_player,
                'count': len(valid_moves)
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/game/ai-move', methods=['GET'])
def api_get_ai_move():
    """获取AI推荐的落子位置（随机选择合法位置）"""
    try:
        game_id = request.args.get('gameId', str(uuid.uuid4()))
        game = get_or_create_game(game_id)
        valid_moves = game.get_valid_moves()
        
        if not valid_moves:
            return jsonify({'success': False, 'error': '没有合法落子位置'}), 400
        
        # 随机选择一个合法位置作为AI推荐
        ai_row, ai_col = random.choice(valid_moves)
        
        return jsonify({
            'success': True,
            'data': {
                'gameId': game_id,
                'aiMove': {'row': ai_row, 'col': ai_col},
                'currentPlayer': game.current_player,
                'validMovesCount': len(valid_moves)
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    import socket
    
    # 获取本机 IP
    def get_local_ip():
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"
    
    local_ip = get_local_ip()
    
    print("=" * 50)
    print("🎮 Go Learning - 青少儿围棋学习平台")
    print("=" * 50)
    print(f"本地访问: http://127.0.0.1:1010")
    print(f"局域网访问: http://{local_ip}:1010")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=1010)
