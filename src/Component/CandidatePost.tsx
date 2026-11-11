
import type { Post } from "../store/posts/postsThunks";
import PostLikes from "./PostLikes";
import "./CandidatePost.css";

interface CandidatePostProps {
  post: Post;
}

const API_ORIGIN = "https://localhost:7227";

function getMediaUrl(path?: string | null): string {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${API_ORIGIN}${path}`;
  }

  return `${API_ORIGIN}/Images/${path}`;
}

function isVideoFile(url: string): boolean {
  return /\.(mp4|avi|mov)(\?.*)?$/i.test(url);
}

export default function CandidatePost({
  post,
}: CandidatePostProps) {
  if (!post) {
    return null;
  }

  // שם המועמד מתוך השרת
  const candidateName =
    post.candidateName?.trim() ||
    post.candidate?.user?.name ||
    post.candidate?.name ||
    "מועמד";

  const content = post.content ?? "";

  const mediaUrl = getMediaUrl(post.mediaUrl);

  const date = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("he-IL")
    : "";

  const showVideo = isVideoFile(mediaUrl);

  return (
    <article className="candidate-post" dir="rtl">
      <div className="candidate-post-content">

        {/* פרטי המועמד */}
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

        {/* כותרת הפוסט */}
        {post.title && (
          <h3 className="candidate-post-title">
            {post.title}
          </h3>
        )}

        {/* תוכן הפוסט */}
        <p className="candidate-post-description">
          {content}
        </p>

        {/* תמונה או סרטון */}
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

        {/* לייקים ודיסלייקים */}
        <PostLikes postId={post.postId} />

        {/* הפרדה */}
        <div className="candidate-post-divider" />

        {/* פרטים נוספים */}
        <div className="candidate-post-stats">
          <span className="candidate-comments-count">
            פוסט #{post.postId}
          </span>
        </div>

      </div>
    </article>
  );
}
