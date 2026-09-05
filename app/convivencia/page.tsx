import Link from "next/link";
export const metadata = { title: "Convivência e moderação | Jornal SIS" };
export default function Page() {
  return (
    <article className="container-premium mx-auto max-w-3xl space-y-6 py-12">
      <h1 className="font-display text-4xl">Convivência no Jornal SIS</h1>
      <p>
        O espaço de comentários existe para trocar ideias sobre o Simulado
        Interno Sidarta. Critique argumentos com respeito e deixe claro quando
        estiver falando de acontecimentos da simulação.
      </p>
      <h2 className="font-display text-2xl">Antes de enviar</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Não publique ofensas, ameaças, discriminação ou ataques pessoais.
        </li>
        <li>
          Não compartilhe emails, telefones, documentos, informações escolares
          detalhadas ou outros dados pessoais de colegas.
        </li>
        <li>
          Não se passe por outra pessoa nem use o espaço para propaganda ou
          spam.
        </li>
        <li>
          Contribua com o tema e indique fontes quando fizer afirmações
          factuais.
        </li>
      </ul>
      <h2 className="font-display text-2xl">Como funciona a revisão</h2>
      <p>
        A configuração inicial exige moderação antes da publicação. Enquanto
        aguarda, o comentário só aparece para seu autor e para a equipe
        responsável. O administrador pode alterar essa operação de forma
        explícita. Você pode editar o texto por 15 minutos; a edição volta para
        revisão. Pode remover seu texto a qualquer momento.
      </p>
      <p>
        A equipe pode aprovar, rejeitar, remover e suspender a participação por
        sete dias, registrando responsável, horário e motivo. Moderadores não
        reescrevem comentários de outras pessoas. Respostas podem continuar
        existindo após a remoção do comentário original, sem exibir o texto
        removido.
      </p>
      <h2 className="font-display text-2xl">Denúncias e correções</h2>
      <p>
        Use “Denunciar” para enviar um motivo privado à moderação. Para apontar
        um problema na reportagem, use “Sugerir correção” ao final da matéria.
        As sugestões chegam à equipe editorial, que pode registrar uma nota
        pública de correção.
      </p>
      <p>
        A organização ainda deve definir o responsável institucional e o
        procedimento de recurso antes de abrir a participação aos leitores. A
        operação permanece fechada até a confirmação de uma equipe de moderação.
      </p>
      <Link className="text-gold underline" href="/privacidade">
        Informações sobre privacidade
      </Link>
    </article>
  );
}
