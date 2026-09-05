# Implantação e recuperação

## Destino e estado verificado

- Repositório: `delislt/sitedenoticias`, branch `main`.
- Vercel: projeto `sitedenoticias`, domínio `sisnoticias.vercel.app`, Node 24.
- Supabase: `akkmhfdpqlikbgajwlle` (noticias), Postgres 17, região us-west-2.
- Base anterior: commit `1f8cc3c2ed17016381de3ea9332de8071564cc84`.
- Auditoria imediatamente anterior às migrations em 05/09/2026: **zero artigos, três contas verificadas no grupo administrativo legado e 13 imagens preservadas**. O inventário de schema/grants/policies, sem credenciais, está em `docs/evidence/schema-before.json`. Isso é evidência de estrutura, não um backup integral do provedor.

## Variáveis

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto existente |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave publicável, sujeita a grants/RLS |
| `NEXT_PUBLIC_SITE_URL` | Canonical/origem da produção; padrão `https://sisnoticias.vercel.app` |
| `SUPABASE_SERVICE_ROLE_KEY` | Somente servidor: arquivos validados e limpeza de retenção |
| `CRON_SECRET` | Protege `/api/ping`, usado pelo cron Vercel existente |

Nunca prefixe service role ou segredo do cron com `NEXT_PUBLIC_`. Não commitar `.env.local`, tokens ou dumps com dados pessoais. O checkout de desenvolvimento recebeu apenas configuração pública; nenhuma service role foi copiada para o navegador ou para o repositório.

## Migrations

Aplicadas no projeto hospedado, nesta ordem:

1. `20260905140355_sis_foundation.sql`
2. `20260905140644_sis_policy_indexes.sql`

Os nomes locais acompanham os timestamps efetivamente registrados pela ferramenta do Supabase. Elas são adicionais ao schema legado: não executar em banco vazio sem antes importar a estrutura anterior. `tests/bootstrap.sql` é somente um ambiente fictício de testes, não um bootstrap para produção.

O grupo legado é selecionado por contas verificadas criadas antes de 29/05/2026; a migration exige exatamente três e falha se houver divergência. Não usa IDs aleatórios fixos nem concede papel a cadastros posteriores. As roles ficam protegidas em `private.user_roles`.

Datas legadas `date` são convertidas para meia-noite em `America/Sao_Paulo`, preservando o dia originalmente registrado. Novos rascunhos têm publicação nula; publicar grava o instante da primeira publicação. Nenhum artigo existente precisou de conversão nesta aplicação porque a tabela estava vazia.

Não reaplicar migrations já registradas. Em futuras mudanças, gerar a migration com a CLI, testar em ambiente isolado, conferir o histórico remoto e aplicar uma migration nova. Tipos gerados do schema hospedado estão em `lib/database.types.ts`.

## Publicar o código

1. `npm ci`, lint, tipos, testes e build.
2. Conferir migrations no Supabase e variáveis no ambiente Vercel de produção.
3. Commit e push normais para `main`; a integração GitHub/Vercel cria o deployment.
4. Aguardar **Ready**, confirmar o domínio de produção e testar leitura pública, 404, redirecionamento administrativo, APIs sem login e ausência de erros de runtime.
5. Com uma conta editorial de teste em ambiente de desenvolvimento, concluir login, publicação, comentário, moderação e upload reais antes da abertura aos leitores. Nunca publicar notícias ou comentários fictícios em produção.

## Dependências de ativação

O Supabase Auth foi auditado com **disable_signup=true**, confirmação de email ativa e acesso anônimo desativado. Isso foi preservado. A interface de cadastro também começa fechada e recusa a abertura pelo painel enquanto Auth estiver bloqueado.

Antes de habilitar leitores, a administração precisa:

- Formalizar responsáveis, canal de privacidade/recursos e participação escolar.
- Configurar a entrega de emails (SMTP/domínio, remetente e limites) e confirmar entrega real.
- Conferir Site URL `https://sisnoticias.vercel.app` e URLs permitidas para `/auth/callback` e `/auth/confirm`, incluindo localhost apenas no projeto de desenvolvimento.
- Manter confirmação de email ligada e só então habilitar novos usuários no Auth e o formulário no painel.
- Rever o aviso de [proteção contra senhas vazadas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), que estava desligada. A disponibilidade depende da configuração/plano do Supabase.
- Confirmar service role e `CRON_SECRET` no ambiente Vercel. Sem a chave de servidor, upload e manutenção não operam; a leitura pública continua independente.

Nenhuma senha, conta escolar nova, SMTP, gasto ou upgrade foi criado automaticamente. A ferramenta conectada usada nesta entrega não expõe alteração da configuração Auth nem listagem de valores de ambiente Vercel.

## Retenção

O cron diário existente (`0 9 * * *`, UTC) permanece em `vercel.json`. A rota exige o Bearer `CRON_SECRET`, verifica o banco e, quando a service role está configurada, chama a limpeza.

Somente service role executa `sis_retention_cleanup`: remove operações/quota antigas após 30 dias; denúncias resolvidas, sugestões encerradas e decisões de moderação após 180 dias. Monitorar retornos 5xx. Definir os prazos institucionais e a política de backups antes de abrir cadastros.

## Recuperação

As migrations foram transacionais e preservaram os objetos legados. Não há remoção de artigos nem substituição de dossiês.

Para regressão de aplicação, preferir correção pequena em `main` e novo deployment. Se precisar reverter visualmente, usar commit de reversão preservando histórico, mantendo as correções de autorização e upload. **Não restaurar as policies antigas permissivas** nem o handler antigo de upload sem autorização.

Antes de qualquer recuperação de banco, suspender escritas e obter backup do estado atual pelo provedor/CLI autorizada. Após uso real, preservar também comentários, versões, funções e arquivos novos. Restaurar snapshot antigo sem reconciliar esses dados perderia alterações posteriores; não executar automaticamente. O inventário deste repositório não substitui um backup de Auth/Storage/Postgres, e não foi verificada uma restauração completa do provedor.

Se um administrador perder acesso, outro administrador deve rever suas funções no painel. Não editar `user_metadata` nem abrir grants gerais. Recuperação excepcional de roles exige operador autorizado do Supabase e registro da alteração.
