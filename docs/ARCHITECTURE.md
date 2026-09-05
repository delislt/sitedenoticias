# Arquitetura e segurança

## Evolução do projeto existente

O App Router e o Supabase continuam sendo a base. Server Components fazem consultas específicas; Client Components cuidam de menu, favoritos, comentários, conta e painel. Dossiês permanecem em `data/dossiers.ts`. O formato `content.paragraphs` continua compatível e é renderizado como texto React, sem HTML editorial arbitrário.

As listagens buscam 12 notícias ou 20 recursos por página. A abertura de uma notícia consulta diretamente o slug. Anterior/próximo usam data e UUID como desempate; relacionados são escolhidos entre até 12 candidatos do mesmo comitê, priorizando tags comuns e mostrando até três. A busca usa tsvector indexado, pesos por campo, configuração portuguesa e normalização de acentos. Dossiês são pesquisados localmente por serem poucos.

## Autorização em duas camadas

O servidor valida a conta com `auth.getUser()` e consulta permissões. O Postgres valida novamente identidade, email verificado, conta não anônima e presença da sessão em `auth.sessions`. Campos editáveis em `user_metadata` não concedem acesso.

| Papel | Permissões |
| --- | --- |
| Visitante | Conteúdo publicado |
| Leitor verificado | Próprio perfil mínimo, comentários, favoritos e sugestões privadas |
| Jornalista | Próprios rascunhos/revisões e upload validado |
| Editor | Revisão/publicação de matérias e recursos do SIS |
| Moderador | Filas e decisões de comentários; sem publicação editorial automática |
| Administrador | Configurações/funções e capacidades de operação |

As funções são cumulativas em `private.user_roles`. A administração não pode alterar os próprios privilégios. A migration preserva os três administradores legados auditados. `reader_profiles` contém apenas o nome de exibição; email não vai para a publicação.

Clientes não recebem grants de escrita nas tabelas. As mutações passam por RPCs autorizadas, com implementações de segurança no schema `private`, fora dos schemas expostos pela Data API. Os wrappers públicos são invokers; a implementação definer usa `search_path=''`, funções qualificadas e grants explícitos. Não expor `private` nas configurações da API.

Tabelas privadas têm RLS habilitada sem políticas de acesso direto, intencionalmente: somente funções com verificações próprias acessam esses dados. Os avisos informativos [RLS Enabled No Policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) descrevem esse bloqueio, não uma liberação de leitura.

## Mutações, limites e concorrência

`/api/actions` aceita uma allowlist de operações, JSON limitado, sessão válida e origem confiável. A origem precisa corresponder ao site; destinos de retorno ficam restritos a caminhos locais. Não há fetch de URLs fornecidas por usuários. Fontes editoriais só aceitam HTTPS.

O UUID da operação é serializado por advisory lock no Postgres, impedindo duplicação de retries em várias instâncias. Comentários mantêm o UUID ao repetir um envio sem alteração de texto. Quotas persistentes: cinco comentários por dez minutos, dez denúncias por hora, cinco sugestões por hora e quinze uploads por hora/conta. Chamadas diretas à RPC continuam sujeitas às verificações. Edições recebem a versão que a pessoa abriu; um conflito exige recarregar.

## Publicação e privacidade

`published_at` é a primeira publicação, distinta da criação do rascunho e da última atualização. Arquivamento remove o conteúdo das consultas públicas; publicação/correção/arquivamento invalidam as páginas. Slugs antigos apontam para o mesmo UUID e redirecionam permanentemente quando a matéria está pública.

A primeira versão usa leituras sem cache compartilhado, além da deduplicação por requisição do React. CSP com nonce exige renderização dinâmica. Há custo de HTML e latência em relação a páginas estáticas, registrado nas medições. Sessões, APIs e painel enviam `private, no-store`. O sitemap inclui apenas conteúdo publicado e percorre lotes de 500, com limite de 50.000 itens; se o arquivo crescer, dividir em índices de sitemap.

Comentários pendentes/rejeitados são visíveis ao autor e à moderação. Contadores e a lista pública contam só aprovados. Remoção apaga o corpo; respostas continuam vinculadas por UUID. Não há canais realtime para dados de moderação. A cobertura de sessões consulta novas entradas a cada 60 segundos quando visível, oferecendo atualização sem mover automaticamente a leitura.

## Arquivos

Novos arquivos ficam em `sis-images` ou `sis-documents`, privados, com limite de 4 MiB. JPEG/PNG/WebP são decodificados, limitados a 6.000 pixels por lado e 20 MP, sem animação, reorientados e regravados em WebP sem metadados. PDFs precisam ser não criptografados, até 200 páginas, sem scripts/anexos/ações ativas detectadas; as páginas são reconstruídas, removendo anotações e ações. PDFs com formulários ou links interativos devem ser exportados como versão estática antes do envio.

O upload requer jornalista/editor/admin, reserva a quota no banco e usa service role apenas depois da autorização e validação. Nomes aleatórios não sobrescrevem objetos. O banco mantém o vínculo de dono e uso; download consulta RLS antes de assinar uma URL válida por 60 segundos. Revogação não invalida instantaneamente uma URL já emitida: ela expira em até um minuto. O bucket público legado mantém os 13 objetos existentes, com novos limites de MIME/tamanho e sem escrita direta de clientes.

## Retenção e recuperação de dados pessoais

A conta exporta os próprios dados e permite apagar contribuições com frase de confirmação. Isso limpa texto/nome/autor dos comentários, perfil, favoritos, denúncias e sugestões próprias. A conta Auth e a autoria editorial não são apagadas por essa operação; exclusão integral exige atendimento institucional.

Operações/quota expiram na limpeza após 30 dias; denúncias resolvidas, sugestões encerradas e decisões de moderação após 180 dias. O cron já existente chama `sis_retention_cleanup`, exclusivo da service role. Histórico editorial é mantido; histórico de moderação não copia o corpo dos comentários. Conteúdo removido pode continuar nos backups do provedor durante a retenção contratada. A escola precisa formalizar os prazos e o canal de atendimento antes da abertura pública.

## Referências consultadas

- [RLS e políticas Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Upload de arquivos — OWASP](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [Filas e configuração de moderação — Coral](https://docs.coralproject.net/administration)
- [Indicadores de confiança — Trust Project](https://thetrustproject.org/trust-indicators/)
- [Preparação de delegados — NMUN](https://www.nmun.org/assets/documents/nmun-delegate-prep-guide.pdf)
- [Metadados de artigos — Google](https://developers.google.com/search/docs/appearance/structured-data/article)
- [WCAG — W3C](https://www.w3.org/WAI/standards-guidelines/wcag/)
- Documentação distribuída com Next.js 16.3.4 em `node_modules/next/dist/docs/`.

As referências orientam o produto; não implicam certificação WCAG, conformidade jurídica automática nem endosso institucional.
