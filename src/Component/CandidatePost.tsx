
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import type { Post } from "../store/posts/postsThunks";
import { useAppSelector } from "../store/hooks";

import PostLikes from "./PostLikes";

import "./CandidatePost.css";

const API_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN ||
  "https://localhost:7227"
).replace(/\/+$/, "");

const PREVIEW_LENGTH = 170;

// =====================================
// TYPES
// =====================================

interface CandidatePostProps {
  post: Post;
  initiallyExpanded?: boolean;
}

interface PostComment {
  commentId: number;
  postId: number;
  userId?: number;
  userName?: string;
  content: string;
  createdAt?: string;
}

type MediaKind = "image" | "video" | "none";

// =====================================
// URL
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

  // הסיומת קובעת לפני ContentType
  if (
    /\.(jpg|jpeg|png|webp)$/.test(cleanUrl)
  ) {
    return "image";
  }

  if (
    /\.(mp4|webm|mov|avi)$/.test(cleanUrl)
  ) {
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
// DATE
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
// COMPONENT
// =====================================

export default function CandidatePost({
  post,
  initiallyExpanded = false,
}: CandidatePostProps) {
  const token = useAppSelector(
    (state) => state.auth.token
  );

  const [expanded, setExpanded] =
    useState(initiallyExpanded);

  const [showComments, setShowComments] =
    useState(false);

  const [comments, setComments] =
    useState<PostComment[]>([]);

  const [loadingComments, setLoadingComments] =
    useState(false);

  const [savingComment, setSavingComment] =
    useState(false);

  const [commentText, setCommentText] =
    useState("");

  const [commentsError, setCommentsError] =
    useState("");

  const [commentsLoaded, setCommentsLoaded] =
    useState(false);

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
  // איפוס שגיאת מדיה בפוסט חדש
  // =====================================

  useEffect(() => {
    setMediaError(false);
  }, [mediaUrl]);

  // =====================================
  // LOAD COMMENTS
  // =====================================

  useEffect(() => {
    if (!expanded || !showComments) {
      return;
    }

    const controller = new AbortController();

    const loadComments = async () => {
      setLoadingComments(true);
      setCommentsError("");

      try {
        const response = await fetch(
          `${API_ORIGIN}/api/Comments/post/${postId}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            "לא ניתן לטעון את התגובות"
          );
        }

        const data = await response.json();

        if (controller.signal.aborted) {
          return;
        }

        setComments(
          Array.isArray(data) ? data : []
        );

        setCommentsLoaded(true);
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

    void loadComments();

    return () => {
      controller.abort();
    };
  }, [expanded, showComments, postId]);

  // =====================================
  // CREATE COMMENT
  // =====================================

  const handleAddComment = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !token ||
      !commentText.trim() ||
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
            content: commentText.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "לא ניתן לפרסם את התגובה"
        );
      }

      setCommentText("");

      const refreshResponse = await fetch(
        `${API_ORIGIN}/api/Comments/post/${postId}`
      );

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();

        setComments(
          Array.isArray(data) ? data : []
        );

        setCommentsLoaded(true);
      }
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
  // EXPAND / COLLAPSE
  // =====================================

  const toggleExpanded = () => {
    setExpanded((previous) => !previous);

    if (expanded) {
      setShowComments(false);
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

        {/* כותרת */}
        {post.title && (
          <h3 className="candidate-post-title">
            {post.title}
          </h3>
        )}

        {/* תוכן */}
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
                  onError={() => {
                    setMediaError(true);
                  }}
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
                  onError={() => {
                    setMediaError(true);
                  }}
                >
                  הדפדפן אינו תומך בסרטון.
                </video>
              )}
            </div>
          )}

        {/* שגיאת טעינה */}
        {mediaError && (
          <p className="candidate-media-error">
            לא ניתן לטעון את הקובץ המצורף.
          </p>
        )}

        {/* כפתור הרחבה */}
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
                setShowComments((prev) => !prev)
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

                {comments.map((comment) => (
                  <div
                    key={comment.commentId}
                    className="candidate-comment"
                  >
                    <div className="candidate-comment-header">
                      <strong>
                        {comment.userName || "משתמש"}
                      </strong>

                      <span>
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>

                    <p>{comment.content}</p>
                  </div>
                ))}

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
