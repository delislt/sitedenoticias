export const FAVORITES_KEY = "sis-favorites-v1";
export type Favorite = {
  id: string;
  slug: string;
  title: string;
  category: string;
};
export function snapshot(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}
export function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("sis-preferences", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("sis-preferences", callback);
  };
}
export function save(key: string, value: string) {
  localStorage.setItem(key, value);
  window.dispatchEvent(new Event("sis-preferences"));
}
export function favorites(raw: string): Favorite[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v)
      ? v
          .filter(
            (x) =>
              x &&
              typeof x.id === "string" &&
              typeof x.slug === "string" &&
              typeof x.title === "string",
          )
          .slice(0, 500)
      : [];
  } catch {
    return [];
  }
}
