import { requireStaffPage } from "@/lib/auth";
import { getSettings, unwrap } from "@/lib/resources";
import { Settings } from "@/components/admin/Settings";
import { roleLabels, formatDate } from "@/lib/domain";
export default async function Page() {
  const { db } = await requireStaffPage("admin");
  const [settings, rolesResult] = await Promise.all([
    getSettings(),
    db.rpc("sis_dashboard", { kind: "roles", pg: 1, query: "" }),
  ]);
  const roles = unwrap(rolesResult) as {
    user_id: string;
    role: keyof typeof roleLabels;
    display_name: string | null;
    granted_at: string;
  }[];
  return (
    <div className="container-premium space-y-6 py-10">
      <h1 className="font-display text-4xl">Configurações e funções</h1>
      <Settings initial={settings} />
      <h2 className="font-display text-2xl">Funções concedidas</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="p-3">Conta</th>
              <th>Função</th>
              <th>Concedida em</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.user_id + r.role} className="border-t border-zinc-800">
                <td className="p-3">
                  {r.display_name || "Conta da equipe"}
                  <br />
                  {r.user_id}
                </td>
                <td>{roleLabels[r.role]}</td>
                <td>{formatDate(r.granted_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
