# 1. OBJECTIVE

* Migrar a aplicação Next.js + Supabase (PostgreSQL) para executar em modo serverless no Cloudflare Workers utilizando Cloudflare D1 (SQLite) como banco de dados.

**Problema operacional:** O projeto atual utiliza Next.js com Supabase (PostgreSQL) e precisa ser adaptado para rodar na infraestrutura serverless do Cloudflare Workers, substituindo o banco de dados PostgreSQL pelo D1 (baseado em SQLite).

# 2. CONTEXT SUMMARY

* **Stack atual:** Next.js 16 (App Router), Supabase (PostgreSQL + Auth), TypeScript, TailwindCSS, Zustand, React Query
* **Arquivo de schema:** `/workspace/project/supabase/migrations/001_initial_schema.sql` - define 11 tabelas com RLS, triggers e índices
* **Autenticação:** Supabase Auth (email/senha)
* **Componentes principais:** 
  - `/src/lib/supabase/client.ts` - cliente browser
  - `/src/lib/supabase/server.ts` - cliente SSR
  - `/src/middleware.ts` - proteção de rotas
* **Constraints técnicos:**
  - Cloudflare Workers tem limitações de runtime (sem Node.js APIs completas)
  - D1 é SQLite, não PostgreSQL (diferenças: tipos de dados, triggers, funções)
  - Precisa de solução alternativa para autenticação (Cloudflare Turnstile + custom auth ou Workers Auth)
  - Next.js no Cloudflare requer configuração especial (Cloudflare Pages ou @opennextjs/cloudflare)

# 3. APPROACH OVERVIEW

A migração será feita em 4 fases principais:

1. **Preparação do ambiente:** Configurar Next.js para Cloudflare Pages/Workers
2. **Migração do banco:** Converter schema PostgreSQL → D1/SQLite, adaptar queries
3. **Migração da autenticação:** Substituir Supabase Auth por solução alternativa (Cloudflare Access + JWT ou custom auth com D1)
4. **Refatoração de código:** Atualizar clientes Supabase para cliente D1

**Alternativas consideradas:**
- Usar Next.js como Cloudflare Pages (recomendado) vs Workers com @opennextjs/cloudflare
- Autenticação: Cloudflare Turnstile + JWT custom vs Auth.js (NextAuth) vs Supabase como serviço externo
- Decisão: Next.js como Cloudflare Pages + autenticação custom com D1 (mais simples e gratuito)

# 4. IMPLEMENTATION STEPS

## Fase 1: Preparação do Ambiente Cloudflare

### 1.1 - Configurar Next.js para Cloudflare Pages
- **Goal:** Habilitar output standalone e configurar adapter para Cloudflare
- **Method:** Instalar `@opennextjs/cloudflare` e configurar next.config.ts
- **Reference:** `/workspace/project/next.config.ts`

### 1.2 - Criar wrangler.toml para configuração D1
- **Goal:** Configurar bindings do D1 no projeto
- **Method:** Criar arquivo wrangler.toml com definição do banco D1
- **Reference:** `/workspace/project/wrangler.toml` (novo)

---

## Fase 2: Migração do Banco de Dados (PostgreSQL → D1/SQLite)

### 2.1 - Converter schema SQL para SQLite/D1
- **Goal:** Adaptar o schema de PostgreSQL para SQLite (D1)
- **Method:** Remover extensões PostgreSQL específicas, converter tipos UUID para TEXT, adaptar triggers
- **Reference:** `/workspace/project/supabase/migrations/001_initial_schema.sql` → novo schema D1

### 2.2 - Criar script de seed para dados iniciais
- **Goal:** Popular tabelas iniciais (exercícios, equipamentos)
- **Method:** Criar arquivo seed com INSERTs para tabelas base
- **Reference:** `/workspace/project/d1/seed.sql` (novo)

### 2.3 - Criar cliente D1 para Next.js
- **Goal:** Implementar wrapper para acesso ao D1 com bindings do Cloudflare
- **Method:** Criar lib/db.ts usando D1 from `@cloudflare/workers-types`
- **Reference:** `/workspace/project/src/lib/db/index.ts` (novo)

### 2.4 - Converter queries Supabase para D1
- **Goal:** Substituir queries Supabase por queries D1 direto
- **Method:** Adaptar padrão de queries (select, insert, update, delete) para API D1
- **Reference:** Múltiplos arquivos em `/workspace/project/src/lib/`

---

## Fase 3: Migração da Autenticação

### 3.1 - Implementar sistema de autenticação custom
- **Goal:** Substituir Supabase Auth por autenticação própria com D1
- **Method:** Criar tabela users + sessions no D1, implementar login/register com hash de senha
- **Reference:** `/workspace/project/src/lib/auth/` (novo diretório)

### 3.2 - Criar API de autenticação (API Routes)
- **Goal:** Disponibilizar endpoints de login, register, logout, session
- **Method:** Criar rotas em `/src/app/api/auth/` para manipulação de sessões
- **Reference:** `/workspace/project/src/app/api/auth/` (novo)

### 3.3 - Atualizar middleware para nova autenticação
- **Goal:** Proteger rotas com novo sistema de auth
- **Method:** Modificar middleware.ts para validar token JWT/sessão do cookie
- **Reference:** `/workspace/project/src/middleware.ts`

### 3.4 - Atualizar hooks de autenticação
- **Goal:** Substituir useAuth do Supabase pelo novo sistema
- **Method:** Modificar `/src/lib/hooks/use-auth.tsx` para usar novo auth
- **Reference:** `/workspace/project/src/lib/hooks/use-auth.tsx`

---

## Fase 4: Refatoração e Integração

### 4.1 - Criar repository/Service layer para banco
- **Goal:** Abstrair acesso ao D1 com métodos reutilizáveis
- **Method:** Criar módulos para cada entidade (profiles, workouts, exercises, etc)
- **Reference:** `/workspace/project/src/lib/repositories/` (novo)

### 4.2 - Atualizar componentes que usam Supabase Client
- **Goal:** Substituir chamadas ao Supabase pelos novos repositórios
- **Method:** Refatorar arquivos que usam `createClient()` do Supabase
- **Reference:** Múltiplos componentes em `/workspace/project/src/app/`

### 4.3 - Configurar variáveis de ambiente
- **Goal:** Definir novas env vars para Cloudflare
- **Method:** Criar arquivo .env.example com D1 e config Cloudflare
- **Reference:** `/workspace/project/.env.local` (atualizar)

### 4.4 - Testar build e deployment
- **Goal:** Verificar que o projeto compila e faz deploy para Cloudflare
- **Method:** Executar `npm run build` com adapter Cloudflare e testar via `wrangler pages deploy`

# 5. TESTING AND VALIDATION

**Validações técnicas:**
- Build compilando com sucesso: `npm run build` sem erros
- Deploy funcionando: `wrangler pages deploy` completando sem erros
- Banco D1 criando: `wrangler d1 execute` executando queries
- Autenticação funcionando: Registro, login, logout e proteção de rotas
- Dados persistindo: CRUD completo em todas as entidades

**Fluxos críticos a testar:**
1. Registro de novo usuário → cria profile no D1
2. Login com email/senha → retorna sessão válida
3. Acesso a rotas protegidas sem auth → redireciona para login
4. Criar template de treino → persiste no D1
5. Executar treino → registra séries e histórico
6. Consulta de exercícios → retorna dados do seed

**Sucesso =** Aplicação rodando no Cloudflare Pages com D1, todas as funcionalidades originais funcionando, autenticação operacional.
