
import type { Post } from "../store/posts/postsThunks";
import PostLikes from "./PostLikes";
import "./CandidatePost.css";

interface CandidatePostProps {
  post: Post;
}

const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  "https://localhost:7227";

function getMediaUrl(path?: string | null): string {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const cleanPath = path.replace(/^\/+/, "");

  if (cleanPath.startsWith("Images/")) {
    return `${API_ORIGIN}/${cleanPath}`;
  }

  return `${API_ORIGIN}/Images/${cleanPath}`;
}

function isVideoFile(url: string): boolean {
  return /\.(mp4|avi|mov)(\?.*)?$/i.test(url);
}

export default function CandidatePost({
  post,
}: CandidatePostProps) {
  if (!post) return null;

  const candidateName =
    post.candidateName?.trim() ||
    post.candidate?.user?.name ||
    post.candidate?.name ||
    "מועמד";

  const content = post.content ?? "";
  const mediaUrl = getMediaUrl(post.mediaUrl);

  const date = post.createdAt
    ? new Date(post.createdAt).toLocaleString("he-IL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const showVideo = isVideoFile(mediaUrl);

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

        <PostLikes postId={post.postId} />

        <div className="candidate-post-divider" />

        <div className="candidate-post-stats">
          <span className="candidate-comments-count">
            פוסט #{post.postId}
          </span>
        </div>
      </div>
    </article>
  );
}
