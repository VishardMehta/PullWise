export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_API_URL = process.env.GEMINI_API_URL;
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server not configured: GEMINI_API_KEY missing' });
  }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid prompt' });
  }

  const providerBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.0
    }
  };

  try {
    const upstream = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify(providerBody)
    });
    const text = await upstream.text();
    const status = upstream.ok ? 200 : upstream.status;
    const contentType = upstream.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = JSON.parse(text);
      return res.status(status).json(json);
    }
    return res.status(status).type('text/plain').send(text);
  } catch (err) {
    console.error('Error in /api/analyze:', err);
    return res.status(500).json({ error: 'server_error', detail: String(err) });
  }
}
