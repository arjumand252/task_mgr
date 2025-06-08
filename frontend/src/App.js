import React, { useEffect, useState } from "react";
import './App.css';

// Use environment variable or detect environment
const API_BASE = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'http://backend:5000');
const API_URL = `${API_BASE}/tasks`;

function App() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", status: "todo"});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);

    // Try localStorage first
    const cachedTasks = localStorage.getItem('tasks');
    if (cachedTasks) {
      setTasks(JSON.parse(cachedTasks)); // Use cached data immediately
    }

    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setTasks(data);
      localStorage.setItem('tasks', JSON.stringify(data)); // Refresh cache
    } catch (err) {
      console.error('Fetch error:', err);
      if (!cachedTasks) setError("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };


  const addTask = async () => {
    if (!newTask.title.trim()) {
      setError("Task title is required.");
      return;
    }
    setError(null);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      const updatedTasks = [...tasks, data];
      setTasks(updatedTasks);
      localStorage.setItem('tasks', JSON.stringify(updatedTasks)); // Update cache
      setNewTask({ title: "", description: "", status: "todo" });
    } catch (err) {
      console.error('Add task error:', err);
      setError("Failed to add task");
    }
  };


  const deleteTask = async (id) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const updatedTasks = tasks.filter((task) => task.id !== id);
      setTasks(updatedTasks);
      localStorage.setItem('tasks', JSON.stringify(updatedTasks)); // Update cache
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete task");
    }
  };


  const getStatusColor = (status) => {
    switch(status) {
      case 'done': return '#10b981';
      case 'in progress': return '#f59e0b';
      default: return '#ef4444';
    }
  };

  const getStatusEmoji = (status) => {
    switch(status) {
      case 'done' : return '✅';
      case 'in progress': return '⏳';
      default: return '📋';
    }
  } 

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="app-container">
      {/* Header Section */}
      <div className="header">
        <h1 className="title">✨ Task Manager</h1>
        <p className="subtitle">A fun way to stay organized and productive. </p>
      </div>

      {/* Error and Loading States */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span> {error}
        </div>
      )}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <span>Loading your tasks...</span>
        </div>
      )}

      {/* Add Task Form */}
      <div className="add-task-form">
        <h2 className="subtitle"> Add a new task</h2>
        <div className="form-group">
          <input
            className="input-field"
            placeholder="Task title..."
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
          <input
            className="input-field"
            placeholder="Description (optional)..."
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <select
            className="select-field"
            value={newTask.status}
            onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
          >
            <option value="todo">📋 Todo</option>
            <option value="in progress">⏳ In Progress</option>
            <option value="done">✅ Done</option>
          </select>
          <button className="add-button" onClick={addTask}>
            + Add Task
          </button>
        </div>
      </div>

      {/* 🔍 Task Search */}
      <div className="task-search">
        <h2 className="subtitle"> Search tasks</h2>
        <input
          type="text"
          className="search-input"
          placeholder="Type to search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      {searchQuery && (
        <button className="clear-search" onClick={() => setSearchQuery("")}>
          ❌ Clear
        </button>
      )}

      {/* refresh button */}
      <div className="refresh-cache">
        <button className="refresh-button" onClick={fetchTasks}>
          🔄 Refresh Tasks from Server
        </button>
      </div>

      {/* Task List */}
      <div className="tasks-container">
        <h2 className="subtitle"> List of tasks</h2>
        {tasks.length === 0 && !loading ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No tasks yet!</h3>
            <p>Create your first task to get started</p>
          </div>
        ) : (
          <div className="tasks-grid">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`task-card ${task.status.replace(" ", "-")}`}
              >
                <div className="task-header">
                  <span className="task-emoji">{getStatusEmoji(task.status)}</span>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(task.status) }}
                  >
                    {task.status}
                  </span>
                </div>
                <div className="task-content">
                  <h3 className="task-title">{task.title}</h3>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                </div>
                <div className="task-actions">
                  <button
                    className="delete-button"
                    onClick={() => deleteTask(task.id)}
                    title="Delete task"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="footer">
        <p className="api-info">Connected to: {API_URL}</p>
      </div>
    </div>
  );
}

export default App;