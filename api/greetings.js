// File: api/greetings.js
// Vercel serverless function (handles GET and POST)
// REQUIRES in Vercel Environment Variables:
//   - GITHUB_TOKEN  (token with "gist" scope)
//   - GIST_ID       (the gist id that contains greetings.json)
//
// CORS: permite llamadas desde tu GitHub Pages (origenes).
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const envGistId = process.env.GIST_ID;

  try {
    // Use gist id from query param if provided, otherwise from env
    const gistId = req.query?.gist_id || envGistId;
    if (!gistId) {
      return res.status(400).json({ error: 'No GIST_ID configured (env GIST_ID or query param gist_id required)' });
    }

    if (req.method === 'GET') {
      // Leer el gist y devolver el contenido de greetings.json como JSON (array)
      const gresp = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github.v3+json'
        }
      });

      if (!gresp.ok) {
        const err = await gresp.json().catch(() => ({}));
        return res.status(gresp.status).json({ error: 'Error fetching gist', details: err });
      }

      const data = await gresp.json();
      const file = data.files && data.files['greetings.json'];
      const content = file && typeof file.content === 'string' ? file.content : '[]';
      let greetings;
      try {
        greetings = JSON.parse(content);
      } catch (e) {
        greetings = [];
      }
      return res.status(200).json(greetings);
    }

    if (req.method === 'POST') {
      if (!GITHUB_TOKEN) {
        return res.status(500).json({ error: 'GITHUB_TOKEN not set in environment' });
      }

      // Esperamos body: { greetings: [...] } (array completo)
      const payload = req.body;
      const newGreetings = payload?.greetings ?? payload;

      if (!Array.isArray(newGreetings)) {
        return res.status(400).json({ error: 'Bad request: body should be { "greetings": [ ... ] }' });
      }

      const patchResp = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: {
            'greetings.json': {
              content: JSON.stringify(newGreetings, null, 2)
            }
          }
        })
      });

      const result = await patchResp.json().catch(() => ({}));
      return res.status(patchResp.ok ? 200 : patchResp.status).json(result);
    }

    // Método no permitido
    res.setHeader('Allow', 'GET,POST,OPTIONS');
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Error interno', details: error?.message || String(error) });
  }
}