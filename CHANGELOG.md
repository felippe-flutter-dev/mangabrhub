# Changelog

Todas as mudanças notáveis para o projeto **MangaBR Hub** serão documentadas neste arquivo.

## [2.0.0] - 2025-03-17
### 🚀 Major Resilience & Infrastructure Update

Esta versão representa um marco na estabilidade do projeto, corrigindo gargalos históricos de carregamento de imagens e introduzindo funcionalidades avançadas de economia de dados.

---

### 🛠 Mudanças Técnicas e Correções

- **Resolução de "IP Binding" (Fix 404):** Migramos a solicitação do servidor de imagens (`baseUrl`) para o lado do cliente (Client-side). Isso garante que o IP que solicita o nó da rede MangaDex@Home seja o mesmo que realiza o download, eliminando erros de acesso negado.
- **Otimização de Referrer Policy:** Atualizamos a política global de `no-referrer` para `strict-origin-when-cross-origin`. Esta mudança é vital para a compatibilidade com nós de rede que exigem validação de origem para prevenir hotlinking.
- **Sistema Inteligente de Cache-Busting:** Implementamos parâmetros dinâmicos de versão e timestamp nas URLs de imagem. Isso força o navegador a ignorar caches de erro (404) e buscar conteúdo fresco em casos de falha de rede.
- **Resiliência do Proxy Vercel:** Aumentamos o timeout das Serverless Functions para 25 segundos e adicionamos um parser de resposta robusto para lidar com retornos não-JSON da API upstream.

### ✨ Novas Funcionalidades

- **Seletor de Qualidade de Imagem:** Introduzimos a opção entre **Qualidade Original** e **Modo Econômico (Data-Saver)**. O modo econômico utiliza a rede compactada da MangaDex, ideal para conexões instáveis ou limitadas.
- **Leitor com Isolamento de Erros:** Desenvolvemos um sistema de carregamento assíncrono por página. No modo cascata, a falha de uma única imagem agora é tratada de forma isolada, permitindo retentativas individuais sem interromper a leitura das páginas já carregadas.
- **Tratamento de Capítulos Externos:** Adicionamos detecção automática para capítulos hospedados em plataformas externas (MangaPlus, etc.), fornecendo feedback visual claro e links diretos para a fonte oficial.
- **Novo Menu de Configurações:** Interface unificada no leitor para troca de modo (Paginado/Cascata), qualidade e atualização manual de servidor.

### 📦 Versão
- **Version:** `2.0.0`
- **Status:** Produção Estável 🟢
