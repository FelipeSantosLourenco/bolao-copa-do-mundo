# ⚽ Bolão da Copa do Mundo 2026

Este é um projeto completo de **Bolão da Copa do Mundo**, estruturado como um monorepo para ser hospedado inteiramente de forma gratuita na **Vercel Free**, utilizando o **Vercel Postgres (Neon)** como banco de dados relacional e **Vercel Serverless Functions** (Node.js) para a API do backend.

---

## 🛠️ Tecnologias e Arquitetura

- **Frontend**: React.js (com Vite), React Router para navegação de SPA e Vanilla CSS.
- **Backend**: Vercel Serverless Functions com Node.js (diretório `/api`).
- **Banco de Dados**: Vercel Postgres / Neon SQL DB.
- **Autenticação**: Tokens JWT e criptografia de senhas com `bcryptjs`.
- **Automação**: Integração automática com a API oficial do `football-data.org` para baixar jogos, placares e atualizar pontuações via **Vercel Cron Jobs**.

---

## 📁 Estrutura do Monorepo

```
/bolao-copa-do-mundo
  ├── vercel.json                      # Configuração de rotas, builds e Cron Jobs da Vercel
  ├── package.json                      # Dependências de backend e scripts auxiliares
  ├── api/                              # Backend (Vercel Serverless Functions)
  │     ├── db.js                       # Conexão Pool com o banco Postgres (Neon)
  │     ├── matches.js                  # Listagem de jogos com os palpites do usuário logado
  │     ├── bets.js                     # Criação/edição de palpites (com trava de 30 minutos)
  │     ├── ranking.js                  # Ranking geral de usuários
  │     ├── auth/
  │     │     ├── register.js           # Registro de novo usuário
  │     │     └── login.js              # Login e geração de JWT
  │     └── admin/
  │           └── update-matches.js     # Sincronização com API externa e cálculo de pontos
  ├── backend/                          # Scripts CLI e Banco de dados
  │     ├── schema.sql                  # Estrutura do banco de dados (tabelas e índices)
  │     ├── seed.js                     # Script para popular banco com jogos de demonstração
  │     ├── update-matches.js           # Script CLI para finalização manual de jogos
  │     └── clear-db.js                 # Script CLI para limpar as tabelas do banco
  └── frontend/                         # Frontend (React + Vite)
        ├── src/
        │     ├── main.jsx              # Arquivo de entrada do React
        │     ├── App.jsx               # Roteamento e Navbar global
        │     ├── index.css             # Estilos premium em Vanilla CSS
        │     ├── components/           # Componentes (Login, Dashboard/Ranking, Bets)
        │     └── context/              # Contexto de Autenticação global
        └── public/
              └── favicon.svg           # Ícone do site (Troféu de Ouro)
```

---

## 🏆 Regras de Pontuação Automática

Assim que uma partida muda o status para `finished` (via sincronização ou script manual), o backend varre todos os palpites daquele jogo e calcula os pontos:

- **Placar cravado (exato)**: **+6 pontos** (incrementa `exact_matches_count`).
- **Acertou o vencedor/empate, mas errou o placar**: **+3 pontos** (incrementa `winner_matches_count`).
- **Todos os outros casos**: **0 pontos**.

A pontuação acumulada é atualizada de forma consolidada na tabela `users`.

---

## ⚙️ Variáveis de Ambiente (`.env`)

Crie um arquivo `.env` na raiz do projeto contendo as seguintes variáveis:

```env
POSTGRES_URL="sua_string_de_conexao_do_neon_postgres"
JWT_SECRET="segredo_jwt_seguro_e_aleatorio"
CRON_SECRET="segredo_de_administracao_para_cron"
FOOTBALL_API_TOKEN="sua_chave_do_football-data_org" # Opcional (se vazio, roda em modo de simulação)
```

---

## 🚀 Como Executar o Projeto Localmente

### 1. Instalar as dependências
Execute o comando na raiz para instalar as dependências da API:
```bash
npm install
```
E na pasta frontend:
```bash
cd frontend && npm install && cd ..
```

### 2. Configurar o Banco de Dados (Seed)
Rode o script na raiz para aplicar o schema SQL e criar os jogos iniciais de teste:
```bash
npm run db:setup
```

### 3. Rodar em Desenvolvimento (Vercel CLI)
Utilize a Vercel CLI para rodar o frontend e a API juntos no endereço `http://localhost:3000`:
```bash
vercel dev
```

---

## 🛠️ Comandos de Banco de Dados (CLI)

- **Popular Banco**: `npm run db:setup` (Aplica o schema SQL e insere os jogos iniciais).
- **Limpar Banco**: `npm run db:clear` (Limpa as tabelas `users`, `matches` e `bets` e reinicia os contadores de ID para 1).
- **Finalizar Jogo Manualmente (Exemplo)**:
  ```bash
  node backend/update-matches.js --matchId=4 --scoreA=2 --scoreB=1
  ```