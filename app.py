#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Go Learning - 青少儿围棋学习平台
Flask Web 应用主文件
"""

from flask import Flask, render_template, jsonify, request, send_from_directory
import os
import json

app = Flask(__name__)

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

@app.route('/')
def index():
    """首页"""
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

if __name__ == '__main__':
    print("=" * 50)
    print("🎮 Go Learning - 青少儿围棋学习平台")
    print("=" * 50)
    print("访问地址: http://127.0.0.1:1010")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=1010)
