# FinGlow

Sistema web completo de gestao financeira pessoal com Next.js App Router, TypeScript, Tailwind CSS e Supabase.

O projeto foi estruturado para parecer um produto SaaS real:

- autenticacao com Supabase Auth
- rotas privadas
- dados isolados por usuario com RLS
- dashboard responsivo com graficos
- CRUD de transacoes
- CRUD de categorias
- orcamento mensal por categoria
- relatorios com exportacao CSV
- layout moderno para mobile, tablet e desktop
- preparado para deploy gratuito via Vercel

## Arquitetura escolhida

### Visao geral

- `Next.js App Router`: renderizacao hibrida com Server Components para leitura segura de dados e Client Components apenas onde existe interacao.
- `Supabase SSR`: leitura de sessao via cookies no servidor, middleware para refresh de sessao e protecao de rotas.
- `Server Actions`: criacao, edicao e exclusao feitas no servidor, com validacao Zod antes de gravar no banco.
- `PostgreSQL + RLS`: o banco garante isolamento real entre usuarios mesmo se o frontend for manipulado.

### Fluxo de autenticacao

1. O usuario cria conta com e-mail e senha.
2. O Supabase Auth cria o usuario.
3. Um trigger SQL cria automaticamente o perfil em `profiles` e categorias padrao.
4. O middleware verifica sessao em cada request protegida.
5. Se o usuario nao estiver autenticado, ele e redirecionado para `/login`.
6. Cada consulta usa o usuario autenticado e ainda passa pelas policies de RLS.

### Comunicacao com o Supabase

- `lib/supabase/server.ts`: cliente server-side com cookies.
- `lib/supabase/browser.ts`: cliente browser-side para cenarios client-side.
- `lib/supabase/middleware.ts`: refresh de sessao e bloqueio de rotas privadas.
- `app/actions/*`: mutacoes seguras.
- `services/*`: camada de leitura, agregacao e relatorios.

## Estrutura de pastas

```text
app
  (auth)
    cadastro
    login
    recuperar-senha
    redefinir-senha
  (dashboard)
    categorias
    dashboard
    orcamentos
    relatorios
    transacoes
  actions
  api/reports/export
  auth/confirm
components
  auth
  budgets
  categories
  dashboard
  layout
  providers
  reports
  transactions
  ui
hooks
lib
  supabase
  validations
services
supabase
types
```

## Tecnologias usadas

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase
- Supabase Auth
- PostgreSQL do Supabase
- React Hook Form
- Zod
- Recharts
- Lucide React

## Principais arquivos

### Fundacao do app

- `app/layout.tsx`: layout raiz com fontes, tema e notificacoes.
- `app/globals.css`: tokens visuais, tema claro/escuro e base visual premium.
- `middleware.ts`: refresh de sessao e redirecionamento de usuarios nao autenticados.
- `lib/supabase/*`: clientes SSR, browser e route handlers.
- `lib/auth.ts`: guardas de autenticacao.

### Autenticacao

- `app/actions/auth.ts`: login, cadastro, recuperacao, reset e logout.
- `app/auth/confirm/route.ts`: confirmacao segura de links do Supabase.
- `app/(auth)/*`: telas publicas de autenticacao.
- `components/auth/*`: formularios com React Hook Form + Zod.

### Area privada

- `app/(dashboard)/layout.tsx`: shell protegido do sistema.
- `components/layout/app-shell.tsx`: sidebar, header, navegação mobile e tema.
- `app/(dashboard)/dashboard/page.tsx`: dashboard principal.
- `app/(dashboard)/transacoes/page.tsx`: CRUD e filtros de transacoes.
- `app/(dashboard)/categorias/page.tsx`: CRUD de categorias.
- `app/(dashboard)/orcamentos/page.tsx`: limites mensais por categoria.
- `app/(dashboard)/relatorios/page.tsx`: relatorios e exportacao CSV.

### Regras de negocio e dados

- `services/dashboard-service.ts`: KPIs, saldo, comparacoes e graficos.
- `services/transaction-service.ts`: listagem e filtros de transacoes.
- `services/category-service.ts`: categorias do usuario.
- `services/budget-service.ts`: progresso de orcamentos.
- `services/report-service.ts`: consolidacao de relatorios e CSV.

### Banco de dados

- `supabase/schema.sql`: SQL completo com tabelas, indices, triggers, RLS e policies.

## Como instalar e rodar localmente

### 1. Instale o Node.js

Use Node.js 20 ou superior.

### 2. Instale as dependencias

```bash
npm install
```

### 3. Configure o ambiente

O arquivo `.env.local` ja foi preenchido localmente neste workspace com o seu projeto Supabase.

Se quiser recriar manualmente, copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

### 4. Rode o projeto

```bash
npm run dev
```

Depois acesse:

```text
http://localhost:3000
```

## Como configurar o Supabase

### 1. Criar projeto

No painel do Supabase, crie um projeto novo ou use o projeto existente.

