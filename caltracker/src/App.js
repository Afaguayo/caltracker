// src/App.js
import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

import { fetchTestCollection } from './firebase';

function App() {
  useEffect(() => {
    fetchTestCollection()
      .then(docs => {
        console.log("🔥 Documents in 'test' collection:", docs);
        docs.forEach(doc => console.log(` • [${doc.id}]`, doc));
      })
      .catch(err => console.error("❌ Error fetching 'test':", err));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Check your console for the ‘test’ collection results.
        </p>
      </header>
    </div>
  );
}

export default App;
