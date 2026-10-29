'use client';

import { useState } from 'react';
import Markdown from 'react-markdown';

// Shared react-markdown component overrides so rendered text stays dark and
// single-newline quiz options / bullets keep their line breaks (pre-line on
// <p> and <li>). Used by both the plain Ask/Summarize render and the per-
// question quiz cards below.
const markdownComponents = {
  p: (props) => (
    <p style={{ color: '#171717', fontSize: '1rem', lineHeight: 1.6, margin: '0.5rem 0', whiteSpace: 'pre-line' }}>
      {props.children}
    </p>
  ),
  ul: (props) => (
    <ul style={{ color: '#171717', paddingLeft: '1.25rem', margin: '0.5rem 0' }}>
      {props.children}
    </ul>
  ),
  ol: (props) => (
    <ol style={{ color: '#171717', paddingLeft: '1.25rem', margin: '0.5rem 0' }}>
      {props.children}
    </ol>
  ),
  li: (props) => (
    <li style={{ color: '#171717', fontSize: '1rem', lineHeight: 1.6, marginTop: '0.15rem', whiteSpace: 'pre-line' }}>
      {props.children}
    </li>
  ),
  strong: (props) => (
    <strong style={{ fontWeight: 700, color: '#171717' }}>
      {props.children}
    </strong>
  ),
  a: (props) => (
    <a href={props.href} style={{ color: '#171717', textDecoration: 'underline' }}>
      {props.children}
    </a>
  ),
};

// Split a "Quiz Me" answer into one entry per question. Each question begins at a
// "**Question N:**" line; its A/B/C/D options stay attached, while the separate
// "**Answer: X**" line is pulled out so the UI can hide it behind a "Show
// answer" button.
function parseQuiz(text) {
  const headerRe = /^\s*\*{0,2}Question\s*\d+/i;
  const answerRe = /^\s*\*{0,2}Answer\b/i;

  const blocks = [];
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    if (headerRe.test(line)) {
      if (current) blocks.push(current);
      current = [];
    }
    // Anything before the first question header (rare preamble) is ignored.
    if (current) current.push(line);
  }
  if (current) blocks.push(current);

  const items = blocks.map((lines) => {
    let answerText = '';
    const questionLines = lines.filter((line) => {
      if (answerRe.test(line)) {
        // Drop the bold markers and an "Answer:" label, keep the value (letter).
        answerText = line.replace(/\*+/g, '').replace(/^\s*Answer\s*:?\s*/i, '').trim();
        return false;
      }
      return true;
    });
    // Trim leading/trailing blank lines for a clean card.
    while (questionLines.length && questionLines[0].trim() === '') questionLines.shift();
    while (questionLines.length && questionLines[questionLines.length - 1].trim() === '') questionLines.pop();
    return {
      question: questionLines.join('\n').trim(),
      answer: answerText,
    };
  }).filter((item) => item.question.length > 0);

  return items;
}