### 2. Ativar login por e-mail e senha

No menu lateral:

`Authentication` -> `Providers` -> habilite `Email`.

### 3. Aplicar o SQL

1. Abra `SQL Editor`.
2. Crie uma nova query.
3. Copie todo o conteúdo de `supabase/schema.sql`.
4. Execute.

### 4. O que o SQL faz

- cria `profiles`, `categories`, `transactions` e `budgets`
- cria indices para busca e filtros
- cria triggers de `updated_at`
- cria triggers de integridade para impedir categoria errada em transacao ou orcamento
- cria perfil automatico quando um usuario nasce no `auth.users`
- cria categorias padrao no cadastro
- ativa RLS
- cria policies para restringir tudo ao dono do registro

## Decisoes de seguranca adotadas

- RLS ativado em todas as tabelas principais.
- Policies com `auth.uid()` para isolar os dados por usuario.
- Middleware para bloquear rotas privadas.
- Server Actions para mutacoes com validacao no servidor.
- Validacao dupla: frontend com Zod + backend com Zod + constraints SQL.
- Triggers SQL para impedir categoria de outro usuario ou tipo inconsistente.
- Nao usamos service role key no frontend.
- Apenas URL publica e chave publica do Supabase ficam no cliente, o que e o padrao correto do Supabase.

## Deploy gratuito no Vercel

### Passo 1. Criar conta no GitHub

1. Acesse [https://github.com](https://github.com).
2. Clique em `Sign up`.
3. Escolha e-mail, senha e nome de usuario.
4. Confirme o e-mail.

### Passo 2. Criar repositorio

1. Clique em `New repository`.
2. Defina um nome, por exemplo `finglow`.
3. Escolha `Public` ou `Private`.
4. Clique em `Create repository`.

### Passo 3. Subir o codigo

Dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "feat: initial financial saas app"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/finglow.git
git push -u origin main
```

### Passo 4. Criar conta no Supabase

1. Acesse [https://supabase.com](https://supabase.com).
2. Clique em `Start your project`.
3. Entre com GitHub ou e-mail.

### Passo 5. Criar projeto no Supabase

1. Clique em `New project`.
2. Escolha organizacao.
3. Informe nome, senha do banco e regiao.
4. Aguarde a criacao.

### Passo 6. Encontrar URL e chave

1. Abra `Project Settings`.
2. Clique em `Data API` ou `API`.
3. Copie `Project URL`.
4. Copie a `publishable key` ou `anon public key`.

### Passo 7. Habilitar login por e-mail e senha

1. Va em `Authentication`.
2. Abra `Providers`.
3. Deixe `Email` ativo.
4. Se quiser simplificar os testes, voce pode desativar a confirmacao de e-mail no inicio.

### Passo 8. Executar o SQL

1. Abra `SQL Editor`.
2. Cole o arquivo `supabase/schema.sql`.
3. Clique em `Run`.

### Passo 9. Testar o banco

1. Abra `Table Editor`.
2. Verifique se apareceram `profiles`, `categories`, `transactions` e `budgets`.
3. Crie um usuario no app e veja se `profiles` e categorias padrao foram criados automaticamente.

### Passo 10. Criar conta no Vercel

1. Acesse [https://vercel.com](https://vercel.com).
2. Clique em `Sign Up`.
3. Entre com GitHub.

### Passo 11. Importar o repositorio no Vercel

1. Clique em `Add New`.
2. Escolha `Project`.
3. Selecione o repositorio do GitHub.
4. Clique em `Import`.

### Passo 12. Configurar variaveis de ambiente no Vercel

Adicione:

- `NEXT_PUBLIC_SITE_URL`: URL final do projeto no Vercel
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave publica do Supabase

### Passo 13. Fazer o primeiro deploy

1. Clique em `Deploy`.
2. Aguarde o build terminar.
3. Abra a URL publicada.

### Passo 14. Testar o sistema online

1. Crie uma conta.
2. Faca login.
3. Cadastre categorias, receitas, despesas e orcamentos.
4. Confirme se cada usuario ve apenas os proprios dados.

### Passo 15. Acessar pelo celular e outros dispositivos

1. Abra a URL do Vercel no navegador do celular.
2. Faca login normalmente.
3. Como o app e responsivo, a mesma URL funciona em desktop, tablet e mobile.

### Passo 16. Atualizar o projeto no futuro

Sempre que fizer mudancas:

```bash
git add .
git commit -m "feat: sua alteracao"
git push
```

O Vercel vai iniciar um novo deploy automaticamente.

## Manutencao futura

- Adicione novos modulos em `services` e `app/actions`.
- Mantenha novas tabelas com RLS por padrao.
- Reaproveite os schemas Zod em `lib/validations`.
- Preserve consultas sensiveis em Server Components e Server Actions.
- Se quiser escalar, adicione paginação e testes automatizados.
#   f i n g l o w - f i n a n c a s  
 