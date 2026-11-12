
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useAppSelector } from "../store/hooks";
import "./MyPostsManager.css";

const API = (
  import.meta.env.VITE_API_ORIGIN ||
  "https://localhost:7227"
).replace(/\/$/, "");

const POSTS_API = `${API}/api/Posts`;

interface Post {
  postId: number;
  candidateId: number;
  content: string;
  contentType?: string | number;
  mediaUrl?: string | null;
  createdAt?: string;
  likesCount?: number;
  commentsCount?: number;
  postLikes?: unknown[];
  comments?: unknown[];
}

type PostType = "Text" | "Image" | "Video";

function normalizeType(value?: string | number): PostType {
  if (value === 2 || value === "2" || value === "Image") {
    return "Image";
  }

  if (value === 3 || value === "3" || value === "Video") {
    return "Video";
  }

  return "Text";
}

function mediaUrl(path?: string | null): string {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) return path;

  return `${API}/${path.replace(/^\/+/, "")}`;
}

async function getError(response: Response): Promise<string> {
  const data = await response.json().catch(() => null);

  if (typeof data?.message === "string") return data.message;
  if (typeof data?.title === "string") return data.title;

  if (response.status === 401) {
    return "פג תוקף ההתחברות. יש להתחבר מחדש.";
  }

  if (response.status === 403) {
    return "אין הרשאה לבצע פעולה זו.";
  }

  if (response.status === 404) {
    return "הפוסט לא נמצא או שאין לך הרשאה לערוך אותו.";
  }

  return `הפעולה נכשלה (${response.status})`;
}

