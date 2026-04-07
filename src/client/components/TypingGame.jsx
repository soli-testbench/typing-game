import React, { useState, useEffect, useRef, useCallback } from 'react';

const FALLBACK_CHALLENGE = {
  text: 'The quick brown fox jumps over the lazy dog.',
  difficulty: 'easy',
};

export default function TypingGame({ onComplete }) {
  const [challenge, setChallenge] = useState(null);
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [paused, setPaused] = useState(false);
  const [elapsedBeforePause, setElapsedBeforePause] = useState(0);
  const [pauseStart, setPauseStart] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  const fetchChallenge = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/challenges/random');
      if (res.ok) {
        const data = await res.json();
        setChallenge(data);
      } else {
        setChallenge(FALLBACK_CHALLENGE);
      }
    } catch {
      setChallenge(FALLBACK_CHALLENGE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  // Calculate WPM in real-time
  useEffect(() => {
    if (!startTime || isFinished || paused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const totalElapsed = elapsedBeforePause + (now - startTime);
      const minutes = totalElapsed / 60000;
      if (minutes > 0) {
        const correctChars = typed.split('').filter((ch, i) => ch === challenge.text[i]).length;
        const words = correctChars / 5;
        setWpm(Math.round(words / minutes));
      }
    }, 200);

    return () => clearInterval(interval);
  }, [startTime, typed, isFinished, paused, elapsedBeforePause, challenge]);

  // Focus/blur handling for pause
  useEffect(() => {
    const handleBlur = () => {
      if (startTime && !isFinished) {
        setPaused(true);
        setPauseStart(Date.now());
      }
    };

    const handleFocus = () => {
      if (paused && pauseStart) {
        // Accumulate elapsed time before pause and reset startTime
        const now = Date.now();
        setElapsedBeforePause((prev) => prev + (pauseStart - startTime));
        setStartTime(now);
        setPauseStart(null);
        setPaused(false);
        if (containerRef.current) containerRef.current.focus();
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [startTime, isFinished, paused, pauseStart]);

  // Focus the container on mount
  useEffect(() => {
    if (containerRef.current && !loading) {
      containerRef.current.focus();
    }
  }, [loading]);

  const getElapsedSeconds = useCallback(() => {
    if (!startTime) return 0;
    if (endTime) {
      return (elapsedBeforePause + (endTime - startTime)) / 1000;
    }
    return (elapsedBeforePause + (Date.now() - startTime)) / 1000;
  }, [startTime, endTime, elapsedBeforePause]);

  const computeStats = useCallback(() => {
    if (!challenge) return { wpm: 0, accuracy: 0, time_taken: 0 };
    const target = challenge.text;
    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === target[i]) correct++;
    }
    const accuracy = typed.length > 0 ? (correct / typed.length) * 100 : 0;
    const time_taken = getElapsedSeconds();
    const minutes = time_taken / 60;
    const finalWpm = minutes > 0 ? Math.round((correct / 5) / minutes) : 0;
    return { wpm: finalWpm, accuracy: Math.round(accuracy * 10) / 10, time_taken: Math.round(time_taken * 10) / 10 };
  }, [typed, challenge, getElapsedSeconds]);

  const handleKeyDown = useCallback(
    (e) => {
      if (!challenge || isFinished || paused) return;

      // Block paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        return;
      }

      // Ignore modifier keys and special keys
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape',
           'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
           'Home', 'End', 'PageUp', 'PageDown',
           'Insert', 'Delete', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6',
           'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(e.key)) {
        return;
      }

      e.preventDefault();

      const target = challenge.text;

      if (e.key === 'Backspace') {
        setTyped((prev) => prev.slice(0, -1));
        return;
      }

      // Only allow printable characters
      if (e.key.length !== 1) return;

      // Start timer on first keystroke
      if (!startTime) {
        setStartTime(Date.now());
      }

      const newTyped = typed + e.key;
      setTyped(newTyped);

      // Check for completion
      if (newTyped.length === target.length) {
        const now = Date.now();
        setEndTime(now);
        setIsFinished(true);

        // Compute final stats
        let correct = 0;
        for (let i = 0; i < newTyped.length; i++) {
          if (newTyped[i] === target[i]) correct++;
        }
        const totalTime = (elapsedBeforePause + (now - (startTime || now))) / 1000;
        const accuracy = newTyped.length > 0 ? (correct / newTyped.length) * 100 : 0;
        const minutes = totalTime / 60;
        const finalWpm = minutes > 0 ? Math.round((correct / 5) / minutes) : 0;

        const stats = {
          wpm: finalWpm,
          accuracy: Math.round(accuracy * 10) / 10,
          time_taken: Math.round(totalTime * 10) / 10,
          challenge_text: target,
        };

        if (onComplete) onComplete(stats);
      }
    },
    [challenge, isFinished, paused, typed, startTime, elapsedBeforePause, onComplete]
  );

  // Block paste on the container
  const handlePaste = useCallback((e) => {
    e.preventDefault();
  }, []);

  const resetGame = () => {
    setTyped('');
    setStartTime(null);
    setEndTime(null);
    setPaused(false);
    setElapsedBeforePause(0);
    setPauseStart(null);
    setWpm(0);
    setIsFinished(false);
    fetchChallenge();
  };

  if (loading) {
    return <div className="game-container"><p className="loading">Loading challenge...</p></div>;
  }

  if (!challenge) {
    return <div className="game-container"><p className="error-msg">Failed to load challenge.</p></div>;
  }

  if (isFinished) {
    const stats = computeStats();
    return (
      <div className="results-panel">
        <h2>Game Complete!</h2>
        <div className="results-stats">
          <div className="result-stat">
            <div className="value">{stats.wpm}</div>
            <div className="label">WPM</div>
          </div>
          <div className="result-stat">
            <div className="value">{stats.accuracy}%</div>
            <div className="label">Accuracy</div>
          </div>
          <div className="result-stat">
            <div className="value">{stats.time_taken}s</div>
            <div className="label">Time</div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={resetGame}>Play Again</button>
      </div>
    );
  }

  const target = challenge.text;
  const accuracy = typed.length > 0
    ? Math.round((typed.split('').filter((ch, i) => ch === target[i]).length / typed.length) * 100)
    : 100;

  return (
    <div
      className="game-container"
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      style={{ outline: 'none' }}
    >
      <div className="stats-bar">
        <div className="stat">
          <div className="stat-value">{wpm}</div>
          <div className="stat-label">WPM</div>
        </div>
        <div className="stat">
          <div className="stat-value">{accuracy}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="stat">
          <div className="stat-value">{challenge.difficulty}</div>
          <div className="stat-label">Difficulty</div>
        </div>
      </div>

      <div className="text-display">
        {paused && <div className="paused-overlay">⏸ Paused — Click to resume</div>}
        {target.split('').map((char, index) => {
          let className = 'char ';
          if (index < typed.length) {
            className += typed[index] === char ? 'correct' : 'incorrect';
          } else if (index === typed.length) {
            className += 'current';
          } else {
            className += 'upcoming';
          }
          return (
            <span key={index} className={className}>
              {char}
            </span>
          );
        })}
      </div>

      {!startTime && (
        <p style={{ textAlign: 'center', marginTop: '1rem', color: '#a0a0b0' }}>
          Start typing to begin...
        </p>
      )}
    </div>
  );
}
