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
  const { path, ...queryParams } = req.query;
  if (!path) return res.status(400).json({ error: 'Parâmetro path é obrigatório' });

  const token = await getMangaDexToken();
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(queryParams)) {
    if (Array.isArray(value)) value.forEach(v => searchParams.append(key, v));
    else searchParams.append(key, value);
  }

  const cleanPath = path.split('?')[0];
  const targetUrl = `https://api.mangadex.org${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}?${searchParams.toString()}`;

  try {
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'MangaBR-Hub-Client/1.4.0',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(20000)
    });

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { error: 'Invalid response from MangaDex', detail: text.substring(0, 100) };
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 'no-store, max-age=0');

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy Fatal Error:', error.message);
    const status = error.name === 'TimeoutError' ? 504 : 502;
    return res.status(status).json({
      error: 'Erro na comunicação com MangaDex',
      message: error.message
    });
  }
}
