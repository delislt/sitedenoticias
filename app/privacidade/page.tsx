export const metadata = { title: "Privacidade | Jornal SIS" };
export default function Page() {
  return (
    <article className="container-premium mx-auto max-w-3xl space-y-6 py-12">
      <h1 className="font-display text-4xl">Privacidade no Jornal SIS</h1>
      <p>
        Este portal é um projeto do Simulado Interno Sidarta. A participação foi
        desenhada para coletar apenas o necessário. Esta página descreve a
        implementação e as decisões que a organização ainda precisa formalizar.
      </p>
      <h2 className="font-display text-2xl">Conta e informações públicas</h2>
      <p>
        O email é usado pelo Supabase para autenticar e verificar a conta. Seu
        email não aparece nos comentários. Você escolhe um nome de exibição; um
        apelido é suficiente. Não pedimos telefone, data de nascimento, nome
        completo público nem delegação.
      </p>
      <p>
        Comentários aprovados mostram nome de exibição, texto, data e eventual
        indicação de edição. O selo de equipe depende de funções protegidas. Não
        há mensagens privadas, ranking de estudantes ou associação automática
        entre contas, fotos e delegações.
      </p>
      <h2 className="font-display text-2xl">Dados no dispositivo</h2>
      <p>
        O tema e os favoritos locais ficam no armazenamento do navegador.
        Favoritos não exigem conta e não são enviados automaticamente ao
        servidor. A sincronização só ocorre ao acionar essa opção. A limpeza do
        navegador remove os dados locais.
      </p>
      <h2 className="font-display text-2xl">Acesso e retenção</h2>
      <p>
        Comentários pendentes ficam acessíveis ao autor e à moderação. Denúncias
        e decisões são acessíveis à moderação; sugestões de correção, à equipe
        editorial. O histórico registra quem realizou uma ação e quando. O texto
        removido de um comentário deixa de ser exibido e é apagado do registro
        do comentário; seus vínculos podem permanecer para manter a estrutura
        das respostas.
      </p>
      <p>
        Registros operacionais de tentativas e duplicações devem ser limpos após
        30 dias. Denúncias resolvidas, sugestões encerradas e decisões de
        moderação têm retenção operacional proposta de 180 dias. A rotina de
        limpeza é documentada para a administração. Backups do provedor seguem a
        configuração contratada, que precisa ser verificada pela organização.
      </p>
      <p>
        Contas podem baixar seus dados ou apagar suas contribuições pela página
        “Sua conta”. Para exclusão integral da conta, contato institucional,
        recursos de moderação e questões sobre participação de menores, a escola
        precisa designar um responsável e formalizar o canal antes de abrir
        novos cadastros. Não há declaração automática de conformidade jurídica.
      </p>
      <h2 className="font-display text-2xl">Serviços usados</h2>
      <p>
        Vercel hospeda o portal; Supabase mantém autenticação, banco e arquivos.
        O site mantém as fontes visuais existentes, incluindo fontes do Google.
        Links externos podem ter políticas próprias. Não foi acrescentado
        rastreamento comportamental, publicidade personalizada ou serviços
        externos de comentários.
      </p>
    </article>
  );
}
