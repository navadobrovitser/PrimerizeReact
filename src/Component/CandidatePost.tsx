
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Post } from "../store/posts/postsThunks";
import { useAppSelector } from "../store/hooks";
import PostLikes from "./PostLikes";
import "./CandidatePost.css";

const API_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN ||
  (import.meta.env.DEV
    ? "https://localhost:7227"
    : "https://primerize.runasp.net")
).replace(/\/+$/, "");

const PREVIEW_LENGTH = 170;

interface CandidatePostProps {
  post: Post;
  initiallyExpanded?: boolean;
}

interface PostComment {
  commentId: number;
  postId: number;
  userId: number;
  userName?: string;
  content: string;
  createdAt?: string;
}

type MediaKind = "image" | "video" | "none";

// =====================================
// זיהוי המשתמש המחובר לפי JWT
// =====================================

function getCurrentUserId(
  token: string | null | undefined
): number | null {
  if (!token) return null;

  try {
    const part = token.split(".")[1];

    if (!part) return null;

    const normalized = part
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = normalized.padEnd(
      Math.ceil(normalized.length / 4) * 4,
      "="
    );

    const payload = JSON.parse(atob(padded));

    const rawId =
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ] ??
      payload.nameid ??
      payload.sub ??
      payload.userId ??
      payload.UserId;

    const id = Number(rawId);

    return Number.isInteger(id) && id > 0
      ? id
      : null;
  } catch {
    return null;
  }
}

// =====================================
// כתובת מדיה
// =====================================

function getMediaUrl(
  value?: string | null
): string {
  if (!value?.trim()) return "";

  const path = value.trim();

  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path);

      const isFileAtRoot =
        /^\/[^/]+\.(jpg|jpeg|png|webp|mp4|webm|mov)$/i.test(
          url.pathname
        );

      if (
        url.origin === API_ORIGIN &&
        isFileAtRoot
      ) {
        return (
          `${API_ORIGIN}/Images${url.pathname}` +
          url.search
        );
      }

      return path;
    } catch {
      return "";
    }
  }

  const cleanPath = path.replace(/^\/+/, "");

  if (/^Images\//i.test(cleanPath)) {
    return `${API_ORIGIN}/${cleanPath}`;
  }

  return `${API_ORIGIN}/Images/${cleanPath}`;
}

// =====================================
// זיהוי סוג מדיה
// =====================================

function detectMediaKind(
  url: string,
  contentType?: string | number
): MediaKind {
  if (!url) return "none";

  const cleanUrl = url
    .split("?")[0]
    .split("#")[0]
    .toLowerCase();

  if (/\.(jpg|jpeg|png|webp)$/.test(cleanUrl)) {
    return "image";
  }

  if (/\.(mp4|webm|mov|avi)$/.test(cleanUrl)) {
    return "video";
  }

  const type = String(
    contentType ?? ""
  ).toLowerCase();

  if (type === "image") return "image";
  if (type === "video") return "video";

  return "none";
}

// =====================================
// תאריך
// =====================================

function formatDate(
  value?: string
): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =====================================
// קריאת הודעת שגיאה מהשרת
// =====================================

async function getApiError(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data = await response.json();

    return (
      data.message ||
      data.detail ||
      data.title ||
      fallback
    );
  } catch {
    return fallback;
  }
}

// =====================================
// COMPONENT
// =====================================

