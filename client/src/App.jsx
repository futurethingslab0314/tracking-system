import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function localTimeSnapshot() {
  const now = new Date();
  return {
    clientIsoTime: now.toISOString(),
    clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

export default function App() {
  const [skills, setSkills] = useState([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/skills`)
      .then((res) => res.json())
      .then((data) => setSkills(data.skills || []))
      .catch(() => setSkills([]));
  }, []);

  const userZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  async function handleWakeUp() {
    if (!userName.trim()) {
      setStatus('Please input user name.');
      return;
    }

    setLoading(true);
    setStatus('Running wake-up workflow...');

    const time = localTimeSnapshot();

    try {
      const res = await fetch(`${API_BASE}/api/wakeup/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userName.trim(),
          clientTimeZone: time.clientTimeZone,
          clientIsoTime: time.clientIsoTime
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(`Error: ${data.error || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      setResult(data.data);
      setStatus('Completed and synced to Notion.');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <h1>Wake Up Data Tracking Agent</h1>
        <p>
          Record your wake-up event, locate a near-8:00AM world city, generate local greeting and story,
          create breakfast image, then sync to Notion.
        </p>
      </section>

      <section className="panel">
        <label htmlFor="userName">User Name</label>
        <input
          id="userName"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name"
        />
        <p className="hint">Your timezone: {userZone}</p>
        <button disabled={loading} onClick={handleWakeUp}>
          {loading ? 'Waking Up...' : 'Wake Up Now'}
        </button>
        <p className="status">{status}</p>
      </section>

      {result?.record ? (
        <section className="panel result">
          <h2>Wake Up Result</h2>
          <div className="grid">
 