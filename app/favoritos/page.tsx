import { Favorites } from "@/components/Favorites";
export const metadata = {
  title: "Favoritos | Jornal SIS",
  robots: { index: false, follow: true },
};
export default function FavoritesPage() {
  return (
    <div className="container-premium space-y-7 py-10">
      <h1 className="font-display text-4xl">Sua lista de leitura</h1>
      <Favorites />
    </div>
  );
}
