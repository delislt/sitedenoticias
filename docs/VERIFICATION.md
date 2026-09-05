# Verificação — 05/09/2026

## Ambiente e alcance

Repositório original `1f8cc3c`, Node 24, Next 16.3.4. Testes de banco executados em PostgreSQL real isolado (PGlite), com usuários, sessões e matérias fictícios identificados no código. Nenhum teste publicou notícias, comentários, agenda ou documentos no Supabase de produção.

O navegador foi usado no servidor de desenvolvimento, com leituras do Supabase real. Um componente de leitura recebeu conteúdo fictício numa rota temporária exclusivamente local para testar favoritos e compartilhamento; essa rota foi removida antes do commit. O teste de persistência dos favoritos usou o armazenamento real do navegador.

## Verificações automatizadas

- `npm run lint`: sem erros ou avisos.
- `npm run typecheck`: sem erros.
- `node --test tests/database.test.mjs`: 12 testes aprovados (suíte principal e 11 cenários).
- `tsx --test tests/validation.test.ts`: 4 testes aprovados.
- `npm audit`: zero vulnerabilidades conhecidas no relatório desta execução.
- Build de produção: aprovado antes da publicação; resultado da integração Vercel deve acompanhar a revisão final.

Os testes isolados cobrem: preservação das roles legadas, negação de escalada por metadata, grants de escrita, autorização de jornalista/editor/moderador, rascunhos privados, publicação, conflito de versão, busca com/sem acentos e paginação, comentários fechados, pendências privadas, idempotência, respostas de outro artigo/terceiro nível, edição para revisão, remoção do texto, quotas persistentes, aliases de slug, arquivamento, locais privados, documentos restritos, confirmação de resultados, exportação/remoção de dados e revogação de sessão.

Validadores cobrem: imagens reais regravadas, SVG/HTML/arquivos grandes/dimensões inválidas, PDF simples e PDF ativo, CSRF, corpos limitados, destinos de retorno, datas inválidas, leitura e exportação ICS com escape e conversão de Brasília para UTC.

## Navegador e HTTP

| Cenário | Evidência |
| --- | --- |
| Identidade visual | Inicial e busca inspecionadas em desktop escuro e celular claro; logotipo, tipografia e dourado preservados |
| Busca | “guerra” encontrou três dossiês reais; filtro CSNU reduziu para um, mantendo parâmetros na URL |
| Glossário | “mocao” encontrou “Moção” |
| Menu móvel | 390 × 844; Escape fechou e devolveu foco a “Menu”; sem rolagem horizontal na busca |
| Campo móvel | Corrigido para ocupar uma linha inteira e continuar utilizável junto aos serviços |
| Tema | Troca para claro persistiu após recarregar |
| Agenda/biblioteca | Páginas e filtros abriram; estado vazio explicitou falta de programação/documentos reais |
| Conta | Formulário de entrada disponível; novo cadastro explicitamente fechado |
| Favoritos | Salvar, recarregar e abrir Favoritos manteve o item local; remoção de teste confirmada |
| Leitura e compartilhamento | Texto aumentou para 1,4625 rem; copiar link retornou o endereço fornecido; WhatsApp incluiu contexto de simulação, sem enviar mensagem |
| Recurso inexistente | Matéria inexistente retornou HTTP 404 e a página “Página não encontrada” |
| Administração visitante | HTTP 307 para `/admin/login`; API administrativa retornou 401 |
| Upload visitante | POST da origem local retornou 401; origem externa foi recusada |
| Endpoints públicos | Inicial, agenda, biblioteca, arquivo, glossário, busca, sitemap e ICS retornaram 200 |
| CSP | Headers presentes e interfaces funcionais; sem violação de CSP observada nas verificações |
| Conteúdo de teste | Rota temporária removida e favorito local apagado; banco hospedado continuou sem publicações fictícias |

O modo de desenvolvimento registrou um aviso React sobre script em navegação; não foi tratado como evidência de falha de CSP. Tema e interações funcionaram. A checagem de produção é separada do build e do servidor de desenvolvimento.

## Banco hospedado

Duas migrations aplicadas pelo conector Supabase e tipos gerados a partir do schema hospedado. Verificação posterior confirmou três administradores e 13 objetos legados preservados, buckets novos privados e configurações de participação fechadas.

O advisor de performance apontou índices de chaves estrangeiras e chamadas de identidade por linha; a migration complementar corrigiu esses pontos. Restaram avisos informativos de índices ainda sem uso em tabelas novas/vazias.

O advisor de segurança manteve um aviso de **proteção contra senhas vazadas desligada** no Auth, que depende da configuração do provedor. [Orientação de correção](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). As sete tabelas privadas com RLS sem política têm acesso direto intencionalmente bloqueado; [explicação do advisor](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Desempenho reproduzível

`npm run measure` executa um aquecimento e cinco GETs sequenciais por rota, medindo recebimento de headers, HTML completo e bytes. JSON bruto em `evidence/before.json` e `evidence/after.json`. Mesmo computador e método; banco remoto vazio; medições realizadas em momentos diferentes, sujeitas a rede e variação do desenvolvimento.

| Rota | Mediana total antes | Mediana total depois | HTML antes/depois |
| --- | ---: | ---: | ---: |
| / | 271 ms | 669 ms | 15.486 / 19.716 bytes |
| /categoria/csnu | 265 ms | 304 ms | 18.125 / 20.405 bytes |
| /dossies | 45 ms | 51 ms | 31.922 / 34.616 bytes |

A amostra **não comprova ganho de velocidade**: o HTML aumentou com os controles e a renderização dinâmica/CSP, e a latência remota variou. Não é Lighthouse, teste de carga nem Core Web Vitals de produção. O ganho arquitetural verificável é limitar consultas e evitar carregar toda a coleção, ainda sem medição em uma base grande.

## Limitações reais antes de abrir leitores

1. Não havia sessão editorial de teste disponível no navegador. Os fluxos autenticados foram testados no Postgres isolado; login por email, envio SMTP, upload completo ao Storage, sincronização de favoritos e publicação/comentário/moderação com sessões reais **ainda exigem teste de ponta a ponta em desenvolvimento**.
2. O conector Vercel não forneceu a listagem das variáveis; o painel web pediu login. A service role não foi copiada para o checkout. A existência de `SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET` precisa ser confirmada no ambiente, embora já fossem usados pelo código anterior.
3. Cadastro do Supabase permanece fechado. SMTP, URLs de retorno, confirmação de email, responsáveis e canal institucional precisam ser conferidos antes da ativação.
4. A distinção de erro técnico existe no servidor e nos componentes; uma interrupção real do provedor não foi provocada. Rascunhos, publicação/arquivamento e privacidade foram verificados em consultas isoladas, sem criar conteúdo de teste em produção.
5. Não foi realizada auditoria completa WCAG com leitor de tela, avaliação jurídica, antivírus de arquivos ou restauração de backup do provedor.

Essas limitações não são substituídas por telas de demonstração ou pelo sucesso da compilação. Veja o [guia de implantação](DEPLOYMENT.md) para a abertura controlada e a [operação editorial](OPERATIONS.md) para uso diário.
