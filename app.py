from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

app = Flask(__name__)
CORS(app)

# 配置数据库
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///fudan120.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# 数据模型
class Blessing(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    author = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    tag = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    likes = db.Column(db.Integer, default=0)
    comments = db.relationship('Comment', backref='blessing', lazy=True)

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    author = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    blessing_id = db.Column(db.Integer, db.ForeignKey('blessing.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected

class GameProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), nullable=False)
    game_type = db.Column(db.String(50), nullable=False)  # quiz, treasure
    score = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    completed_tasks = db.Column(db.Integer, default=0)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

# 创建数据库表
with app.app_context():
    db.create_all()

# API路由
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

@app.route('/api/blessings', methods=['GET'])
def get_blessings():
    blessings = Blessing.query.order_by(Blessing.created_at.desc()).all()
    return jsonify([{
        'id': b.id,
        'author': b.author,
        'content': b.content,
        'tag': b.tag,
        'created_at': b.created_at.isoformat(),
        'likes': b.likes,
        'comments': [{
            'id': c.id,
            'content': c.content,
            'author': c.author,
            'created_at': c.created_at.isoformat()
        } for c in b.comments if c.status == 'approved']
    } for b in blessings])

@app.route('/api/blessings', methods=['POST'])
def create_blessing():
    data = request.get_json()
    new_blessing = Blessing(
        author=data['author'],
        content=data['content'],
        tag=data.get('tag')
    )
    db.session.add(new_blessing)
    db.session.commit()
    return jsonify({
        'id': new_blessing.id,
        'author': new_blessing.author,
        'content': new_blessing.content,
        'tag': new_blessing.tag,
        'created_at': new_blessing.created_at.isoformat(),
        'likes': new_blessing.likes
    }), 201

@app.route('/api/blessings/<int:blessing_id>/like', methods=['POST'])
def like_blessing(blessing_id):
    blessing = Blessing.query.get_or_404(blessing_id)
    blessing.likes += 1
    db.session.commit()
    return jsonify({'likes': blessing.likes})

@app.route('/api/blessings/<int:blessing_id>/comments', methods=['POST'])
def add_comment(blessing_id):
    data = request.get_json()
    new_comment = Comment(
        content=data['content'],
        author=data['author'],
        blessing_id=blessing_id
    )
    db.session.add(new_comment)
    db.session.commit()
    return jsonify({
        'id': new_comment.id,
        'content': new_comment.content,
        'author': new_comment.author,
        'created_at': new_comment.created_at.isoformat()
    }), 201

@app.route('/api/comments/<int:comment_id>/review', methods=['POST'])
def review_comment(comment_id):
    data = request.get_json()
    comment = Comment.query.get_or_404(comment_id)
    comment.status = data['status']
    db.session.commit()
    return jsonify({'status': comment.status})

@app.route('/api/game-progress', methods=['GET'])
def get_game_progress():
    progress = GameProgress.query.all()
    return jsonify([{
        'user_id': p.user_id,
        'game_type': p.game_type,
        'score': p.score,
        'level': p.level,
        'completed_tasks': p.completed_tasks,
        'updated_at': p.updated_at.isoformat()
    } for p in progress])

@app.route('/api/game-progress', methods=['POST'])
def update_game_progress():
    data = request.get_json()
    progress = GameProgress.query.filter_by(
        user_id=data['user_id'],
        game_type=data['game_type']
    ).first()
    
    if not progress:
        progress = GameProgress(
            user_id=data['user_id'],
            game_type=data['game_type']
        )
        db.session.add(progress)
    
    progress.score = data.get('score', progress.score)
    progress.level = data.get('level', progress.level)
    progress.completed_tasks = data.get('completed_tasks', progress.completed_tasks)
    progress.updated_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify({
        'user_id': progress.user_id,
        'game_type': progress.game_type,
        'score': progress.score,
        'level': progress.level,
        'completed_tasks': progress.completed_tasks,
        'updated_at': progress.updated_at.isoformat()
    })

if __name__ == '__main__':
    app.run(debug=True) 