// "Quiz Me" results: one card per question. The hidden "**Answer: X**" line is
// revealed per-card via a "Show answer" button (keyed by question index).
function QuizResults({ answer, revealed, onToggle }) {
  const items = parseQuiz(answer);

  // If parsing yields nothing, fall back to the plain Markdown render so the
  // answer is never hidden.
  if (items.length === 0) {
    return (
      <Markdown style={{ color: '#171717', fontSize: '1rem', lineHeight: 1.6 }} components={markdownComponents}>
        {answer}
      </Markdown>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {items.map((item, i) => {
        const isOpen = !!revealed[i];
        return (
          <div
            key={i}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: '0.5rem',
              padding: '1rem',
              background: '#fafafa',
            }}
          >
            <Markdown style={{ color: '#171717', fontSize: '1rem', lineHeight: 1.6 }} components={markdownComponents}>
              {item.question}
            </Markdown>

            <button
              type="button"
              onClick={() => onToggle(i)}
              style={{
                marginTop: '0.75rem',
                alignSelf: 'flex-start',
                padding: '0.35rem 0.75rem',
                fontSize: '0.9rem',
                background: '#171717',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
              }}
            >
              {isOpen ? 'Hide answer' : 'Show answer'}
            </button>

            {isOpen && item.answer && (
              <p style={{ marginTop: '0.75rem', color: '#171717', fontSize: '1rem', fontWeight: 700 }}>
                Answer: {item.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('Ask a Question');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Which quiz questions currently have their "Answer: X" line revealed. Keyed
  // by question index; reset on every submit so a new quiz starts hidden.
  const [revealedQuiz, setRevealedQuiz] = useState({});

  async function handleSubmit(e) {
     e.preventDefault();

    // Reset the previous result and start a fresh request.
    setError('');
    setAnswer('');
    setRevealedQuiz({});
        // A question with no document has nothing to answer from, so show an
        // error and return instead of calling the API.
    if (!file) {
      setError('Please upload a document first before submitting a question.');
      return;
        }
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('question', question);
      formData.append('mode', mode);

      const res = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setAnswer(data.answer ?? '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
     } finally {
      setLoading(false);
     }
   }

   return (
    <main
     style={{
      maxWidth: 600,
      margin: '4rem auto',
      padding: '0 1rem',
      fontFamily: 'sans-serif',
      color: '#171717',
      }}
     >
      <h1>Course Companion</h1>
      <p>
      Choose a .txt file and ask a question. The answer is generated from your
      document and shown below.
      </p>

      <form
       onSubmit={handleSubmit}
       style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}
       >
        <label style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span style={{ marginBottom: '0.25rem' }}>Upload a document</span>
          <input
         type="file"
         accept=".txt"
         onChange={(e) => setFile(e.target.files[0])}
         style={{ fontSize: '1rem', background: '#ffffff', color: '#171717' }}
         />
        </label>
<fieldset
             style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              border: 'none',
              margin: 0,
              padding: 0,
               }}
            >
             <legend style={{ marginBottom: '0.25rem', fontWeight: 600 }}>Mode</legend>
             <label
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}
              >
              <input
               type="radio"
               name="mode"
               value="Ask a Question"
               checked={mode === 'Ask a Question'}
               onChange={(e) => setMode(e.target.value)}
               style={{ flex: '0 0 auto' }}
                />
              <span style={{ fontSize: '1rem' }}>Ask a Question</span>
             </label>
             <label
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}
              >
              <input
               type="radio"
               name="mode"
               value="Quiz Me"
               checked={mode === 'Quiz Me'}
               onChange={(e) => setMode(e.target.value)}
               style={{ flex: '0 0 auto' }}
                />
              <span style={{ fontSize: '1rem' }}>Quiz Me</span>
             </label>
             <label
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}
              >
              <input
               type="radio"
               name="mode"
               value="Summarize"
               checked={mode === 'Summarize'}
               onChange={(e) => setMode(e.target.value)}
               style={{ flex: '0 0 auto' }}
                />
              <span style={{ fontSize: '1rem' }}>Summarize</span>
             </label>
            </fieldset>
            {mode === 'Ask a Question' && (
        <label style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span style={{ marginBottom: '0.25rem' }}>Question</span>
             {file && (
               <span
                 style={{
                   marginBottom: '0.25rem',
                   fontSize: '0.95rem',
                   color: '#525252',
                  }}
               >
                 Selected document: {file.name}
               </span>
             )}
          <input
         type="text"
         value={question}
         onChange={(e) => setQuestion(e.target.value)}
         placeholder="Enter a question..."
         style={{ padding: '0.5rem', fontSize: '1rem', background: '#ffffff', color: '#171717' }}
         />
        </label>
             )}
        <button
         type="submit"
         disabled={loading}
         style={{
          alignSelf: 'flex-start',
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          background: '#171717',
          color: '#ffffff',
          opacity: loading ? 0.5 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
          }}
         >
         {loading ? 'Thinking...' : 'Submit'}
        </button>
      </form>

        {/* While the API request is in flight, show a "Thinking..."
          message so the user knows the answer is being generated. */}
        {loading && (
          <p
          role="status"
          aria-live="polite"
          style={{ marginTop: '1.5rem', color: '#525252', fontSize: '1rem' }}
          >
          Thinking...
          </p>
        )}

{/* Render the model's output exactly once, in one place, as Markdown. **bold**
           becomes bold via the strong override below (react-markdown turns it
           into a <strong>). The model separates quiz options and bullets with
           single newlines, which Markdown would fold into one paragraph, so
           whiteSpace: 'pre-line' on <p> and <li> keeps those line breaks and
           puts each A/B/C/D option on its own line. Every component keeps dark
           text on the light background so the answer stays readable. */}
         {!loading && !error && answer && (
           <section
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#ffffff',
              border: '1px solid #d4d4d4',
              borderRadius: '0.25rem',
             }}
           >
             <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: '#171717' }}>
               {mode === 'Quiz Me' ? 'Quiz' : 'Answer'}
             </h2>
             {mode === 'Quiz Me' ? (
               /* 'Quiz Me' results render as per-question cards, each with a
                  hidden 'Answer: X' line revealed by a 'Show answer' button. */
               <QuizResults
                answer={answer}
                revealed={revealedQuiz}
                onToggle={(idx) =>
                 setRevealedQuiz((prev) => ({ ...prev, [idx]: !prev[idx] }))
                }
               />
             ) : (
               /* 'Ask a Question' and 'Summarize' keep the original plain
               Markdown rendering, unchanged. */
               <Markdown
                style={{ color: '#171717', fontSize: '1rem', lineHeight: 1.6 }}
                components={markdownComponents}
               >
                 {answer}
               </Markdown>
             )}
           </section>
         )}
     </main>
   );
}