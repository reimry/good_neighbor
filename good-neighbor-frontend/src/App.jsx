// src/App.js
import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState('Checking backend...');

  useEffect(() => {
    // Робимо запит до нашого бекенд ендпоінту
    fetch('http://localhost:3001/api/health')
      .then(res => res.json())
      .then(data => {
        // Якщо все добре, data буде { status: "ok" }
        setStatus(`Backend status: ${data.status}`);
      })
      .catch(err => {
        setStatus('Error connecting to backend!');
        console.error(err);
      });
  }, []);

  return (
    <div className="App">
      <h1>Welcome to Good Neighbor</h1>
      <p>{status}</p>
    </div>
  );
}

export default App;



