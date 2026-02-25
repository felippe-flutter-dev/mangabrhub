# MangaBR Hub

Uma plataforma de engenharia de software de alto desempenho para exploração e leitura de mangás em Português. Este projeto não é apenas um leitor, mas uma vitrine de práticas avançadas de desenvolvimento frontend, focando em escalabilidade, desacoplamento e experiência do usuário (UX).

## 🛠 Tecnologias e Ferramentas

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007acc.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)
![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)
![Vitest](https://img.shields.io/badge/-Vitest-252529?style=for-the-badge&logo=vitest&logoColor=f8d64e)
![MangaDex](https://img.shields.io/badge/API-MangaDex-orange?style=for-the-badge)

---

## 🚀 Engineering Highlights

### 🏛️ Arquitetura Desacoplada (Clean Architecture)
O sistema implementa uma separação rigorosa de interesses. Através da **Injeção de Dependência (DI)** centralizada em `src/app/di.ts`, os componentes de UI nunca instanciam serviços ou repositórios diretamente. Isso permite que provedores de dados (MangaDex, Firestore) sejam substituídos sem impactar a lógica visual.

### 💾 Mecanismo de Persistência Inteligente
Implementamos o padrão **StorageService** para gerenciar o estado persistente de forma transparente:
- **Leitura Local:** Progresso de capítulos e preferências de modo de leitura salvos no `LocalStorage` para acesso instantâneo sem latência de rede.
- **Sincronização Cloud:** Integração nativa com Firebase Firestore para comentários e listas personalizadas, garantindo que os dados do usuário estejam disponíveis em qualquer dispositivo.

### 🔄 DevOps e Qualidade (Staff Level CI/CD)
Ciclo de vida automatizado via GitHub Actions garantindo estabilidade:
- **Linting & Análise:** Verificação estática rigorosa com ESLint para manter a padronização.
- **Garantia de Qualidade:** Testes unitários e de integração com Vitest cobrindo 100% da lógica de negócio (Use Cases e Repositories).
- **Continuous Deployment:** Deploy automático para ambientes de **Staging** e **Production** no Firebase Hosting baseado em eventos de Git.

---

## ✨ Funcionalidades Principais

O MangaBR Hub oferece uma experiência premium de leitura:

1.  **Busca Multidimensional:** Filtros avançados por gênero, temas (Isekai, Ação, etc.), status da obra e classificação de idade.
2.  **Leitor Camaleão:** Alternância fluida entre modo **Paginado** (tradicional) e modo **Cascata** (scroll infinito estilo webtoon).
3.  **Memória de Scanlation:** O app "aprende" qual equipe de tradução você prefere e prioriza a mesma scan ao pular para o próximo capítulo.
4.  **Comunidade Integrada:** Sistema de comentários em tempo real por mangá ou por capítulo.
5.  **Biblioteca Pessoal:** Criação de listas ilimitadas (Lendo, Planejo Ler, Favoritos) sincronizadas na nuvem.

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
        MangaDexAPI[MangaDex API]:::data
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
    RepoImpl --> MangaDexAPI
    DI -- Injeta --> RepoImpl
    DI -- Fornece para --> VM
```

### 2. Fluxo da Busca de Mangás
Como uma requisição de busca atravessa o sistema até chegar ao usuário.

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuário
    participant V as View (Search.tsx)
    participant VM as SearchViewModel
    participant UC as SearchMangasUseCase
    participant R as MangaRepository
    participant API as API MangaDex

    U->>V: Digita "Solo Leveling"
    V->>VM: handleSearch(query)
    VM->>UC: execute(params)
    UC->>R: searchMangas(params)
    R->>API: GET /manga?title=...
    API-->>R: JSON Bruto (Relationships/Attributes)
    R->>R: Map to Domain Model (Manga)
    R-->>UC: List<Manga>
    UC-->>VM: List<Manga>
    VM->>V: setResults(data) & setLoading(false)
    V-->>U: Renderiza MangaCards
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
|   +---repositories        # Acesso a Dados (API/Firebase)
|   \---services            # Serviços de Sistema (LocalStorage)
|
+---domain                  # O Coração do Software (Puro TS)
|   +---models              # Modelos de Dados e Enums
|   +---repositories        # Contratos de Dados
|   +---services            # Contratos de Serviços
|   \---usecases            # Lógica de Aplicação (Ações do Usuário)
|
+---presentation            # Camada de Ligação
|   \---viewmodels          # Lógica de UI e Gerenciamento de Estado
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

Este projeto é fruto de um estudo profundo de arquitetura distribuída e UX moderna. Agradecimento especial à equipe do **MangaDex** por manter a melhor API de mangás do mundo.

---

## 👨‍💻 Contato

**Felippe Pinheiro** - Senior Frontend Engineer

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/felippe-pinheiro-dev-flutter/)
