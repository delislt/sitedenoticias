import { AdminNewsManager } from '@/components/admin/AdminNewsManager';

export default function AdminPage() {
  return (
    <div className="container-premium space-y-6 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Painel Administrativo</p>
        <h1 className="font-display text-4xl">Gestão de notícias do SIS</h1>
        <p className="mt-2 text-zinc-400">Crie, edite e remova notícias. Neste momento, os dados são salvos localmente no navegador.</p>
      </div>
      <AdminNewsManager />
    </div>
  );
}
