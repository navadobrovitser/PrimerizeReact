
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  ChangeEvent,
  FormEvent,
} from "react";

import { useAppSelector } from "../store/hooks";
import {
  getMediaUrl,
  detectMediaKind,
} from "../utils/mediaUrl";

import "./MyPostsManager.css";
import { API_ORIGIN } from "../config/api";

const API = API_ORIGIN;
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

const IMAGE_EXTENSIONS = [
  "jpg", "jpeg", "png", "webp",
];

const VIDEO_EXTENSIONS = [
  "mp4", "webm", "mov",
];

function getFileType(
  file: File
): PostType | null {
  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase();

  if (
    extension &&
    IMAGE_EXTENSIONS.includes(extension)
  ) {
    return "Image";
  }

  if (
    extension &&
    VIDEO_EXTENSIONS.includes(extension)
  ) {
    return "Video";
  }

  return null;
}

function normalizeType(
  value?: string | number
): PostType {
  const type = String(
    value ?? ""
  ).toLowerCase();

  if (
    type === "2" ||
    type === "image"
  ) {
    return "Image";
  }

  if (
    type === "3" ||
    type === "video"
  ) {
    return "Video";
  }

  return "Text";
}

async function getError(
  response: Response
): Promise<string> {
  const data = await response
    .json()
    .catch(() => null);

  if (
    typeof data?.message === "string"
  ) {
    return data.message;
  }

  if (data?.errors) {
    const messages = Object.values(
      data.errors
    )
      .flat()
      .filter(
        (item): item is string =>
          typeof item === "string"
      );

    if (messages.length) {
      return messages.join(" ");
    }
  }

  if (response.status === 401) {
    return "פג תוקף ההתחברות. יש להתחבר מחדש.";
  }

  if (response.status === 403) {
    return "אין הרשאה לבצע פעולה זו.";
  }

  if (response.status === 404) {
    return "הפוסט לא נמצא או שאינו שייך לך.";
  }

  return typeof data?.title === "string"
    ? data.title
    : `הפעולה נכשלה (${response.status})`;
}

