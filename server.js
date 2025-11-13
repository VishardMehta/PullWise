import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const GEMINI_API_URL = process.env.GEMINI_API_URL || 'https://api.example-gemini.com/v1/generate';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro';

// Simple health endpoint
app.get('/api/health', (req, res) => res.json({ ok: true, envKeyPresent: !! GEMINI_API_KEY }));

app.post('/api/analyze', async (req, res) => {
  console.log('Incoming /api/analyze request', { url: req.originalUrl, method: req.method, headers: req.headers });
  console.log('body preview:', JSON.stringify(req.body).slice(0, 500));
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Server not configured: gemini_api_key missing' });
    }

    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid prompt' });
    }

    // Build provider request body — adjust fields to match your provider's API.
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
      // provider-specific tuning options go in generationConfig
      generationConfig: {
        temperature: 0.0
      }
    };

    const upstream = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify(providerBody)
    });

    // Forward upstream response body and status; do not parse/manipulate unless needed
    const text = await upstream.text();
    const status = upstream.ok ? 200 : upstream.status;

    // Try to send as JSON if the upstream returned JSON-ish content
    const contentType = upstream.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const json = JSON.parse(text);
        return res.status(status).json(json);
      } catch (e) {
        // fallback to text
      }
    }

    // Fallback: send raw text body
    res.status(status).type('text/plain').send(text);
  } catch (err) {
    console.error('Error in /api/analyze:', err);
    res.status(500).json({ error: 'server_error', detail: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Analysis proxy server listening on http://localhost:${PORT}`);
});
