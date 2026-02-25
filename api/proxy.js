export default async function handler(req, res) {
  const { path, ...queryParams } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Parâmetro path é obrigatório' });
  }

  // Reconstrução correta da query string para o MangaDex
  // Arrays precisam ser repetidos: key=val1&key=val2
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(queryParams)) {
    if (Array.isArray(value)) {
      value.forEach(v => searchParams.append(key, v));
    } else {
      searchParams.append(key, value);
    }
  }

  const targetUrl = `https://api.mangadex.org/${path}?${searchParams.toString()}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MangaBR-Hub/1.0.0'
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Repassa o erro do MangaDex para facilitar o debug
      return res.status(response.status).json(data);
    }

    // Headers de segurança e cache
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: 'Erro ao ligar ao MangaDex através do Proxy' });
  }
}
