
import { useEffect, useState } from "react";
import type { FormEvent, ChangeEvent } from "react";

import { useAppSelector } from "../store/hooks";
import "./CreatePostPage.css";

const API_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN ||
  "https://localhost:7227"
).replace(/\/+$/, "");

const POSTS_API = `${API_ORIGIN}/api/Posts`;
const CANDIDATE_API = `${API_ORIGIN}/api/Candidates/me`;

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 20 * 1024 * 1024;

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const VIDEO_EXTENSIONS = ["mp4", "webm", "mov"];

type MediaType = "Text" | "Image" | "Video";

interface Post {
  postId: number;
  candidateId: number;
  content: string;
  contentType?: string | number;
  mediaUrl?: string | null;
  createdAt?: string;
}

interface CandidateProfile {
  candidateId: number;
}

// =====================================
// קריאת שגיאות מהשרת
// =====================================

async function readError(response: Response): Promise<string> {
  const data = await response.json().catch(() => null);

  if (typeof data?.message === "string") {
    return data.message;
  }

  if (typeof data?.title === "string") {
    return data.title;
  }

  if (data?.errors && typeof data.errors === "object") {
    const messages = Object.values(data.errors)
      .flatMap((value) =>
        Array.isArray(value) ? value : []
      )
      .filter(
        (value): value is string =>
          typeof value === "string"
      );

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  if (response.status === 401) {
    return "פג תוקף ההתחברות. יש להתחבר מחדש.";
  }

  if (response.status === 403) {
    return "אין הרשאה לבצע פעולה זו.";
  }

  return `הבקשה נכשלה (${response.status})`;
}

// =====================================
// זיהוי סוג הקובץ
// =====================================

function getMediaType(file: File): MediaType | null {
  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase();

  if (!extension) return null;

  if (
    IMAGE_EXTENSIONS.includes(extension) &&
    file.type.startsWith("image/")
  ) {
    return "Image";
  }

  if (
    VIDEO_EXTENSIONS.includes(extension) &&
    (file.type.startsWith("video/") || file.type === "")
  ) {
    return "Video";
  }

  return null;
}

// =====================================
// בניית כתובת נכונה לתמונה או סרטון
// =====================================

function resolveMediaUrl(
  url?: string | null
): string | null {
  if (!url?.trim()) return null;

  const cleanUrl = url.trim();

  if (/^https?:\/\//i.test(cleanUrl)) {
    try {
      const parsed = new URL(cleanUrl);

      if (
        parsed.origin === API_ORIGIN &&
        /^\/[^/]+\.(jpg|jpeg|png|webp|mp4|webm|mov|avi|ogg)$/i.test(
          parsed.pathname
        )
      ) {
        return `${API_ORIGIN}/Images${parsed.pathname}${parsed.search}`;
      }

      return cleanUrl;
    } catch {
      return null;
    }
  }

  const cleanPath = cleanUrl.replace(/^\/+/, "");

  if (/^Images\//i.test(cleanPath)) {
    return `${API_ORIGIN}/${cleanPath}`;
  }

  return `${API_ORIGIN}/Images/${cleanPath}`;
}

// =====================================
// זיהוי תמונה או סרטון בפוסט
// =====================================

function isImagePost(post: Post): boolean {
  const type = String(
    post.contentType ?? ""
  ).toLowerCase();

  if (type === "image") return true;
  if (type === "video") return false;

  return /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(
    post.mediaUrl || ""
  );
}

function isVideoPost(post: Post): boolean {
  const type = String(
    post.contentType ?? ""
  ).toLowerCase();

  if (type === "video") return true;
  if (type === "image") return false;

  return /\.(mp4|webm|mov|avi|ogg)(\?.*)?$/i.test(
    post.mediaUrl || ""
  );
}

// =====================================
// העמוד
// =====================================

export default function CreatePostPage() {
  const token = useAppSelector(
    (state) => state.auth.token
  );

  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("Text");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fileKey, setFileKey] = useState(0);

  // =====================================
  // תצוגה מקדימה
  // =====================================

  useEffect(() => {
    if (!mediaFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(mediaFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [mediaFile]);

  // =====================================
  // טעינת פוסטים אישיים
  // =====================================

  const loadPosts = async (
    currentToken: string,
    signal?: AbortSignal
  ) => {
    const response = await fetch(
      `${POSTS_API}/my-posts`,
      {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
        signal,
      }
    );

    if (!response.ok) {
      throw new Error(await readError(response));
    }

    const result: Post[] = await response.json();

    if (!signal?.aborted) {
      setPosts(result);
    }
  };

  // =====================================
  // בדיקת הרשאת מועמד
  // =====================================

  useEffect(() => {
    const controller = new AbortController();

    setAuthorized(false);
    setChecking(true);
    setPosts([]);
    setError("");
    setSuccess("");

    if (!token) {
      setChecking(false);
      return () => controller.abort();
    }

    const run = async () => {
      try {
        const response = await fetch(CANDIDATE_API, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (response.status === 404) {
          setAuthorized(false);
          return;
        }

        if (!response.ok) {
          throw new Error(await readError(response));
        }

        const candidate: CandidateProfile =
          await response.json();

        if (controller.signal.aborted) return;

        if (!candidate || candidate.candidateId <= 0) {
          setAuthorized(false);
          return;
        }

        setAuthorized(true);
        await loadPosts(token, controller.signal);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "שגיאה בחיבור לשרת"
        );
      } finally {
        if (!controller.signal.aborted) {
          setChecking(false);
        }
      }
    };

    void run();

    return () => controller.abort();
  }, [token]);

  // =====================================
  // בחירת תמונה או סרטון
  // =====================================

  const chooseMedia = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setError("");
    setSuccess("");

    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setMediaFile(null);
      setMediaType("Text");
      return;
    }

    const detectedType = getMediaType(file);

    if (!detectedType) {
      setError(
        "ניתן להעלות תמונות JPG, PNG, WEBP או סרטונים MP4, WEBM, MOV."
      );

      setMediaFile(null);
      setMediaType("Text");
      event.target.value = "";
      return;
    }

    const maxSize =
      detectedType === "Image"
        ? MAX_IMAGE_SIZE
        : MAX_VIDEO_SIZE;

    if (file.size > maxSize) {
      setError(
        detectedType === "Image"
          ? "גודל התמונה חייב להיות עד 10MB."
          : "גודל הסרטון חייב להיות עד 20MB."
      );

      setMediaFile(null);
      setMediaType("Text");
      event.target.value = "";
      return;
    }

    setMediaFile(file);
    setMediaType(detectedType);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaType("Text");
    setFileKey((prev) => prev + 1);
    setError("");
  };

  // =====================================
  // פרסום פוסט
  // =====================================

  const submit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!token || !authorized || loading) return;

    const text = content.trim();

    if (!text || text.length > 4000) {
      setError("יש להזין תוכן עד 4000 תווים.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const form = new FormData();

      form.append("Content", text);
      form.append("ContentType", mediaType);

      if (mediaFile) {
        form.append("MediaFile", mediaFile);
      }

      const response = await fetch(POSTS_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setContent("");
      setMediaFile(null);
      setMediaType("Text");
      setFileKey((previous) => previous + 1);

      setSuccess("הפוסט פורסם בהצלחה!");

      try {
        await loadPosts(token);
      } catch (refreshError) {
        console.error(
          "Post published, but refresh failed:",
          refreshError
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "לא ניתן לפרסם את הפוסט"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // תצוגת העמוד
  // =====================================

  return (
    <main className="create-post-page" dir="rtl">
      <div className="create-post-container">

        <header className="create-post-hero">
          <span>תנופה | אזור המועמדים</span>

          <h1>הוספת פוסט</h1>

          <p>
            שתפו את החזון, הרעיונות והעדכונים שלכם
            עם חברי המפלגה.
          </p>
        </header>

        {!token ? (
          <div className="create-post-notice">
            יש להתחבר כדי לפרסם פוסטים.
          </div>
        ) : checking ? (
          <div className="create-post-notice">
            בודקים את סטטוס המועמדות...
          </div>
        ) : authorized ? (
          <form
            className="create-post-form"
            onSubmit={submit}
          >
            <h2>מה תרצו לשתף?</h2>

            <label htmlFor="post-content">
              תוכן הפוסט *
            </label>

            <textarea
              id="post-content"
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              maxLength={4000}
              rows={7}
              placeholder="כתבו כאן את הפוסט שלכם..."
              required
              disabled={loading}
            />

            <small>
              {content.length} / 4000 תווים
            </small>

            <label htmlFor="post-media">
              הוספת תמונה או סרטון (לא חובה)
            </label>

            <input
              key={fileKey}
              id="post-media"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.mov,image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
              onChange={chooseMedia}
              disabled={loading}
            />

            <small>
              תמונות: JPG, PNG, WEBP — עד 10MB
            </small>

            <small>
              סרטונים: MP4, WEBM, MOV — עד 20MB
            </small>

            {mediaFile && (
              <div
                className="post-media-preview"
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  border: "1px solid #dce7ed",
                  borderRadius: "12px",
                }}
              >
                <p>
                  <strong>הקובץ שנבחר:</strong>{" "}
                  {mediaFile.name}
                </p>

                {previewUrl && mediaType === "Image" && (
                  <img
                    src={previewUrl}
                    alt="תצוגה מקדימה של התמונה"
                    style={{
                      width: "100%",
                      maxHeight: "350px",
                      objectFit: "contain",
                      borderRadius: "10px",
                    }}
                  />
                )}

                {previewUrl && mediaType === "Video" && (
                  <video
                    src={previewUrl}
                    controls
                    preload="metadata"
                    playsInline
                    style={{
                      width: "100%",
                      maxHeight: "350px",
                      borderRadius: "10px",
                    }}
                  />
                )}

                <button
                  type="button"
                  onClick={removeMedia}
                  disabled={loading}
                  style={{ marginTop: "12px" }}
                >
                  הסרת הקובץ
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !content.trim()}
            >
              {loading
                ? "מפרסם..."
                : "פרסום הפוסט"}
            </button>
          </form>
        ) : !error ? (
          <div className="create-post-notice">
            רק מועמד רשום יכול להוסיף פוסטים.
          </div>
        ) : null}

        {error && (
          <p
            className="create-post-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            className="create-post-success"
            role="status"
          >
            {success}
          </p>
        )}

        {authorized && (
          <section className="my-posts-section">
            <h2>הפוסטים שלי</h2>

            {posts.length === 0 ? (
              <p>עדיין לא פרסמת פוסטים.</p>
            ) : (
              posts.map((post) => {
                const mediaUrl = resolveMediaUrl(
                  post.mediaUrl
                );

                return (
                  <article
                    className="my-post-card"
                    key={post.postId}
                  >
                    <p>{post.content}</p>

                    {mediaUrl && isImagePost(post) && (
                      <img
                        src={mediaUrl}
                        alt="תמונת הפוסט"
                        loading="lazy"
                        style={{
                          width: "100%",
                          maxHeight: "350px",
                          objectFit: "contain",
                          borderRadius: "10px",
                        }}
                      />
                    )}

                    {mediaUrl && isVideoPost(post) && (
                      <video
                        src={mediaUrl}
                        controls
                        preload="metadata"
                        playsInline
                        style={{
                          width: "100%",
                          maxHeight: "350px",
                          borderRadius: "10px",
                        }}
                      />
                    )}

                    {post.createdAt && (
                      <small>
                        {new Date(
                          post.createdAt
                        ).toLocaleDateString("he-IL")}
                      </small>
                    )}
                  </article>
                );
              })
            )}
          </section>
        )}
      </div>
    </main>
  );
}
