'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded border border-zinc-700 px-4 py-2 text-xs uppercase tracking-widest text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
    >
      Sair
    </button>
  );
}
