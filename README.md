# SIS Jornal

Portal de notícias do **SIS — Simulado Interno Sidarta** com front-end em Next.js.

## Como acessar o site

### 1) Acesso local (recomendado para desenvolvimento)

1. Instale as dependências:

```bash
npm install
```

2. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

3. Abra no navegador:

- http://localhost:3000

### 2) Build de produção local (opcional)

```bash
npm run build
npm run start
```

Depois, abra:

- http://localhost:3000

## Rotas

- `/` Home
- `/categoria/juridico`, `/categoria/csnu`, `/categoria/historico`
- `/artigo/[slug]`
- `/busca`
- `/sobre`
- `/admin` (painel local para criar/editar/remover notícias)

## Banco de dados recomendado (próximo passo)

Use **Supabase** (PostgreSQL + Auth + Storage + API pronta), ideal para evoluir este projeto sem alto custo operacional.

### Passo a passo rápido

1. Crie conta em https://supabase.com e um novo projeto.
2. Em **SQL Editor**, rode a tabela inicial:

```sql
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text not null,
  category text not null check (category in ('juridico','csnu','historico')),
  author text not null,
  published_at date not null,
  reading_time text not null,
  cover_image text not null,
  content jsonb not null,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

3. Crie `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=seu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
```

4. Instale SDK:

```bash
npm install @supabase/supabase-js
```

5. Próxima etapa de integração:
   - trocar `data/news.ts` por queries do Supabase para site público.
   - trocar persistência local do `/admin` por insert/update/delete na tabela `articles`.
   - habilitar RLS e autenticação para proteger o painel admin.
