import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container-premium space-y-5 py-16">
      <p className="text-gold">404</p>
      <h1 className="font-display text-4xl">Página não encontrada</h1>
      <p>Este endereço não está disponível.</p>
      <Link className="sis-button inline-block" href="/">
        Voltar ao início
      </Link>
    </div>
  );
}
