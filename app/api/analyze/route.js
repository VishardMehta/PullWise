export async function POST(req) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return Response.json({ error: "Missing prompt" }, { status: 400 });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_API_URL = process.env.GEMINI_API_URL;

    if (!GEMINI_API_KEY) {
      return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
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
      generationConfig: { temperature: 0 }
    };

    const upstream = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(providerBody)
    });

    const text = await upstream.text();
    const ct = upstream.headers.get("content-type") || "";

    if (ct.includes("application/json")) {
      return new Response(text, {
        status: upstream.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": "text/plain" }
    });
  } catch (err) {
    return Response.json(
      { error: "server_error", detail: String(err) },
      { status: 500 }
    );
  }
}