export default function MyPostsManager() {
  const token = useAppSelector(
    (state) => state.auth.token
  );

  const [posts, setPosts] =
    useState<Post[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [busy, setBusy] =
    useState(false);

  const [
    editingPost,
    setEditingPost,
  ] = useState<Post | null>(null);

  const [content, setContent] =
    useState("");

  const [mediaFile, setMediaFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [fileKey, setFileKey] =
    useState(0);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    expandedPosts,
    setExpandedPosts,
  ] = useState<number[]>([]);

  const formRef =
    useRef<HTMLFormElement>(null);

  // =====================================
  // תצוגה מקדימה
  // =====================================

  useEffect(() => {
    if (!mediaFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(
      mediaFile
    );

    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [mediaFile]);

  // =====================================
  // טעינת הפוסטים שלי
  // =====================================

  const loadPosts = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) {
        setPosts([]);
        return;
      }

      const response = await fetch(
        `${POSTS_API}/my-posts`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
          signal,
        }
      );

      if (!response.ok) {
        throw new Error(
          await getError(response)
        );
      }

      const result: unknown =
        await response.json();

      if (!signal?.aborted) {
        setPosts(
          Array.isArray(result)
            ? result
            : []
        );
      }
    },
    [token]
  );

  useEffect(() => {
    const controller =
      new AbortController();

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

  // =====================================
  // הרחבת פוסט
  // =====================================

  function togglePost(postId: number) {
    setExpandedPosts((prev) =>
      prev.includes(postId)
        ? prev.filter(
            (id) => id !== postId
          )
        : [...prev, postId]
    );
  }

  // =====================================
  // איפוס טופס
  // =====================================

  function resetForm() {
    setEditingPost(null);
    setContent("");
    setMediaFile(null);
    setFileKey(
      (value) => value + 1
    );
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  function createNewPost() {
    resetForm();
    setError("");
    setSuccess("");
    scrollToForm();
  }

  function editPost(post: Post) {
    setEditingPost(post);
    setContent(post.content || "");
    setMediaFile(null);

    setFileKey(
      (value) => value + 1
    );

    setError("");
    setSuccess("");
    scrollToForm();
  }

  // =====================================
  // בחירת תמונה או סרטון
  // =====================================

  function chooseMedia(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0] || null;

    if (!file) {
      setMediaFile(null);
      setError("");
      return;
    }

    const type = getFileType(file);

    if (!type) {
      setError(
        "מותר להעלות תמונות JPG, PNG, WEBP או סרטונים MP4, WEBM, MOV."
      );

      setMediaFile(null);
      event.target.value = "";
      return;
    }

    const maxBytes =
      type === "Image"
        ? 5 * 1024 * 1024
        : 20 * 1024 * 1024;

    if (file.size > maxBytes) {
      setError(
        type === "Image"
          ? "תמונה עד 5MB בלבד."
          : "סרטון עד 20MB בלבד."
      );

      setMediaFile(null);
      event.target.value = "";
      return;
    }

    setError("");
    setMediaFile(file);
  }

  function removeMedia() {
    setMediaFile(null);
    setFileKey(
      (value) => value + 1
    );
  }

  // =====================================
  // פרסום או עריכת פוסט
  // =====================================

  async function savePost(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!token || busy) return;

    const trimmed = content.trim();

    if (
      !trimmed ||
      trimmed.length > 4000
    ) {
      setError(
        "יש להזין תוכן באורך 1 עד 4000 תווים."
      );
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const form = new FormData();

      form.append(
        "Content",
        trimmed
      );

      const contentType: PostType =
        mediaFile
          ? getFileType(mediaFile) ?? "Text"
          : editingPost
            ? normalizeType(
                editingPost.contentType
              )
            : "Text";

      form.append(
        "ContentType",
        contentType
      );

      if (mediaFile) {
        form.append(
          "MediaFile",
          mediaFile
        );
      }

      const url = editingPost
        ? `${POSTS_API}/${editingPost.postId}`
        : POSTS_API;

      const response = await fetch(
        url,
        {
          method: editingPost
            ? "PUT"
            : "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: form,
        }
      );

      if (!response.ok) {
        throw new Error(
          await getError(response)
        );
      }

      const message = editingPost
        ? "הפוסט עודכן בהצלחה!"
        : "הפוסט פורסם בהצלחה!";

      resetForm();
      setSuccess(message);

      try {
        await loadPosts();
      } catch {
        setError(
          "הפוסט נשמר, אך לא ניתן לרענן את הרשימה."
        );
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

  // =====================================
  // מחיקת פוסט
  // =====================================

  async function deletePost(
    post: Post
  ) {
    if (!token || busy) return;

    const confirmed =
      window.confirm(
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
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          await getError(response)
        );
      }

      if (
        editingPost?.postId ===
        post.postId
      ) {
        resetForm();
      }

      setPosts((current) =>
        current.filter(
          (item) =>
            item.postId !==
            post.postId
        )
      );

      setExpandedPosts((current) =>
        current.filter(
          (id) =>
            id !== post.postId
        )
      );

      setSuccess(
        "הפוסט נמחק בהצלחה."
      );

      try {
        await loadPosts();
      } catch {
        setError(
          "הפוסט נמחק, אך לא ניתן לרענן את הרשימה."
        );
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

  // =====================================
  // תצוגה
  // =====================================

  return (
    <section
      className="posts-manager"
      dir="rtl"
    >
      <div className="posts-manager-heading">
        <div>
          <span className="posts-manager-eyebrow">
            03 / ניהול תוכן
          </span>

          <h2>הפוסטים שלי</h2>

          <p>
            כאן אפשר לפרסם עדכונים,
            לערוך פוסטים קיימים ולנהל
            את התוכן שמוצג לחברי המפלגה.
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
        <div
          className="posts-manager-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="posts-manager-success"
          role="status"
        >
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
              {editingPost
                ? "עריכת פרסום"
                : "פרסום חדש"}
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
          onChange={(event) =>
            setContent(
              event.target.value
            )
          }
          maxLength={4000}
          rows={6}
          placeholder="כתבו כאן את הפוסט שלכם..."
          disabled={busy}
          required
        />

        <div className="posts-manager-counter">
          {content.length} / 4000 תווים
        </div>

        <label htmlFor="manager-post-media">
          {editingPost
            ? "החלפת תמונה או סרטון"
            : "הוספת תמונה או סרטון"}
          <span> (לא חובה)</span>
        </label>

        <input
          key={fileKey}
          id="manager-post-media"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.mov"
          onChange={chooseMedia}
          disabled={busy}
        />

        <p className="posts-manager-hint">
          תמונות JPG, PNG, WEBP עד 5MB;
          סרטונים MP4, WEBM, MOV עד 20MB
        </p>

        {mediaFile && (
          <div className="posts-manager-preview">
            <p className="posts-manager-file">
              הקובץ שנבחר:{" "}
              {mediaFile.name}
            </p>

            {previewUrl &&
              getFileType(mediaFile) ===
                "Image" && (
                <img
                  src={previewUrl}
                  alt="תצוגה מקדימה"
                  style={{
                    width: "100%",
                    maxHeight: 300,
                    objectFit: "contain",
                    borderRadius: 10,
                  }}
                />
              )}

            {previewUrl &&
              getFileType(mediaFile) ===
                "Video" && (
                <video
                  src={previewUrl}
                  controls
                  preload="metadata"
                  style={{
                    width: "100%",
                    maxHeight: 300,
                    borderRadius: 10,
                  }}
                />
              )}

            <button
              type="button"
              onClick={removeMedia}
              disabled={busy}
            >
              הסרת הקובץ
            </button>
          </div>
        )}

        {editingPost?.mediaUrl &&
          !mediaFile && (
            <p className="posts-manager-hint">
              אם לא תבחרו קובץ חדש,
              המדיה הקיימת תישמר.
            </p>
          )}

        <div className="posts-manager-form-actions">
          <button
            type="submit"
            className="posts-manager-submit"
            disabled={
              busy ||
              !content.trim()
            }
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
        <span>
          {posts.length} פוסטים
        </span>
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
            const url = getMediaUrl(
              post.mediaUrl
            );

            const kind = detectMediaKind(
              url,
              post.contentType
            );

            const type: PostType =
              kind === "image"
                ? "Image"
                : kind === "video"
                  ? "Video"
                  : "Text";

            const isExpanded =
              expandedPosts.includes(
                post.postId
              );

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
                      ).toLocaleDateString(
                        "he-IL"
                      )}
                    </time>
                  )}
                </div>

                <div className="posts-manager-text-wrapper">
                  <div
                    className={`posts-manager-post-text ${
                      isExpanded
                        ? "is-expanded"
                        : "is-collapsed"
                    }`}
                    id={`post-content-${post.postId}`}
                  >
                    {post.content}
                  </div>

                  {post.content.length > 180 && (
                    <button
                      type="button"
                      className="posts-manager-expand"
                      onClick={() =>
                        togglePost(
                          post.postId
                        )
                      }
                      aria-expanded={
                        isExpanded
                      }
                      aria-controls={`post-content-${post.postId}`}
                    >
                      {isExpanded
                        ? "הצג פחות"
                        : "הצג עוד"}

                      <span aria-hidden="true">
                        {isExpanded
                          ? "↑"
                          : "↓"}
                      </span>
                    </button>
                  )}
                </div>

                {url &&
                  type === "Image" && (
                    <img
                      className="posts-manager-media"
                      src={url}
                      alt="תמונה מצורפת לפוסט"
                    />
                  )}

                {url &&
                  type === "Video" && (
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
                      onClick={() =>
                        editPost(post)
                      }
                      disabled={busy}
                    >
                      עריכה
                    </button>

                    <button
                      type="button"
                      className="posts-manager-delete"
                      onClick={() =>
                        void deletePost(
                          post
                        )
                      }
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
