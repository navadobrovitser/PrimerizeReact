
const API_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN ||
  "https://localhost:7227"
).replace(/\/+$/, "");

export function getMediaUrl(
  path?: string | null
): string {
  if (!path?.trim()) return "";

  const value = path.trim();

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);

      if (
        url.origin === API_ORIGIN &&
        /^\/[^/]+\.(jpg|jpeg|png|webp|mp4|webm|mov|avi)$/i.test(
          url.pathname
        )
      ) {
        return (
          `${API_ORIGIN}/Images${url.pathname}` +
          url.search +
          url.hash
        );
      }

      return value;
    } catch {
      return "";
    }
  }

  const clean = value.replace(/^\/+/, "");

  if (/^Images\//i.test(clean)) {
    return `${API_ORIGIN}/${clean}`;
  }

  return `${API_ORIGIN}/Images/${clean}`;
}

export type MediaKind =
  | "image"
  | "video"
  | "none";

export function detectMediaKind(
  url: string,
  contentType?: string | number
): MediaKind {
  if (!url) return "none";

  const clean = url
    .split(/[?#]/)[0]
    .toLowerCase();

  if (/\.(jpg|jpeg|png|webp)$/.test(clean)) {
    return "image";
  }

  if (/\.(mp4|webm|mov|avi)$/.test(clean)) {
    return "video";
  }

  const type = String(
    contentType ?? ""
  ).toLowerCase();

  if (type === "image" || type === "2") {
    return "image";
  }

  if (type === "video" || type === "3") {
    return "video";
  }

  return "none";
}