export default function MyPostsManager() {
  const token = useAppSelector((state) => state.auth.token);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [content, setContent] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const formRef = useRef<HTMLFormElement>(null);

  const loadPosts = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) {
        setPosts([]);
        return;
      }

      const response = await fetch(`${POSTS_API}/my-posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal,
      });

      if (!response.ok) {
        throw new Error(await getError(response));
      }

      const result: unknown = await response.json();

      if (!signal?.aborted) {
        setPosts(Array.isArray(result) ? result : []);
      }
    },
    [token]
  );

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");

    void loadPosts(controller.signal)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "לא ניתן לטעון את הפוסטים"
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [loadPosts]);

  function resetForm() {
    setEditingPost(null);
    setContent("");
    setVideo(null);
    setFileKey((value) => value + 1);
  }

  function createNewPost() {
    resetForm();
    setError("");
    setSuccess("");

    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  function editPost(post: Post) {
    setEditingPost(post);
    setContent(post.content || "");
    setVideo(null);
    setFileKey((value) => value + 1);
    setError("");
    setSuccess("");

    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  function chooseVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (
      file &&
      (!/\.(mp4|avi|mov)$/i.test(file.name) ||
        file.size > 20 * 1024 * 1024)
    ) {
      setError("אפשר להעלות סרטון MP4, AVI או MOV עד 20MB.");
      setVideo(null);
      event.target.value = "";
      return;
    }

    setError("");
    setVideo(file);
  }

  async function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || busy) return;

    const trimmed = content.trim();

    if (!trimmed || trimmed.length > 4000) {
      setError("יש להזין תוכן באורך 1 עד 4000 תווים.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const form = new FormData();

      form.append("Content", trimmed);

      const contentType: PostType = video
        ? "Video"
        : editingPost
          ? normalizeType(editingPost.contentType)
          : "Text";

      form.append("ContentType", contentType);

      if (video) {
        form.append("MediaFile", video);
      }

      const url = editingPost
        ? `${POSTS_API}/${editingPost.postId}`
        : POSTS_API;

      const response = await fetch(url, {
        method: editingPost ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      if (!response.ok) {
        throw new Error(await getError(response));
      }

      const message = editingPost
        ? "הפוסט עודכן בהצלחה!"
        : "הפוסט פורסם בהצלחה!";

      resetForm();
      setSuccess(message);

      try {
        await loadPosts();
      } catch {
        setError("הפוסט נשמר, אך לא ניתן לרענן את הרשימה.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בשמירת הפוסט"
      );
    } finally {
      setBusy(false);
    }
  }

  async function deletePost(post: Post) {
    if (!token || busy) return;

    const confirmed = window.confirm(
      "האם למחוק את הפוסט לצמיתות? גם הלייקים והתגובות המשויכים אליו יימחקו."
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${POSTS_API}/${post.postId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(await getError(response));
      }

      if (editingPost?.postId === post.postId) {
        resetForm();
      }

      setPosts((current) =>
        current.filter((item) => item.postId !== post.postId)
      );

      setSuccess("הפוסט נמחק בהצלחה.");

      try {
        await loadPosts();
      } catch {
        setError("הפוסט נמחק, אך לא ניתן לרענן את הרשימה.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "לא ניתן למחוק את הפוסט"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="posts-manager" dir="rtl">
      <div className="posts-manager-heading">
        <div>
          <span className="posts-manager-eyebrow">
            03 / ניהול תוכן
          </span>

          <h2>הפוסטים שלי</h2>

          <p>
            כאן אפשר לפרסם עדכונים, לערוך פוסטים קיימים
            ולנהל את התוכן שמוצג לחברי המפלגה.
          </p>
        </div>

        <button
          type="button"
          className="posts-manager-new"
          onClick={createNewPost}
          disabled={busy}
        >
          + פוסט חדש
        </button>
      </div>

      {error && (
        <div className="posts-manager-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="posts-manager-success" role="status">
          {success}
        </div>
      )}

      <form
        ref={formRef}
        className="posts-manager-form"
        onSubmit={savePost}
      >
        <div className="posts-manager-form-heading">
          <div>
            <span>
              {editingPost ? "עריכת פרסום" : "פרסום חדש"}
            </span>

            <h3>
              {editingPost
                ? "עריכת הפוסט"
                : "מה תרצו לשתף?"}
            </h3>
          </div>

          {editingPost && (
            <button
              type="button"
              className="posts-manager-cancel"
              onClick={resetForm}
              disabled={busy}
            >
              ביטול עריכה
            </button>
          )}
        </div>

        <label htmlFor="manager-post-content">
          תוכן הפוסט
        </label>

        <textarea
          id="manager-post-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={4000}
          rows={6}
          placeholder="כתבו כאן את הפוסט שלכם..."
          disabled={busy}
          required
        />

        <div className="posts-manager-counter">
          {content.length} / 4000 תווים
        </div>

        <label htmlFor="manager-post-video">
          {editingPost ? "החלפת סרטון" : "הוספת סרטון"}
          <span> (לא חובה)</span>
        </label>

        <input
          key={fileKey}
          id="manager-post-video"
          type="file"
          accept=".mp4,.avi,.mov"
          onChange={chooseVideo}
          disabled={busy}
        />

        <p className="posts-manager-hint">
          MP4, AVI או MOV — עד 20MB
        </p>

        {video && (
          <p className="posts-manager-file">
            הסרטון שנבחר: {video.name}
          </p>
        )}

        {editingPost?.mediaUrl && !video && (
          <p className="posts-manager-hint">
            אם לא תבחרו סרטון חדש, המדיה הקיימת תישמר.
          </p>
        )}

        <div className="posts-manager-form-actions">
          <button
            type="submit"
            className="posts-manager-submit"
            disabled={busy || !content.trim()}
          >
            {busy
              ? "שומר..."
              : editingPost
                ? "שמירת השינויים"
                : "פרסום הפוסט"}
          </button>
        </div>
      </form>

      <div className="posts-manager-list-heading">
        <h3>הפרסומים שלי</h3>
        <span>{posts.length} פוסטים</span>
      </div>

      {loading ? (
        <div className="posts-manager-empty">
          טוען את הפוסטים...
        </div>
      ) : posts.length === 0 ? (
        <div className="posts-manager-empty">
          עדיין לא פורסמו פוסטים.
        </div>
      ) : (
        <div className="posts-manager-list">
          {posts.map((post) => {
            const type = normalizeType(post.contentType);
            const url = mediaUrl(post.mediaUrl);

            return (
              <article
                className="posts-manager-card"
                key={post.postId}
              >
                <div className="posts-manager-card-top">
                  <span className="posts-manager-type">
                    {type === "Video"
                      ? "פוסט עם סרטון"
                      : type === "Image"
                        ? "פוסט עם תמונה"
                        : "פוסט טקסט"}
                  </span>

                  {post.createdAt && (
                    <time>
                      {new Date(
                        post.createdAt
                      ).toLocaleDateString("he-IL")}
                    </time>
                  )}
                </div>

                <p className="posts-manager-content">
                  {post.content}
                </p>

                {url && type === "Image" && (
                  <img
                    className="posts-manager-media"
                    src={url}
                    alt="תמונה מצורפת לפוסט"
                  />
                )}

                {url && type === "Video" && (
                  <video
                    className="posts-manager-media"
                    src={url}
                    controls
                    preload="metadata"
                  />
                )}

                <div className="posts-manager-card-footer">
                  <div className="posts-manager-stats">
                    <span>
                      לייקים:{" "}
                      {post.likesCount ??
                        post.postLikes?.length ??
                        "—"}
                    </span>

                    <span>
                      תגובות:{" "}
                      {post.commentsCount ??
                        post.comments?.length ??
                        "—"}
                    </span>
                  </div>

                  <div className="posts-manager-card-actions">
                    <button
                      type="button"
                      className="posts-manager-edit"
                      onClick={() => editPost(post)}
                      disabled={busy}
                    >
                      עריכה
                    </button>

                    <button
                      type="button"
                      className="posts-manager-delete"
                      onClick={() => void deletePost(post)}
                      disabled={busy}
                    >
                      מחיקה
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
