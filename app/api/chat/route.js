import OpenAI from 'openai';

// Vercel Hobby tier defaults to a 10s function timeout — too short for a
// classroom-loaded local model, which can occasionally run past that under
// concurrent student traffic. Hobby allows up to 60s with this export.
export const maxDuration = 60;

const client = new OpenAI({
  baseURL: process.env.OLLAMA_BASE_URL,
  apiKey: process.env.VCS_API_SECRET,
});

export async function POST(req) {
  const { topic } = await req.json();

  const prompt = `Please explain the following topic in 3 bullet points:\n\n${topic}`;

  const completion = await client.chat.completions.create({
    model: process.env.OLLAMA_MODEL,
    messages: [
     { role: 'system', content: 'You are a helpful assistant that explains topics concisely, using exactly three bullet points.' },
     { role: 'user', content: prompt },
    ],
    });
  return Response.json(completion.choices[0].message);
}
