# Guia de operação

## Antes de abrir a participação

1. Um administrador existente entra em **Equipe** e confere **Configurações e funções**.
2. A escola define responsáveis pela moderação, períodos de acompanhamento, canal de atendimento e recursos, regras para participação escolar e retenção. Atualiza os textos de privacidade/convivência com o canal institucional.
3. Confere Supabase Auth: novos usuários, confirmação de email, URLs de retorno e entrega de emails. A implantação preserva o cadastro externo fechado; não basta marcar a opção na interface se Auth continuar bloqueado.
4. Atribui funções a outras contas usando o UUID informado em **Sua conta**. Nunca compartilhar senhas. Administradores não podem alterar os próprios privilégios.
5. Em **Participação dos leitores**, confirma equipe acompanhando filas, mantém revisão prévia e abre comentários/cadastro conforme a decisão da organização.

Fechar comentários globalmente ou numa matéria impede novas publicações e novas aprovações. Os comentários já aprovados permanecem legíveis. Ausência de moderador/admin cadastrado também impede novos comentários.

## Publicar uma matéria

1. Em **Matérias**, escolha **Nova matéria**, edição e comitê. Identifique o tipo: simulação, contexto, opinião ou comunicado.
2. Preencha título, resumo, autoria, parágrafos, tags, fontes e créditos. Para imagem nova, use o envio do painel (JPEG/PNG/WebP até 4 MiB). Capas têm recorte uniforme no card; a imagem interna mantém proporção natural.
3. Salve como **Rascunho**. Confira na **Prévia protegida**. Jornalistas podem editar apenas seus rascunhos/revisões.
4. Envie **Em revisão**. Editor revisa fontes, rótulo da simulação, clareza e dados pessoais; então publica.
5. Para corrigir, edite pelo mesmo UUID e registre uma nota pública quando pertinente. O histórico preserva as versões. A primeira data de publicação permanece; atualização é separada.
6. Para retirar da circulação, use **Arquivado**. Se mudar o slug, o endereço antigo continua redirecionando enquanto a matéria estiver publicada.

Se aparecer conflito de versão, recarregue o registro e reaplique sua mudança; não force sobrescrita. O navegador avisa ao sair com alterações não salvas. A prévia precisa de login e função editorial.

## Moderar

- **Aguardando moderação:** ler o comentário e a matéria de contexto. Aprovar ou rejeitar com motivo.
- **Denunciados:** conferir os motivos privados, remover texto quando necessário ou encerrar a denúncia. Repetições da mesma pessoa não multiplicam denúncias.
- **Suspender autor por 7 dias:** exige motivo e impede comentários/edições durante a suspensão. A função não atribui poderes editoriais ao moderador.
- **Histórico:** registra conta responsável, ação, referência, data e motivo. O texto de outra pessoa não é editado silenciosamente.
- Edição do autor é permitida por 15 minutos e volta para revisão, mesmo quando a pré-moderação geral estiver desligada.
- Remoção pelo autor limpa o texto e preserva o vínculo das respostas. As listas públicas não revelam pendências ou denúncias.

Os limites por conta são aplicados no banco. Tentativas repetidas não podem ser liberadas apenas recarregando a página ou mudando de instância da Vercel.

## Agenda, biblioteca e cobertura

Em **Agenda e biblioteca**, selecione a área e crie o registro real da organização. Não há programação pré-preenchida.

- **Edição:** crie uma nova edição, sem substituir a anterior. Os dossiês existentes pertencem ao SIS 2026.
- **Sessão:** comitê, edição, início/fim em Brasília, status, resumo editorial e local. O local só é exibido quando marcado público.
- **Cobertura:** selecione sessão, autoria, atualização e eventual matéria completa. Resultados exigem confirmação explícita da organização. Corrija com nota, preservando histórico.
- **Documento:** envie PDF estático validado, informe tipo/versão/responsável e público ou restrito. Resoluções publicadas exigem confirmação. PDF restrito exige conta verificada e link temporário.
- **Aviso:** publique apenas comunicado definido pela organização.

Após criar edição ou sessão, recarregue o painel para atualizar os seletores. A agenda exporta até 300 sessões da consulta; para agendas maiores, filtre por edição/comitê/dia. Os horários do ICS são convertidos para UTC, preservando o instante de Brasília.

## Sugestões e dados pessoais

Sugestões de correção vão para a revisão editorial, em caráter privado. Corrija a matéria antes de marcar a sugestão como aceita; registre motivo para rejeição.

**Sua conta** permite nome de exibição, exportação dos próprios dados e remoção de contribuições com confirmação explícita. Isso não exclui a conta de autenticação nem apaga a autoria do arquivo editorial. A exclusão integral e os recursos de moderação dependem do canal institucional definido pela escola.
