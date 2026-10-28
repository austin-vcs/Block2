'use client';

import { useState } from 'react';
import Markdown from 'react-markdown';

export default function Home() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
     e.preventDefault();

    // Reset the previous result and start a fresh request.
    setError('');
    setAnswer('');
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

{/* Render the model's output as Markdown so **bold** becomes bold
          text and bullet lists become real list items. Every component
          keeps dark text on the light background so the answer stays readable. */}
<Markdown
          style={{ color: '#171717', fontSize: '1rem', lineHeight: 1.6 }}
          components={{
            p: (props) => (
              <p style={{ color: '#171717', fontSize: '1rem', lineHeight: 1.6, margin: '0.5rem 0' }}>
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
              <li style={{ color: '#171717', fontSize: '1rem', lineHeight: 1.6, marginTop: '0.15rem' }}>
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
          }}
        >
         {answer}
        </Markdown>

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
          Answer
        </h2>
        <p
        style={{
         color: '#171717',
         fontSize: '1rem',
         lineHeight: 1.6,
         margin: 0,
          // Pre-line keeps paragraph breaks from the model without forcing raw
          // whitespace layout, so the answer reads as normal prose.
         whiteSpace: 'pre-line',
         }}
        >
         {answer}
        </p>
       </section>
      )}
     </main>
   );
}