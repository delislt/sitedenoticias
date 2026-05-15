# SIS Notícias

> **Premium coverage of SIS — Simulado Interno Sidarta**

SIS Notícias is a **school project** built as a digital news platform for the Simulado Interno Sidarta context. The published site presents itself as a premium-style news portal focused on organized coverage, editorial presentation, and content management.

## Overview

This project was designed to simulate a modern online newspaper with a clean editorial interface, category-based navigation, article pages, and an admin area for content publishing. Its public repository structure shows a Next.js application organized with `app`, `components`, `lib`, `utils`, and dedicated routes for `admin`, `categoria`, `artigo`, and `sobre`. 

## Why this project exists

The main goal is educational: to build a functional news website as part of a school-oriented experience, combining interface design, structured content, deployment, and backend integration. The live website explicitly references **Simulado Interno Sidarta**, which supports its academic and school-related identity. 

## Features

- Editorial-style homepage with a premium news layout.
- Category-based browsing, including routes such as `juridico`, `csnu`, and `historico`. 
- Admin panel for publishing and managing articles. 
- Image upload flow and Supabase integration in the project structure. 
- Production deployment hosted on Vercel.

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
| Deployment | Vercel |

## Local development

```bash
git clone https://github.com/delislt/sitedenoticias.git
cd sitedenoticias
npm install
npm run dev
```

The repository includes `package.json`, `package-lock.json`, Next.js configuration files, and environment file examples, indicating a standard local development workflow with Node.js. 

## Links

- Live site: [sisnoticias.vercel.app](https://sisnoticias.vercel.app)
- Repository: [github.com/delislt/sitedenoticias](https://github.com/delislt/sitedenoticias) 

