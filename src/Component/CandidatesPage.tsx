
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import type { Post } from "../store/posts/postsThunks";
import { useAppSelector } from "../store/hooks";
import {
  getMediaUrl,
  detectMediaKind,
} from "../utils/mediaUrl";

import PostLikes from "./PostLikes";
import "./CandidatePost.css";

const API_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN ||
  "https://localhost:7227"
).replace(/\/+$/, "");

const PREVIEW_LENGTH = 170;

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

  const [
    loadingComments,
    setLoadingComments,
  ] = useState(false);

  const [
    savingComment,
    setSavingComment,
  ] = useState(false);

  const [
    commentText,
    setCommentText,
  ] = useState("");

  const [
    commentsError,
    setCommentsError,
  ] = useState("");

  const [
    commentsLoaded,
    setCommentsLoaded,
  ] = useState(false);

  const [
    mediaError,
    setMediaError,
  ] = useState(false);

  // =====================================
  // נתוני הפוסט
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

  const date = formatDate(
    post.createdAt
  );

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

  useEffect(() => {
    if (
      !expanded ||
      !showComments
    ) {
      return;
    }

    const controller =
      new AbortController();

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

        const data =
          await response.json();

        if (controller.signal.aborted) {
          return;
        }

        setComments(
          Array.isArray(data)
            ? data
            : []
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
  }, [
    expanded,
    showComments,
    postId,
  ]);

  // =====================================
  // הוספת תגובה
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
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            postId,
            content:
              commentText.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "לא ניתן לפרסם את התגובה"
        );
      }

      setCommentText("");

      const refreshResponse =
        await fetch(
          `${API_ORIGIN}/api/Comments/post/${postId}`
        );

      if (refreshResponse.ok) {
        const data =
          await refreshResponse.json();

        setComments(
          Array.isArray(data)
            ? data
            : []
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
  // פתיחה וסגירה
  // =====================================

  const toggleExpanded = () => {
    setExpanded(
      (previous) => !previous
    );

    if (expanded) {
      setShowComments(false);
    }
  };

  // =====================================
  // תצוגת הכרטיסייה
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
          <h2>
            {candidateName}
          </h2>

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

        {/* תוכן הפוסט */}
        <p className="candidate-post-description">
          {previewText}
        </p>

        {/* תמונה או סרטון */}
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

        {/* שגיאת מדיה */}
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

            <PostLikes
              postId={postId}
            />

            <div className="candidate-post-divider" />

            <button
              type="button"
              className="candidate-comments-toggle"
              onClick={() =>
                setShowComments(
                  (prev) => !prev
                )
              }
            >
              {showComments
                ? "סגירת תגובות"
                : `תגובות (${commentsCount})`}
            </button>

            {showComments && (
              <section className="candidate-comments-section">
                <h3>
                  תגובות לפוסט
                </h3>

                {loadingComments && (
                  <p>
                    טוען תגובות...
                  </p>
                )}

                {!loadingComments &&
                  commentsLoaded &&
                  comments.length === 0 && (
                    <p>
                      עדיין אין תגובות.
                    </p>
                  )}

                {comments.map(
                  (comment) => (
                    <div
                      key={
                        comment.commentId
                      }
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

                      <p>
                        {comment.content}
                      </p>
                    </div>
                  )
                )}

                {token ? (
                  <form
                    className="candidate-comment-form"
                    onSubmit={
                      handleAddComment
                    }
                  >
                    <label
                      htmlFor={`comment-${postId}`}
                    >
                      הוספת תגובה
                    </label>

                    <textarea
                      id={`comment-${postId}`}
                      value={
                        commentText
                      }
                      onChange={(
                        event
                      ) =>
                        setCommentText(
                          event.target.value
                        )
                      }
                      rows={3}
                      placeholder="כתבו תגובה..."
                      required
                      disabled={
                        savingComment
                      }
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
