from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import Float
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
# CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"],
#      methods = ['GET', 'POST', 'DELETE'],
#      allow_headers=['Content-Type'])
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:arjumand@localhost/taskmanager')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default="todo")
    embedding = db.Column(ARRAY(Float))

    def serialize(self):
        return {
            'id' :self.id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'embedding': self.embedding
        }

# Instantiating the model for sentence embedding
model = SentenceTransformer('all-MiniLM-L6-v2')

@app.before_request
def create_table():
    db.create_all()

@app.route('/')
def home():
    return jsonify({"message" : "Task Manager Backend is Running"}), 200

@app.route('/tasks', methods=['GET'])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([task.serialize() for task in tasks]), 200

@app.route("/tasks", methods = ['POST'])
def add_task():
    data = request.get_json()
    if not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400
    
    desc = data.get('description', '')
    embedding = model.encode(desc).tolist()

    task = Task(
        title = data['title'],
        description = data.get('description', ''),
        status = data.get('status', 'todo'),
        embedding = embedding
    )
    db.session.add(task)
    db.session.commit()
    return jsonify(task.serialize()), 201

@app.route("/tasks/<int:task_id>", methods = ["DELETE"])
def delete_task(task_id):
    # global tasks
    # tasks = [task for task in tasks if task["id"]!=task_id]
    # return jsonify({"message": "Task deleted"}), 200
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': f'Task {task_id} deleted'}), 200

print("Registered routes:")
for rule in app.url_map.iter_rules():
    print(f"{rule.endpoint}: {rule.rule} {list(rule.methods)}")

@app.route('/search', methods = ['POST'])
def search_similar_task():
    query = request.json.get("query", "")
    if not query: return jsonify([]), 400

    query_embedding = model.encode(query).tolist()

    all_tasks = Task.query.filter(Task.embedding.isnot(None)).all()

    def cosine_similarity(v1, v2):
        v1 = np.array(v1)
        v2 = np.array(v2)
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

    scored_tasks = [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "similarity": cosine_similarity(t.embedding, query_embedding)
        }
        for t in all_tasks
    ]
    top_matches = sorted(scored_tasks, key=lambda x: x["similarity"], reverse=True)[:3]
    return jsonify(top_matches)

if __name__ == "__main__":
    app.run(host="localhost", port=5000, debug=True)
