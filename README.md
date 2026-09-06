# Jornal SIS — SIS Notícias

Portal do **Simulado Interno Sidarta**, com cobertura acadêmica dos comitês Jurídico, CSNU e Histórico. Site: [sisnoticias.vercel.app](https://sisnoticias.vercel.app).

A aplicação existente foi ampliada, preservando os dossiês, textos, URLs, logotipo, tipografia, dourado e temas. Acontecimentos da simulação são identificados no conteúdo e no compartilhamento.

## Funcionalidades

- Notícias com rascunho, revisão, publicação e arquivamento; prévia protegida, autoria, fontes, correções, histórico e proteção contra sobrescrita.
- Login por email e senha ou Google, confirmação de email, recuperação/troca de senha, nome e foto de perfil; funções protegidas de jornalista, editor, moderador e administrador.
- Comentários verificados, revisão prévia inicial, respostas em um nível, edição por 15 minutos, remoção, denúncias, suspensão e histórico de decisões.
- Busca em português, filtros compartilháveis, paginação no banco, consulta direta por slug, redirecionamento de endereços antigos e matérias relacionadas.
- Favoritos locais e sincronização opcional, compartilhamento, tamanho de texto, impressão e metadados por artigo.
- Agenda com ICS, biblioteca com PDFs públicos ou restritos, cobertura por sessão, avisos, glossário e arquivo de notícias.
- Uploads privados validados no servidor, limites persistentes no banco, CSP, controle de origem e RLS.

**Estado atual:** o cadastro está aberto com confirmação de email e Google. Novos comentários continuam fechados até a operação de moderação ser configurada. O segundo código por email está preparado, mas só deve ser tornado obrigatório depois da conexão de um SMTP de produção. Não foram criadas notícias, sessões ou documentos fictícios no banco hospedado.

## Stack confirmada

Node.js 24, Next.js **16.3.4**, React/React DOM **19.2.8**, TypeScript **5.5.3**, Tailwind CSS **3.4.7**, Supabase JS **2.112.4**, Supabase SSR **0.10.2**, Postgres/Supabase e Vercel. Versões e dependências estão fixadas em `package.json` e `package-lock.json`.

## Desenvolvimento

```sh
npm ci
# Configure .env.local a partir de .env.example
npm run dev
```

Use um projeto Supabase de desenvolvimento com o esquema legado e as migrations em ordem. Os testes SQL usam PostgreSQL isolado em PGlite e **não precisam de credenciais ou acesso à produção**.

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

## Organização

| Caminho                | Responsabilidade                                             |
| ---------------------- | ------------------------------------------------------------ |
| `app/`                 | Páginas, metadados e handlers autenticados                   |
| `components/`          | Interações de leitura, conta, comentários e painel           |
| `lib/`                 | Domínio, consultas limitadas, autorização e validação        |
| `utils/supabase/`      | Clientes público, navegador, sessão e privilegiado separados |
| `data/dossiers.ts`     | Dossiês originais, mantidos estáticos                        |
| `supabase/migrations/` | Migrações adicionais ao banco existente                      |
| `tests/`               | PostgreSQL isolado, autorização, uploads, CSRF e ICS         |
| `docs/`                | Arquitetura, operação, implantação, verificação e backlog    |

## Documentação

- [Arquitetura e segurança](docs/ARCHITECTURE.md)
- [Guia editorial e moderação](docs/OPERATIONS.md)
- [Implantação, variáveis e recuperação](docs/DEPLOYMENT.md)
- [Evidências e limitações da verificação](docs/VERIFICATION.md)
- [Backlog P3](docs/BACKLOG.md)

Leia também as páginas públicas de [privacidade](https://sisnoticias.vercel.app/privacidade) e [convivência](https://sisnoticias.vercel.app/convivencia). As decisões institucionais sobre participação escolar precisam ser formalizadas pela organização.