export default function CandidatePost({
  post,
  initiallyExpanded = false,
}: CandidatePostProps) {
  const token = useAppSelector(
    (state) => state.auth.token
  );

  const currentUserId = getCurrentUserId(token);

  const [expanded, setExpanded] =
    useState(initiallyExpanded);

  const [showComments, setShowComments] =
    useState(false);

  const [comments, setComments] =
    useState<PostComment[]>([]);

  const [commentsLoaded, setCommentsLoaded] =
    useState(false);

  const [loadingComments, setLoadingComments] =
    useState(false);

  const [commentsError, setCommentsError] =
    useState("");

  const [commentText, setCommentText] =
    useState("");

  const [savingComment, setSavingComment] =
    useState(false);

  // עריכת תגובה
  const [editingCommentId, setEditingCommentId] =
    useState<number | null>(null);

  const [editingText, setEditingText] =
    useState("");

  // מחיקת תגובה
  const [deletingCommentId, setDeletingCommentId] =
    useState<number | null>(null);

  const [busyCommentId, setBusyCommentId] =
    useState<number | null>(null);

  const [mediaError, setMediaError] =
    useState(false);

  // =====================================
  // POST DATA
  // =====================================

  const postId = post.postId;

  const candidateName =
    post.candidateName ||
    post.candidate?.user?.name ||
    post.candidate?.name ||
    "מועמד";

  const content = post.content ?? "";

  const mediaUrl = getMediaUrl(
    post.mediaUrl
  );

  const mediaKind = detectMediaKind(
    mediaUrl,
    post.contentType
  );

  const isLongPost =
    content.length > PREVIEW_LENGTH;

  const previewText =
    !expanded && isLongPost
      ? content
          .slice(0, PREVIEW_LENGTH)
          .trimEnd() + "..."
      : content;

  const date = formatDate(post.createdAt);

  const commentsCount = commentsLoaded
    ? comments.length
    : post.commentsCount ?? 0;

  // =====================================
  // איפוס שגיאת מדיה
  // =====================================

  useEffect(() => {
    setMediaError(false);
  }, [mediaUrl]);

  // =====================================
  // טעינת תגובות
  // =====================================

  const loadComments = async (
    signal?: AbortSignal
  ) => {
    const response = await fetch(
      `${API_ORIGIN}/api/Comments/post/${postId}`,
      { signal }
    );

    if (!response.ok) {
      throw new Error(
        await getApiError(
          response,
          "לא ניתן לטעון את התגובות"
        )
      );
    }

    const data: unknown = await response.json();

    if (signal?.aborted) return;

    if (!Array.isArray(data)) {
      throw new Error(
        "השרת החזיר מבנה תגובות לא תקין"
      );
    }

    setComments(data as PostComment[]);
    setCommentsLoaded(true);
  };

  useEffect(() => {
    if (!expanded || !showComments) {
      return;
    }

    const controller = new AbortController();

    const run = async () => {
      setLoadingComments(true);
      setCommentsError("");

      try {
        await loadComments(controller.signal);
      } catch (error) {
        if (!controller.signal.aborted) {
          setCommentsError(
            error instanceof Error
              ? error.message
              : "שגיאה בטעינת התגובות"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingComments(false);
        }
      }
    };

    void run();

    return () => {
      controller.abort();
    };
  }, [expanded, showComments, postId]);

  // =====================================
  // הוספת תגובה
  // =====================================

  const handleAddComment = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const text = commentText.trim();

    if (
      !token ||
      !text ||
      text.length > 1000 ||
      savingComment
    ) {
      return;
    }

    setSavingComment(true);
    setCommentsError("");

    try {
      const response = await fetch(
        `${API_ORIGIN}/api/Comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            postId,
            content: text,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getApiError(
            response,
            "לא ניתן לפרסם את התגובה"
          )
        );
      }

      setCommentText("");

      await loadComments();
    } catch (error) {
      setCommentsError(
        error instanceof Error
          ? error.message
          : "שגיאה בפרסום התגובה"
      );
    } finally {
      setSavingComment(false);
    }
  };

  // =====================================
  // התחלת עריכה
  // =====================================

  const startEditing = (
    comment: PostComment
  ) => {
    if (
      !token ||
      currentUserId === null ||
      Number(comment.userId) !== currentUserId
    ) {
      return;
    }

    setEditingCommentId(comment.commentId);
    setEditingText(comment.content);
    setDeletingCommentId(null);
    setCommentsError("");
  };

  // =====================================
  // ביטול עריכה
  // =====================================

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingText("");
  };

  // =====================================
  // שמירת עריכה
  // =====================================

  const handleSaveEdit = async (
    commentId: number
  ) => {
    const text = editingText.trim();

    if (
      !token ||
      !text ||
      text.length > 1000 ||
      busyCommentId !== null
    ) {
      return;
    }

    setBusyCommentId(commentId);
    setCommentsError("");

    try {
      const response = await fetch(
        `${API_ORIGIN}/api/Comments/${commentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: text,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getApiError(
            response,
            "לא ניתן לערוך את התגובה"
          )
        );
      }

      setComments((previous) =>
        previous.map((comment) =>
          comment.commentId === commentId
            ? {
                ...comment,
                content: text,
              }
            : comment
        )
      );

      cancelEditing();
    } catch (error) {
      setCommentsError(
        error instanceof Error
          ? error.message
          : "שגיאה בעריכת התגובה"
      );
    } finally {
      setBusyCommentId(null);
    }
  };

  // =====================================
  // מחיקת תגובה
  // =====================================

  const handleDeleteComment = async (
    commentId: number
  ) => {
    if (
      !token ||
      busyCommentId !== null
    ) {
      return;
    }

    setBusyCommentId(commentId);
    setCommentsError("");

    try {
      const response = await fetch(
        `${API_ORIGIN}/api/Comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          await getApiError(
            response,
            "לא ניתן למחוק את התגובה"
          )
        );
      }

      setComments((previous) =>
        previous.filter(
          (comment) =>
            comment.commentId !== commentId
        )
      );

      setDeletingCommentId(null);

      if (editingCommentId === commentId) {
        cancelEditing();
      }
    } catch (error) {
      setCommentsError(
        error instanceof Error
          ? error.message
          : "שגיאה במחיקת התגובה"
      );
    } finally {
      setBusyCommentId(null);
    }
  };

  // =====================================
  // פתיחה וסגירה של פוסט
  // =====================================

  const toggleExpanded = () => {
    setExpanded((previous) => !previous);

    if (expanded) {
      setShowComments(false);
      cancelEditing();
      setDeletingCommentId(null);
    }
  };

  // =====================================
  // JSX
  // =====================================

  return (
    <article
      className={`candidate-post ${
        expanded
          ? "candidate-post--expanded"
          : ""
      }`}
      dir="rtl"
    >
      <div className="candidate-post-content">

        {/* פרטי המועמד */}
        <div className="candidate-post-info">
          <h2>{candidateName}</h2>

          {post.candidate?.slogan && (
            <span className="candidate-post-role">
              {post.candidate.slogan}
            </span>
          )}

          {date && (
            <time className="candidate-post-city">
              {date}
            </time>
          )}
        </div>

        {/* כותרת הפוסט */}
        {post.title && (
          <h3 className="candidate-post-title">
            {post.title}
          </h3>
        )}

        {/* תוכן הפוסט */}
        <p className="candidate-post-description">
          {previewText}
        </p>

        {/* מדיה */}
        {mediaUrl &&
          !mediaError &&
          mediaKind !== "none" && (
            <div
              className={`candidate-post-image ${
                expanded
                  ? "expanded-media"
                  : "preview-media"
              }`}
            >
              {mediaKind === "image" ? (
                <img
                  src={mediaUrl}
                  alt={`תמונה מהפוסט של ${candidateName}`}
                  loading="lazy"
                  onError={() =>
                    setMediaError(true)
                  }
                />
              ) : (
                <video
                  key={mediaUrl}
                  src={mediaUrl}
                  controls={expanded}
                  preload="metadata"
                  playsInline
                  onClick={() => {
                    if (!expanded) {
                      setExpanded(true);
                    }
                  }}
                  onError={() =>
                    setMediaError(true)
                  }
                >
                  הדפדפן אינו תומך בסרטון.
                </video>
              )}
            </div>
          )}

        {mediaError && (
          <p className="candidate-media-error">
            לא ניתן לטעון את הקובץ המצורף.
          </p>
        )}

        {/* הרחבת הפוסט */}
        {!initiallyExpanded && (
          <button
            type="button"
            className="candidate-post-expand-button"
            onClick={toggleExpanded}
            aria-expanded={expanded}
          >
            {expanded
              ? "הצג פחות ↑"
              : "קרא את הפוסט המלא ←"}
          </button>
        )}

        {/* לייקים ותגובות */}
        {expanded && (
          <div className="candidate-post-interactions">

            <PostLikes postId={postId} />

            <div className="candidate-post-divider" />

            <button
              type="button"
              className="candidate-comments-toggle"
              onClick={() =>
                setShowComments(
                  (previous) => !previous
                )
              }
            >
              {showComments
                ? "סגירת תגובות"
                : `תגובות (${commentsCount})`}
            </button>

            {showComments && (
              <section className="candidate-comments-section">

                <h3>תגובות לפוסט</h3>

                {loadingComments && (
                  <p>טוען תגובות...</p>
                )}

                {!loadingComments &&
                  commentsLoaded &&
                  comments.length === 0 && (
                    <p>עדיין אין תגובות.</p>
                  )}

                {/* רשימת התגובות */}
                {comments.map((comment) => {
                  const isOwner =
                    !!token &&
                    currentUserId !== null &&
                    Number(comment.userId) ===
                      currentUserId;

                  const isEditing =
                    editingCommentId ===
                    comment.commentId;

                  const isDeleting =
                    deletingCommentId ===
                    comment.commentId;

                  const isBusy =
                    busyCommentId ===
                    comment.commentId;

                  return (
                    <div
                      key={comment.commentId}
                      className="candidate-comment"
                    >
                      <div className="candidate-comment-header">
                        <strong>
                          {comment.userName ||
                            "משתמש"}
                        </strong>

                        <span>
                          {formatDate(
                            comment.createdAt
                          )}
                        </span>
                      </div>

                      {/* תוכן או עריכה */}
                      {isEditing ? (
                        <div className="candidate-comment-edit">
                          <textarea
                            value={editingText}
                            onChange={(event) =>
                              setEditingText(
                                event.target.value
                              )
                            }
                            maxLength={1000}
                            rows={3}
                            disabled={isBusy}
                          />

                          <div className="candidate-comment-edit-actions">
                            <button
                              type="button"
                              className="candidate-comment-save"
                              disabled={
                                !editingText.trim() ||
                                busyCommentId !== null
                              }
                              onClick={() =>
                                void handleSaveEdit(
                                  comment.commentId
                                )
                              }
                            >
                              {isBusy
                                ? "שומר..."
                                : "שמירת שינויים"}
                            </button>

                            <button
                              type="button"
                              className="candidate-comment-cancel"
                              disabled={isBusy}
                              onClick={cancelEditing}
                            >
                              ביטול
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="candidate-comment-text">
                          {comment.content}
                        </p>
                      )}

                      {/* כפתורים לבעל התגובה */}
                      {isOwner &&
                        !isEditing &&
                        !isDeleting && (
                          <div className="candidate-comment-actions">
                            <button
                              type="button"
                              className="candidate-comment-edit-btn"
                              disabled={
                                busyCommentId !== null
                              }
                              onClick={() =>
                                startEditing(comment)
                              }
                            >
                              עריכה
                            </button>

                            <button
                              type="button"
                              className="candidate-comment-delete-btn"
                              disabled={
                                busyCommentId !== null
                              }
                              onClick={() => {
                                cancelEditing();
                                setDeletingCommentId(
                                  comment.commentId
                                );
                              }}
                            >
                              מחיקה
                            </button>
                          </div>
                        )}

                      {/* אישור מחיקה */}
                      {isOwner && isDeleting && (
                        <div className="candidate-comment-delete-confirm">
                          <span>
                            האם למחוק את התגובה?
                          </span>

                          <div>
                            <button
                              type="button"
                              className="candidate-comment-confirm-delete"
                              disabled={
                                busyCommentId !== null
                              }
                              onClick={() =>
                                void handleDeleteComment(
                                  comment.commentId
                                )
                              }
                            >
                              {isBusy
                                ? "מוחק..."
                                : "כן, למחוק"}
                            </button>

                            <button
                              type="button"
                              className="candidate-comment-cancel"
                              disabled={isBusy}
                              onClick={() =>
                                setDeletingCommentId(
                                  null
                                )
                              }
                            >
                              ביטול
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* הוספת תגובה רגילה */}
                {token ? (
                  <form
                    className="candidate-comment-form"
                    onSubmit={handleAddComment}
                  >
                    <label
                      htmlFor={`comment-${postId}`}
                    >
                      הוספת תגובה
                    </label>

                    <textarea
                      id={`comment-${postId}`}
                      value={commentText}
                      onChange={(event) =>
                        setCommentText(
                          event.target.value
                        )
                      }
                      rows={3}
                      maxLength={1000}
                      placeholder="כתבו תגובה..."
                      required
                      disabled={savingComment}
                    />

                    <button
                      type="submit"
                      disabled={
                        savingComment ||
                        !commentText.trim()
                      }
                    >
                      {savingComment
                        ? "מפרסם..."
                        : "פרסום תגובה"}
                    </button>
                  </form>
                ) : (
                  <p>
                    יש להתחבר כדי לפרסם תגובה.
                  </p>
                )}

                {commentsError && (
                  <p
                    className="candidate-comments-error"
                    role="alert"
                  >
                    {commentsError}
                  </p>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
