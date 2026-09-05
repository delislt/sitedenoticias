"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container-premium space-y-5 py-16" role="alert">
      <p className="text-gold">Serviço indisponível</p>
      <h1 className="font-display text-4xl">
        Não foi possível carregar esta página.
      </h1>
      <p>Houve uma falha técnica. Suas informações não foram apagadas.</p>
      <button className="sis-button" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
