import OpenAI from 'openai';

// Vercel Hobby tier defaults to a 10s function timeout; the classroom-loaded
// local model can occasionally run past that under concurrent student traffic.
// Hobby allows up to 60s with this export.
export const maxDuration = 60;

const client = new OpenAI({
  baseURL: process.env.OLLAMA_BASE_URL,
  apiKey: process.env.VCS_API_SECRET,
});

// Ollama exposes an OpenAI-compatible endpoint (OLLAMA_BASE_URL points at the
// server's /v1 root), so the OpenAI SDK works unchanged: it appends
// "/chat/completions" itself. VCS_API_SECRET is used as the API key.

// The document is the only context the AI may use. The "only this document"
// instruction in each prompt is the key part; the actual document text is
// appended per request by buildSystemPrompt (it replaces the @@DOC@@ token).
const DOCUMENT_TOKEN = '@@DOC@@';

// The form posts a `mode` radio value. Each mode maps to its own system prompt
// and the user message that triggers it. Quiz and Summarize don't depend on the
// student's question field, so their user message is fixed and the question is
// optional.
const MODES = {
  'Ask a Question': {
    prompt:
      'You are a helpful study assistant. Answer the student\'s question using ' +
      'only the provided document. Be clear and concise. If the answer is not in ' +
      'the document, say so plainly and do not guess.\n\n' +
      DOCUMENT_TOKEN,
    userMessage: null, // use the student's question
  },
  'Quiz Me': {
    prompt:
      'You are a teacher creating a practice quiz. Using only the provided ' +
      'document, write 5 multiple-choice questions. Format each one exactly like ' +
      'this:\n' +
      '**Question 1:** question text\n' +
      'A) option\n' +
      'B) option\n' +
      'C) option\n' +
      'D) option\n' +
      '**Answer: letter**\n' +
      'Put a blank line between questions. Only one option should be correct, and ' +
      'the wrong options should be believable.\n\n' +
      DOCUMENT_TOKEN,
    // No student question needed; this triggers the quiz generation.
    userMessage: 'Create the quiz.',
  },
  Summarize: {
    prompt:
      'You are a study assistant. Summarize the provided document for a high ' +
      'school student. Start with a one-sentence overview, then give 4 to 6 ' +
      'bullet points covering the most important ideas and key vocabulary. Use ' +
      'only information from the document.\n\n' +
      DOCUMENT_TOKEN,
    // No student question needed; this triggers the summary.
    userMessage: 'Summarize the document.',
  },
};

// Build the grounding system prompt for a mode by appending the document text in
// place of the token.
function buildSystemPrompt(template, documentText) {
  return template.replace(DOCUMENT_TOKEN, documentText);
}

export async function POST(req) {
  // The browser posts multipart/form-data: the chosen .txt file plus the
  // question and mode. Read the file's text to use as the AI's context.
  const formData = await req.formData();

  const question = (formData.get('question') ?? '').trim();
  const mode = (formData.get('mode') ?? '').trim() || 'Ask a Question';
  const file = formData.get('file') ?? null;
  const documentText = file ? (await file.text()).trim() : '';

  // Look up the prompt config for the chosen mode; default to Ask a Question if
  // an unknown mode arrives.
  const config = MODES[mode] ?? MODES['Ask a Question'];

  // A document is required for every mode. A question is required only for
  // "Ask a Question"; Quiz and Summarize don't need one.
  if (!documentText) {
    return Response.json({
      answer: '',
      error: 'A document is required.',
    });
  }
  if (config.userMessage === null && !question) {
    return Response.json({
      answer: '',
      error: 'A question is required.',
    });
  }

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OLLAMA_MODEL,
      // The system message carries the mode-specific grounding instruction plus
      // the document as context; the user message triggers the task.
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(config.prompt, documentText),
        },
        {
          role: 'user',
          content: config.userMessage ?? question,
        },
      ],
      // Low temperature keeps answers grounded and consistent with the document.
      temperature: 0,
    });

    const answer = completion.choices?.[0]?.message?.content?.trim() ?? '';

    return Response.json({ answer });
  } catch (err) {
    // Surface the underlying failure to the page instead of crashing the route.
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({
      answer: '',
      error: `Could not get an answer: ${message}`,
    });
  }
}