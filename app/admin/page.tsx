import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { AdminNewsManager } from '@/components/admin/AdminNewsManager';
import { LogoutButton } from '@/components/admin/LogoutButton';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  return (
    <div className="container-premium space-y-6 py-10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Painel Administrativo</p>
          <h1 className="font-display text-4xl">Gestão de notícias do SIS</h1>
          <p className="mt-2 text-zinc-400">Logado como <span className="text-zinc-200">{user.email}</span></p>
        </div>
        <LogoutButton />
      </div>
      <AdminNewsManager />
    </div>
  );
}
