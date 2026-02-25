import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function App() {
  const [skills, setSkills] = useState([]);
  const [prompt, setPrompt] = useState('請幫我生成一段 agent daily summary');
  const [generated, setGenerated] = useState('');
  const [title, setTitle] = useState('Agent Draft');
  const [content, setContent] = useState('這是一筆從 agent skeleton 建立的 Notion 資料。');
  const [status, setStatus] = useState('Ready');

  useEffect(() => {
    fetch(`${API_BASE}/api/skills`)
      .then((res) => res.json())
      .then((data) => setSkills(data.skills || []))
      .catch(() => setSkills([]));
  }, []);

  async function handleGenerate() {
    setStatus('Generating with OpenAI...');

    const res = await fetch(`${API_BASE}/api/openai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus(`Error: ${data.error || 'Unknown error'}`);
      return;
    }

    setGenerated(data.text || '');
    setStatus('Generated.');
  }

  async function handleWriteNotion() {
    setStatus('Writing to Notion...');

    const res = await fetch(`${API_BASE}/api/notion/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(`Error: ${data.error || 'Unknown error'}`);
      return;
    }

    setStatus(`Written to Notion: ${data.data?.url || data.data?.id || 'success'}`);
  }

  return (
    <main className="container">
      <h1>Agent Skeleton (React + Node)</h1>
      <p className="muted">API: {API_BASE}</p>

      <section className="card">
        <h2>Skills Folder</h2>
        <p>目前 skills 清單：</p>
        <ul>
          {skills.length === 0 ? <li>(空)</li> : skills.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </section>

      <section className="card">
        <h2>OpenAI Generate</h2>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} />
        <button onClick={handleGenerate}>Generate</button>
        <pre>{generated}</pre>
      </section>

      <section className="card">
        <h2>Write to Notion DB</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
        <button onClick={handleWriteNotion}>Write</button>
      </section>

      <footer className="status">Status: {status}</footer>
    </main>
  );
}
