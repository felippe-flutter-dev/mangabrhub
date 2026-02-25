let accessToken = null;
let tokenExpiresAt = 0;

async function getMangaDexToken() {
  const now = Date.now();
  if (accessToken && now < tokenExpiresAt) {
    return accessToken;
  }

  const clientId = process.env.MANGADEX_CLIENT_ID;
  const clientSecret = process.env.MANGADEX_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('MangaDex credentials not found in environment variables');
    return null;
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    const response = await fetch('https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token', {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch MangaDex token');
      return null;
    }

    const data = await response.json();
    accessToken = data.access_token;
    // Expira em (expires_in - 60) segundos para segurança
    tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return accessToken;
  } catch (error) {
    console.error('Error fetching MangaDex token:', error);
    return null;
  }
}

export default async function handler(req, res) {
  const { path, ...queryParams } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Parâmetro path é obrigatório' });
  }

  // Tenta obter o token de autenticação
  const token = await getMangaDexToken();

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams)) {
    if (Array.isArray(value)) {
      value.forEach(v => searchParams.append(key, v));
    } else {
      searchParams.append(key, value);
    }
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const targetUrl = `https://api.mangadex.org${cleanPath}?${searchParams.toString()}`;

  try {
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'MangaBR-Hub-Client/1.3.0',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: 'Falha na ponte autenticada com o MangaDex' });
  }
}
