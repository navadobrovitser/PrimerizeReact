
import type { Post } from "../store/posts/postsThunks";
import PostLikes from "./PostLikes";
import "./CandidatePost.css";

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

        <p className="candidate-post-description">
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
