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

// The document the AI must answer strictly from. The "only this document"
// instruction is the key part; the actual document text is injected per request
// in place of the token below, via the replace call in POST.
const DOCUMENT_TEXT = '@@DOC@@';
const SYSTEM_PROMPT =
   'You are a Course Companion that helps students with a specific course ' +
   'document.\n\n' +
   'Answer the question using ONLY the document provided below. Base every part ' +
   'of your answer on that document and do not use any outside knowledge or ' +
   'make up facts.\n\n' +
   'If the information needed to answer the question is NOT present in the ' +
   'document, say so clearly and plainly. For example: "The answer is not in ' +
   'the provided document, I cannot answer that." Do not guess or fill in from ' +
   'your own knowledge.\n\n' +
   'Document:\n' +
   DOCUMENT_TEXT;

export async function POST(req) {
  // The browser posts multipart/form-data: the chosen .txt file plus the
  // question. Read the file's text to use as the AI's context.
  const formData = await req.formData();

  const question = (formData.get('question') ?? '').trim();
  const file = formData.get('file') ?? null;
  const documentText = file ? (await file.text()).trim() : '';

  // Both inputs are required; without a question or document the model has
  // nothing to work with and a call would be wasted.
  if (!question || !documentText) {
    return Response.json({
      answer: '',
      error: 'Both a question and a document are required.',
    });
  }

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OLLAMA_MODEL,
      // System message carries the grounding instruction + the document as
      // context; the question is the user's message.
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT.replace(DOCUMENT_TEXT, documentText),
        },
        {
          role: 'user',
          content: question,
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