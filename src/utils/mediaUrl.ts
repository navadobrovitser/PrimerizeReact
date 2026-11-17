
import { API_ORIGIN } from "../config/api";

const API = API_ORIGIN.replace(/\/+$/, "");

export type MediaKind = "image" | "video" | "none";

/**
 * מחזיר כתובת תקינה לתמונה או לסרטון.
 */
export function getMediaUrl(
  path?: string | null
): string {
  if (!path || !path.trim()) {
    return "";
  }

  const value = path.trim().replace(/\\/g, "/");

  // כתובת מלאה
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const apiUrl = new URL(API);

      // אם המדיה מפנה ל-localhost,
      // נשתמש בשרת שמוגדר בפרויקט
      const isLocalhost = [
        "localhost",
        "127.0.0.1",
      ].includes(url.hostname.toLowerCase());

      if (isLocalhost && ![
        "localhost",
        "127.0.0.1",
      ].includes(apiUrl.hostname.toLowerCase())) {
        return buildMediaUrl(
          url.pathname + url.search + url.hash
        );
      }

      return url.href;
    } catch {
      return "";
    }
  }

  // כתובת יחסית
  return buildMediaUrl(value);
}

/**
 * בניית כתובת מלאה למדיה.
 */
function buildMediaUrl(path: string): string {
  const clean = path.replace(/^\/+/, "");

  if (!clean) return "";

  // הנתיב כבר כולל Images
  if (/^Images\//i.test(clean)) {
    return `${API}/${clean}`;
  }

  // הנתיב כבר כולל uploads או wwwroot
  if (/^wwwroot\//i.test(clean)) {
    const withoutRoot = clean.replace(
      /^wwwroot\//i,
      ""
    );

    return `${API}/${withoutRoot}`;
  }

  if (/^uploads\//i.test(clean)) {
    return `${API}/${clean}`;
  }

  // נתיב שמתחיל בשם הקובץ בלבד
  return `${API}/Images/${clean}`;
}

/**
 * זיהוי סוג המדיה.
 */
export function detectMediaKind(
  url: string,
  contentType?: string | number
): MediaKind {
  if (!url) return "none";

  const clean = url
    .split(/[?#]/)[0]
    .toLowerCase();

  // תמונות
  if (/\.(jpg|jpeg|png|webp|gif|bmp|svg|avif)$/i.test(clean)) {
    return "image";
  }

  // סרטונים
  if (/\.(mp4|webm|mov|avi|m4v|ogg)$/i.test(clean)) {
    return "video";
  }

  // זיהוי לפי סוג התוכן
  const type = String(
    contentType ?? ""
  ).toLowerCase();

  if (
    type === "image" ||
    type.startsWith("image/") ||
    type === "2"
  ) {
    return "image";
  }

  if (
    type === "video" ||
    type.startsWith("video/") ||
    type === "3"
  ) {
    return "video";
  }

  return "none";
}
