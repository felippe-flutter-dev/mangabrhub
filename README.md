# MangaBR Hub

Uma plataforma de engenharia de software de alto desempenho para exploração e leitura de mangás em Português. Este projeto não é apenas um leitor, mas uma vitrine de práticas avançadas de desenvolvimento frontend, focando em escalabilidade, desacoplamento e experiência do usuário (UX).

## 🛠 Tecnologias e Ferramentas

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007acc.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)
![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)
![Vitest](https://img.shields.io/badge/-Vitest-252529?style=for-the-badge&logo=vitest&logoColor=f8d64e)
![MangaDex](https://img.shields.io/badge/API-MangaDex-orange?style=for-the-badge)

---

## 🚀 Engineering Highlights

### 🏛️ Arquitetura Desacoplada (Clean Architecture)
O sistema implementa uma separação rigorosa de interesses. Através da **Injeção de Dependência (DI)** centralizada em `src/app/di.ts`, os componentes de UI nunca instanciam serviços ou repositórios diretamente. Isso permite que provedores de dados (MangaDex, Firestore) sejam substituídos sem impactar a lógica visual.

### 🛡️ Proxy Serverless (Vercel) & Bypass de CORS
Para contornar as restrições de CORS da API do MangaDex em ambiente de produção, implementamos um **Proxy Serverless** via Vercel Functions (`api/proxy.js`). Isso garante que as requisições sejam feitas de servidor para servidor, eliminando bloqueios de segurança do navegador e permitindo o uso de um `User-Agent` customizado para melhor identificação junto à API original.

### 💾 Mecanismo de Persistência Inteligente
Implementamos o padrão **StorageService** para gerenciar o estado persistente de forma transparente:
- **Leitura Local:** Progresso de capítulos e preferências de modo de leitura salvos no `LocalStorage` com disparos de eventos customizados para atualização de UI reativa.
- **Sincronização Cloud:** Integração nativa com Firebase Firestore para comentários e listas personalizadas sincronizadas entre dispositivos.

### 🔄 DevOps e Qualidade (Staff Level CI/CD)
Ciclo de vida automatizado via GitHub Actions e Vercel:
- **Linting & Análise:** Verificação estática rigorosa com ESLint integrada ao workflow de push.
- **Garantia de Qualidade:** Suite de testes unitários e de integração com Vitest validando Repositories e Use Cases.
- **Continuous Deployment:** Deploy automático via Vercel vinculado diretamente ao GitHub, garantindo que apenas código validado pelos testes chegue em produção.

---

## ✨ Funcionalidades Principais

O MangaBR Hub oferece uma experiência premium de leitura:

1.  **Busca Multidimensional:** Filtros avançados por gênero, temas, status da obra e classificação de idade.
2.  **Leitor Camaleão:** Alternância fluida entre modo **Paginado** (tradicional) e modo **Cascata** (scroll infinito estilo webtoon).
3.  **Memória de Scanlation:** O app prioriza automaticamente a sua equipe de tradução favorita ao navegar entre capítulos.
4.  **Comunidade Integrada:** Sistema de comentários em tempo real por mangá ou por capítulo.
5.  **Biblioteca Pessoal:** Criação de listas sincronizadas (Lendo, Planejo Ler, Favoritos) via Firebase.

---

## 📊 Fluxos de Dados e Arquitetura

### 1. Comunicação entre Camadas (Arquitetura Limpa)
Este diagrama ilustra como as camadas são isoladas. A regra de ouro é: **as dependências apontam apenas para dentro (Domínio).**

```mermaid
graph TD
    classDef domain fill:#6366f1,stroke:#fff,stroke-width:2px,color:#fff;
    classDef data fill:#10b981,stroke:#fff,stroke-width:2px,color:#fff;
    classDef app fill:#f59e0b,stroke:#fff,stroke-width:2px,color:#fff;

    subgraph "Camada de Infra (DATA)"
        RepoImpl[Repositories Implementation]:::data
        Firebase[Firebase SDK]:::data
        Proxy[Vercel Proxy API]:::data
    end

    subgraph "Camada de Negócio (DOMAIN)"
        UC[Use Cases]:::domain
        Interfaces[Interfaces / Contracts]:::domain
        Models[Entities / Enums]:::domain
    end

    subgraph "Camada de Visualização (APP)"
        View[React Components]:::app
        VM[ViewModels / Hooks]:::app
        DI[DI Container]:::app
    end

    View --> VM
    VM --> UC
    UC --> Interfaces
    RepoImpl -- Implementa --> Interfaces
    RepoImpl --> Firebase
    RepoImpl --> Proxy
    DI -- Injeta --> RepoImpl
    DI -- Fornece para --> VM
```

### 2. Fluxo da Busca via Proxy
Como uma requisição atravessa o proxy para evitar CORS.

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuário
    participant V as View
    participant VM as ViewModel
    participant R as MangaRepository
    participant P as Vercel Proxy (/api/proxy)
    participant API as MangaDex API

    U->>V: Digita Busca
    V->>VM: Solicita Busca
    VM->>R: searchMangas(params)
    R->>P: GET /api/proxy?path=manga&...
    P->>API: GET api.mangadex.org/manga...
    API-->>P: JSON Data
    P-->>R: Resposta Segura (CORS OK)
    R->>R: Map to Domain Entity
    R-->>VM: List<Manga>
    VM-->>V: Update State
```

### 3. Funcionamento do MVVM
O padrão Model-View-ViewModel garante que a UI seja uma função do estado.

```mermaid
stateDiagram-v2
    direction LR
    state "VIEW (React)" as V
    state "VIEWMODEL (Custom Hook)" as VM
    state "MODEL (Domain Entities)" as M

    V --> VM: Interação (Click/Scroll)
    VM --> VM: Lógica de Estado (Loading/Error)
    VM --> M: Solicita Dados
    M --> VM: Retorna Dados Tipados
    VM --> V: Notifica Mudança de Estado
    V --> V: Re-renderiza UI
```

---

## ☕ Apoie o Projeto

O MangaBR Hub é um projeto **Open Source** e sem fins lucrativos. Sua ajuda garante que continuemos no ar, sem anúncios e com alta performance.

Cada doação é reinvestida integralmente na infraestrutura (API do MangaDex, Servidores e Proxy).

### Doe via PIX
Escaneie o QR Code abaixo ou utilize a chave copia e cola.

<div align="center">
  <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=1dc8bd39-88b8-499f-bf49-3d531158f5c8" alt="QR Code PIX" />
  <br />
  <code>1dc8bd39-88b8-499f-bf49-3d531158f5c8</code>
  <br /><br />
  <a href="https://link.mercadopago.com.br/mangahubapoiadores">
    <img src="https://img.shields.io/badge/Pagar%20via-Mercado%20Pago-blue?style=for-the-badge&logo=mercadopago" alt="Mercado Pago" />
  </a>
</div>

---

## 📂 Estrutura do Diretório `src`

```text
src
|   main.tsx                # Inicialização do React e DOM
|
+---app                     # Configuração e Componentes Globais
|   |   di.ts               # Injeção de Dependências (Ponto de Config)
|   |   routes.ts           # Roteamento Centralizado
|   |
|   +---components          # UI Reutilizável
|   |   \---ui              # Design System (Shadcn/UI)
|   \---lib                 # Configuração de Provedores (Firebase)
|
+---data                    # Implementação de Infraestrutura
|   +---repositories        # Acesso a Dados (Proxy/Firebase)
|   \---services            # Serviços de Sistema (LocalStorage)
|
+---domain                  # O Coração do Software (Puro TS)
|   +---models              # Modelos de Dados e Enums
|   +---repositories        # Contratos de Dados
|   +---services            # Contratos de Serviços
|   \---usecases            # Lógica de Aplicação
|
+---presentation            # Camada de Ligação
|   \---viewmodels          # Lógica de UI e Hooks customizados
|
\---test                    # Qualidade e Cobertura (Mocks/Setup)
```

---

## 🛠 Guia de Instalação (Getting Started)

Siga os passos abaixo para rodar o projeto em sua máquina:

1. **Clonar o Repositório:**
   ```sh
   git clone https://github.com/felippe-flutter-dev/mangabr-hub.git
   cd mangabr-hub
   ```

2. **Instalar Dependências:**
   ```sh
   npm install
   ```

3. **Executar em Modo de Desenvolvimento:**
   ```sh
   npm run dev
   ```

4. **Executar Testes (Vitest):**
   ```sh
   # Rodar todos os testes
   npm run test:run

   # Ver cobertura de código
   npm run test:coverage
   ```

---

## 🤝 Agradecimentos

Este projeto é fruto de um estudo profundo de arquitetura distribuída e UX moderna. Agradecimento especial à equipe do **MangaDex** pela infraestrutura de API.

---

## 👨‍💻 Contato

**Felippe Pinheiro** - Senior Frontend Engineer

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/felippe-pinheiro-dev-flutter/)
