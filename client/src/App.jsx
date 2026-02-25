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
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Idle');
  const [jobId, setJobId] = useState('');
  const [storyReady, setStoryReady] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/skills`)
      .then((res) => res.json())
      .then((data) => setSkills(data.skills || []))
      .catch(() => setSkills([]));
  }, []);

  const userZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  useEffect(() => {
    if (!jobId) {
      return undefined;
    }

    const poll = window.setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/wakeup/status/${jobId}`);
        const data = await res.json();
        if (!res.ok) {
          setStatus(`Error: ${data.error || 'Unknown error'}`);
          setLoading(false);
          setJobId('');
          return;
        }

        const job = data.data;
        setProgress(job.progress || 0);
        setProgressLabel(job.message || 'Processing...');
        setStoryReady(Boolean(job.storyReady));
        setImageReady(Boolean(job.imageReady));
        setResult({
          record: job.record,
          drive: job.drive,
          notion: job.notion
        });

        if (job.status === 'completed') {
          setStatus('Completed and synced to Notion.');
          setLoading(false);
          setJobId('');
        }

        if (job.status === 'failed') {
          setStatus(`Error: ${job.error || 'Generation failed'}`);
          setLoading(false);
          setJobId('');
        }
      } catch (error) {
        setStatus(`Error: ${error.message}`);
        setLoading(false);
        setJobId('');
      }
    }, 1200);

    return () => window.clearInterval(poll);
  }, [jobId]);

  async function handleWakeUp() {
    if (!userName.trim()) {
      setStatus('Please input user name.');
      return;
    }

    setLoading(true);
    setProgress(6);
    setProgressLabel('Preparing wake-up profile...');
    setStoryReady(false);
    setImageReady(false);
    setStatus('Running wake-up workflow...');

    const time = localTimeSnapshot();

    try {
      const res = await fetch(`${API_BASE}/api/wakeup/start`, {
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
        setProgressLabel('Generation failed');
        setLoading(false);
        return;
      }

      setProgress(data.data?.progress || 20);
      setProgressLabel(data.data?.message || 'Generating story and image...');
      setResult({ record: data.data?.record, drive: null, notion: null });
      setJobId(data.data?.jobId || '');
      setStatus('Basic profile ready. Generating story and breakfast...');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      setProgressLabel('Generation failed');
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
        {(loading || progress > 0) && (
          <div className="progressWrap" aria-live="polite">
            <div className="progressMeta">
              <span>{progressLabel}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="progressTrack">
              <div className="progressFill" style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }} />
            </div>
          </div>
        )}
        <p className="status">{status}</p>
      </section>

      {result?.record ? (
        <section className="panel result">
          <h2>Wake Up Result</h2>
          <div className="grid">
            <div>
              <strong>User</strong>
              <p>{result.record.userName}</p>
            </div>
            <div>
              <strong>Recorded At</strong>
              <p>
                {result.record.recordedAtDate} {result.record.recordedAt} ({result.record.timezone})
              </p>
            </div>
            <div>
              <strong>City</strong>
              <p>
                {result.record.city} / {result.record.city_zh}
              </p>
            </div>
            <div>
              <strong>Country</strong>
              <p>
                {result.record.country} / {result.record.country_zh}
              </p>
            </div>
            <div>
              <strong>Coordinates</strong>
              <p>
                lat {result.record.latitude}, lng {result.record.longtitude}
              </p>
            </div>
            <div>
              <strong>Greeting</strong>
              <p>{result.record.greeting}</p>
            </div>
          </div>

          <div className="stories">
            <article>
              <h3>Story (EN)</h3>
              <p>{storyReady ? result.record.story : 'Generating story...'}</p>
            </article>
            <article>
              <h3>Story (ZH)</h3>
              <p>{storyReady ? result.record.story_zh : '故事生成中...'}</p>
            </article>
          </div>

          <div className="stories">
            <article>
              <h3>Recipe (EN)</h3>
              <p>{result.record.recipe ? result.record.recipe : 'Generating recipe...'}</p>
            </article>
            <article>
              <h3>Recipe (ZH)</h3>
              <p>{result.record.recipe_zh ? result.record.recipe_zh : '食譜生成中...'}</p>
            </article>
          </div>

          <div className="links">
            <a href={result.drive?.viewUrl} target="_blank" rel="noreferrer">
              Open Drive File
            </a>
            <a href={result.notion?.url} target="_blank" rel="noreferrer">
              Open Notion Page
            </a>
          </div>

          {imageReady && result.record.imageUrl ? (
            <img className="preview" src={result.record.imageUrl} alt="Generated breakfast" />
          ) : (
            <div className="imageLoading">Breakfast image generating...</div>
          )}
        </section>
      ) : null}

      <section className="panel">
        <h2>Skills Loaded</h2>
        <ul>
          {skills.length === 0 ? <li>(no skills found)</li> : skills.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
    </main>
  );
}
