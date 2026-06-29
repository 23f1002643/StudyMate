import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Netlify Function: proxies Ollama requests server-side
// This bypasses browser Mixed Content (HTTPS→HTTP) restrictions
// The client sends to /.netlify/functions/ollama-proxy
// This function forwards to the Ollama server (configured via env or request header)

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  // CORS headers for browser access
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Ollama-URL',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method not allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { ollamaUrl, endpoint, ...ollamaBody } = body;

    // ollamaUrl comes from client Settings, default to localhost
    const baseUrl = (ollamaUrl || 'http://localhost:11434').replace(/\/$/, '');
    const targetUrl = `${baseUrl}${endpoint || '/api/chat'}`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ollamaBody),
      // @ts-ignore - Node 18+ supports signal
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({ error: text }),
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (err: any) {
    const isTimeout = err.name === 'TimeoutError' || err.code === 'UND_ERR_CONNECT_TIMEOUT';
    const isRefused = err.message?.includes('ECONNREFUSED') || err.message?.includes('fetch failed');

    return {
      statusCode: 503,
      headers: corsHeaders,
      body: JSON.stringify({
        error: isRefused || isTimeout
          ? 'Cannot reach Ollama server. Make sure it is running with: OLLAMA_ORIGINS="*" ollama serve'
          : err.message,
      }),
    };
  }
};

export { handler };
