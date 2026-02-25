export default async function handler(req, res) {
  // O Vercel extrai o path da URL se configurado no vercel.json ou se passado como query
  const { path, ...queryParams } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Parâmetro path é obrigatório' });
  }

  // Reconstrução manual da query string para garantir que arrays sejam passados como
  // chaves repetidas (ex: includes[]=a&includes[]=b) conforme exigido pelo MangaDex
  const searchParams = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => searchParams.append(key, v));
    } else {
      searchParams.append(key, value);
    }
  });

  const targetUrl = `https://api.mangadex.org/${path}?${searchParams.toString()}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MangaBR-Hub/1.0.0' // O MangaDex gosta de identificar a origem via User-Agent no server-side
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // CORS Headers para permitir que o React converse com este proxy
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: 'Erro ao ligar ao MangaDex através do Proxy' });
  }
}
