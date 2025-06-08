// src/components/TaskSearch.js
import React, { useState } from 'react';
import './TaskSearch.css'; 

const TaskSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <div className="task-search">
      <h2>🔍 Find Similar Tasks</h2>
      <input
        type="text"
        placeholder="Search tasks by meaning..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
      />
      <button onClick={handleSearch} className="search-button">Search</button>

      {results.length > 0 && (
        <div className="search-results">
          <h3>Top Matches:</h3>
          <ul>
            {results.map((task) => (
              <li key={task.id} className="search-result-item">
                <strong>{task.title}</strong> – {task.description || 'No description'}<br />
                <span className="similarity-score">Similarity: {task.similarity.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TaskSearch;
