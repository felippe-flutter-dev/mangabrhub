export default async function handler(req, res) {
  const { path, ...queryParams } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Path parameter is required' });
  }

  // Monta a query string a partir dos parâmetros recebidos
  const queryString = new URLSearchParams(queryParams).toString();

  // A URL alvo agora é dinâmica baseada no "path" enviado pelo front
  const targetUrl = `https://api.mangadex.org/${path}?${queryString}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Erro na resposta do MangaDex' });
    }

    const data = await response.json();

    // Configura headers de cache para performance (opcional)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: 'Erro ao ligar ao MangaDex' });
  }
}
