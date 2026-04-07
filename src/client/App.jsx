import React, { useState, useEffect } from 'react';
import TypingGame from './components/TypingGame';

export default function App() {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/results');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleGameComplete = async (stats) => {
    try {
      await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stats),
      });
      fetchHistory();
    } catch (err) {
      console.error('Failed to save result:', err);
    }
  };

  return (
    <div className="app">
      <h1>⌨ Typing Game</h1>
      <TypingGame onComplete={handleGameComplete} />

      <div className="history-section">
        <h2>Recent Games</h2>
        {loadingHistory ? (
          <p className="loading">Loading history...</p>
        ) : history.length === 0 ? (
          <p className="loading">No games played yet. Start typing!</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>WPM</th>
                <th>Accuracy</th>
                <th>Time</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id}>
                  <td>{Math.round(row.wpm)}</td>
                  <td>{Math.round(row.accuracy)}%</td>
                  <td>{Number(row.time_taken).toFixed(1)}s</td>
                  <td>{new Date(row.completed_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
