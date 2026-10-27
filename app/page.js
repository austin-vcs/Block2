'use client';

import { useState } from 'react';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setResponse('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      setResponse(data.content || 'No response received.');
    } catch (err) {
      setResponse('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: '4rem auto', padding: '0 1rem', fontFamily: 'sans-serif' }}>
      <h1>Course Companion</h1>
      <p>Enter a topic and the AI will explain it in 3 bullet points.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span style={{ marginBottom: '0.25rem' }}>Topic</span>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic..."
            style={{ padding: '0.5rem', fontSize: '1rem', background: '#ffffff', color: '#171717' }}
          />
        </label>
        <button type="submit" disabled={loading} style={{ alignSelf: 'flex-end', padding: '0.5rem 1rem', fontSize: '1rem', background: '#171717', color: '#ffffff' }}>
          {loading ? 'Thinking...' : 'Explain'}
        </button>
      </form>

      {response && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f5f5f5', color: '#171717', borderRadius: '8px', whiteSpace: 'pre-line' }}>
          {response}
        </div>
      )}
    </main>
  );
}
