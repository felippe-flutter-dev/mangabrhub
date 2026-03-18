let accessToken = null;
let tokenExpiresAt = 0;

async function getMangaDexToken() {
  const now = Date.now();
  if (accessToken && now < tokenExpiresAt) return accessToken;
  const clientId = process.env.MANGADEX_CLIENT_ID;
  const clientSecret = process.env.MANGADEX_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    const response = await fetch('https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token', {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    if (!response.ok) return null;
    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return accessToken;
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  const { path, url, base, ...queryParams } = req.query;

  let targetUrl = '';
  if (url) {
    targetUrl = decodeURIComponent(url);
  } else if (path) {
    const baseUrl = base === 'uploads' ? 'https://uploads.mangadex.org' : 'https://api.mangadex.org';
    const cleanPath = path.split('?')[0];
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (Array.isArray(value)) value.forEach(v => searchParams.append(key, v));
      else searchParams.append(key, value);
    }
    targetUrl = `${baseUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}?${searchParams.toString()}`;
  } else {
    return res.status(400).json({ error: 'Parâmetro path ou url é obrigatório' });
  }

  try {
    const token = await getMangaDexToken();

    // Headers idênticos ao MangaDex oficial para evitar 404/bloqueio
    // Note: 'Referer' precisa ser exatamente como o MangaDex espera
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://mangadex.org/',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Sec-Fetch-Dest': 'image',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Site': 'cross-site'
    };

    if (token && !url) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(targetUrl, {
      headers,
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      console.error(`MangaDex Proxy Error (${response.status}): ${targetUrl}`);
      const errorText = await response.text();
      return res.status(response.status).send(errorText);
    }

    const contentType = response.headers.get('content-type');
    res.setHeader('Content-Type', contentType || 'image/jpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return res.send(buffer);

  } catch (error) {
    console.error('Proxy Fatal Error:', error.message);
    return res.status(502).json({ error: 'Erro de comunicação', message: error.message });
  }
}
