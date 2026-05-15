# SIS Notícias

> **Premium coverage of SIS — Simulado Interno Sidarta** [1]

SIS Notícias is a **school project** built as a digital news platform for the Simulado Interno Sidarta context. The published site presents itself as a premium-style news portal focused on organized coverage, editorial presentation, and content management. [1]

## Overview

This project was designed to simulate a modern online newspaper with a clean editorial interface, category-based navigation, article pages, and an admin area for content publishing. Its public repository structure shows a Next.js application organized with `app`, `components`, `lib`, `utils`, and dedicated routes for `admin`, `categoria`, `artigo`, and `sobre`. 

## Why this project exists

The main goal is educational: to build a functional news website as part of a school-oriented experience, combining interface design, structured content, deployment, and backend integration. The live website explicitly references **Simulado Interno Sidarta**, which supports its academic and school-related identity. [1]

## Features

- Editorial-style homepage with a premium news layout. [1]
- Category-based browsing, including routes such as `juridico`, `csnu`, and `historico`. 
- Admin panel for publishing and managing articles. 
- Image upload flow and Supabase integration in the project structure. 
- Production deployment hosted on Vercel. [1]

## Project structure

```bash
.
├── app/
│   ├── admin/
│   ├── api/
│   ├── artigo/
│   ├── categoria/
│   ├── sobre/
│   ├── layout.tsx
│   └── page.tsx
├── components/
├── lib/
├── utils/
└── middleware.ts
```

This structure reflects a modern Next.js App Router project, with separated routes, UI components, and utility layers. 

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js  |
| UI | React with `.tsx` components  |
| Styling | Tailwind CSS  |
| Backend and database | Supabase  |
| Deployment | Vercel [1] |

## Local development

```bash
git clone https://github.com/delislt/sitedenoticias.git
cd sitedenoticias
npm install
npm run dev
```

The repository includes `package.json`, `package-lock.json`, Next.js configuration files, and environment file examples, indicating a standard local development workflow with Node.js. 

## Environment variables

Create a `.env.local` file with the required project credentials. The repository includes `.env.local.example`, which indicates that environment variables are part of the setup. 

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Project identity

SIS Notícias combines the structure of a digital newsroom with the identity of a school project. The live version uses the tagline “Premium coverage of SIS — Simulado Interno Sidarta,” reinforcing both the editorial concept and the academic context behind the website. [1]

## Links

- Live site: [sisnoticias.vercel.app](https://sisnoticias.vercel.app) [1]
- Repository: [github.com/delislt/sitedenoticias](https://github.com/delislt/sitedenoticias) 

## Current status

At the time this README was prepared, the public homepage displayed the message “Nenhuma notícia publicada ainda.”, which suggests the platform is ready to receive new content through the admin publishing workflow. [1]
