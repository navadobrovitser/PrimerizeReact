import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Post } from "../store/posts/postsThunks";
import { useAppSelector } from "../store/hooks";
import PostLikes from "./PostLikes";
import "./CandidatePost.css";

const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  "https://localhost:7227";

interface CommentDto {
  commentId: number;
  postId: number;
  userId: number;
  userName: string;
  content: string;
  createdAt: string;
}

export interface CandidateComment {
  id: number | string;
  author: string;
  text: string;
}

export interface CandidatePostData {
  candidateId?: number;
  id?: number | string;
  name?: string;
  role?: string;
  slogan?: string;
  city?: string;
  imageUrl?: string;
  profileImageUrl?: string;
  description?: string;
  likes?: number;
  comments?: CandidateComment[];
}

interface CandidatePostProps {
  post: Post;
}

function getMediaUrl(path?: string | null): string {
  if (!path) return "";

  const cleanUrl = path.trim();

  if (/^https?:\/\//i.test(cleanUrl)) {
    return cleanUrl;
  }

  const cleanPath = cleanUrl.replace(/^\/+/, "");

  if (/^Images\//i.test(cleanPath)) {
    return `${API_ORIGIN}/${cleanPath}`;
  }

  return `${API_ORIGIN}/Images/${cleanPath}`;
}

function isVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg|avi|mov)(\?.*)?$/i.test(url);
}

function formatDate(
  value?: string | null,
  includeTime = false
): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  if (includeTime) {
    return date.toLocaleString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("he-IL");
}

function sortComments(
  comments: CommentDto[]
): CommentDto[] {
  return [...comments].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime()
  );
}

export default function CandidatePost({
  post,
}: CandidatePostProps) {
  const token = useAppSelector(
    (state) => state.auth.token
  );

  const [comments, setComments] = useState<CommentDto[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentsError, setCommentsError] = useState("");
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  const postId = post.postId;

  useEffect(() => {
    const controller = new AbortController();

    const loadComments = async () => {
      setLoadingComments(true);
      setCommentsError("");
      setCommentsLoaded(false);
      setComments([]);

      try {
        const response = await fetch(
          `${API_ORIGIN}/api/Comments/post/${postId}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("לא ניתן לטעון את התגובות");
        }

        const data: CommentDto[] = await response.json();

        if (controller.signal.aborted) {
          return;
        }

        setComments(sortComments(data));
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
  }, [postId]);

  const handleAddComment = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!token || !commentText.trim() || savingComment) {
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
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.message || "פרסום התגובה נכשל"
        );
      }

      const refreshResponse = await fetch(
        `${API_ORIGIN}/api/Comments/post/${postId}`
      );

      if (!refreshResponse.ok) {
        throw new Error(
          "התגובה נשמרה, אך רענון התגובות נכשל"
        );
      }

      const updatedComments: CommentDto[] =
        await refreshResponse.json();

      setComments(sortComments(updatedComments));
      setCommentText("");
      setShowComments(true);
      setCommentsLoaded(true);
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

  const candidateName =
    post.candidateName?.trim() ||
    post.candidate?.user?.name ||
    post.candidate?.name ||
    "מועמד";

  const content = post.content ?? "";
  const mediaUrl = getMediaUrl(post.mediaUrl);
  const date = formatDate(post.createdAt, true);
  const showVideo = isVideoFile(mediaUrl);

  const commentsCount = commentsLoaded
    ? comments.length
    : post.commentsCount ?? 0;

  return (
    <article className="candidate-post" dir="rtl">
      <div className="candidate-post-content">
        <div className="candidate-post-info">
          <h2>{candidateName}</h2>

          {post.candidate?.slogan && (
            <div className="candidate-post-role">
              {post.candidate.slogan}
            </div>
          )}

          {date && (
            <div className="candidate-post-city">
              פורסם בתאריך {date}
            </div>
          )}
        </div>

        {post.title && (
          <h3 className="candidate-post-title">
            {post.title}
          </h3>
        )}

        <p
          className="candidate-post-description"
          style={{ whiteSpace: "pre-wrap" }}
        >
          {content}
        </p>

        {mediaUrl && (
          <div className="candidate-post-image">
            {showVideo ? (
              <video
                src={mediaUrl}
                controls
                preload="metadata"
                playsInline
                style={{
                  width: "100%",
                  maxHeight: "450px",
                  borderRadius: "12px",
                  background: "#000",
                }}
              >
                הדפדפן שלך אינו תומך בהצגת סרטונים.
              </video>
            ) : (
              <img
                src={mediaUrl}
                alt="תמונה שצורפה לפוסט"
                loading="lazy"
              />
            )}
          </div>
        )}

        {/* לייקים */}
        <PostLikes postId={postId} />

        <div className="candidate-post-divider" />

        {/* ספירת תגובות וכפתור פתיחה */}
        <div className="candidate-post-stats">
          <button
            type="button"
            className="candidate-comments-toggle"
            onClick={() =>
              setShowComments((previous) => !previous)
            }
            aria-expanded={showComments}
          >
            {showComments
              ? "סגירת תגובות"
              : `תגובות (${commentsCount})`}
          </button>

          <span className="candidate-comments-count">
            פוסט #{postId}
          </span>
        </div>

        {/* אזור התגובות */}
        {showComments && (
          <section className="candidate-comments-section">
            <h3>תגובות לפוסט</h3>

            {loadingComments && (
              <p className="candidate-comments-message">
                טוען תגובות...
              </p>
            )}

            {!loadingComments &&
              commentsLoaded &&
              comments.length === 0 && (
                <p className="candidate-comments-message">
                  עדיין אין תגובות. אפשר להיות הראשונים להגיב.
                </p>
              )}

            {!loadingComments &&
              comments.map((comment) => (
                <div
                  key={comment.commentId}
                  className="candidate-comment"
                >
                  <div className="candidate-comment-header">
                    <strong>
                      {comment.userName || "משתמש"}
                    </strong>

                    <time>
                      {formatDate(comment.createdAt)}
                    </time>
                  </div>

                  <p>{comment.content}</p>
                </div>
              ))}

            {/* הוספת תגובה למשתמש מחובר */}
            {token && (
              <form
                className="candidate-comment-form"
                onSubmit={handleAddComment}
              >
                <label htmlFor={`comment-${postId}`}>
                  הוספת תגובה
                </label>

                <textarea
                  id={`comment-${postId}`}
                  value={commentText}
                  onChange={(event) =>
                    setCommentText(event.target.value)
                  }
                  placeholder="כתבו את התגובה שלכם..."
                  rows={3}
                  required
                />

                <button
                  type="submit"
                  disabled={
                    savingComment || !commentText.trim()
                  }
                >
                  {savingComment
                    ? "מפרסם תגובה..."
                    : "פרסום תגובה"}
                </button>
              </form>
            )}

            {!token && (
              <p className="candidate-comments-message">
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
    </article>
  );
}