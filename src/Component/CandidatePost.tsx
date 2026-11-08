import { useState } from "react";
import "./CandidatePost.css";

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

export interface CandidateComment {
  id: number | string;
  author: string;
  text: string;
}

interface CandidatePostProps {
  candidate: CandidatePostData;
}

export default function CandidatePost({ candidate }: CandidatePostProps) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(candidate.likes ?? 0);
  const [comments, setComments] = useState<CandidateComment[]>(candidate.comments ?? []);
  const [commentText, setCommentText] = useState("");

  const handleLike = () => {
    setLikes((prev) => prev + (liked ? -1 : 1));
    setLiked((prev) => !prev);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();

    const text = commentText.trim();
    if (!text) return;

    const newComment: CandidateComment = {
      id: Date.now(),
      author: "משתמש מחובר",
      text,
    };

    setComments((prev) => [...prev, newComment]);
    setCommentText("");
  };

  // התאמת שדות מהשרת (Swagger) לשדות התצוגה
  const displayName = candidate.name ?? "מועמד";
  const displayRole = candidate.role ?? candidate.slogan ?? "";
  const displayImage = candidate.imageUrl ?? candidate.profileImageUrl ?? "";
  const displayCity = candidate.city ?? "";
  const displayDescription = candidate.description ?? candidate.slogan ?? "";

  return (
    <article className="candidate-post">
      <div className="candidate-post-image">
        {displayImage ? (
          <img
            src={displayImage.startsWith("http") ? displayImage : `http://localhost:5296/Images/${displayImage}`}
            alt={displayName}
          />
        ) : (
          <div className="candidate-post-placeholder">
            <span>👤</span>
          </div>
        )}
      </div>

      <div className="candidate-post-content">
        <div className="candidate-post-info">
          <h2>{displayName}</h2>
          {displayRole && <div className="candidate-post-role">{displayRole}</div>}
          {displayCity && <div className="candidate-post-city">📍 {displayCity}</div>}
        </div>

        {displayDescription && (
          <p className="candidate-post-description">{displayDescription}</p>
        )}

        <div className="candidate-post-divider" />

        <div className="candidate-post-stats">
          <button
            type="button"
            className={`candidate-like ${liked ? "liked" : ""}`}
            onClick={handleLike}
            aria-pressed={liked}
          >
            <span>{liked ? "♥" : "♡"}</span>
            {likes} לייקים
          </button>

          <span className="candidate-comments-count">
            {comments.length} תגובות
          </span>
        </div>

        <div className="candidate-post-comments">
          <h3>שיח עם המועמד</h3>

          <div className="candidate-comments-list">
            {comments.length === 0 ? (
              <p className="candidate-no-comments">
                עדיין אין תגובות. היו הראשונים להגיב!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="candidate-comment">
                  <div className="candidate-comment-avatar">
                    {comment.author ? comment.author.charAt(0) : "U"}
                  </div>

                  <div className="candidate-comment-body">
                    <strong>{comment.author}</strong>
                    <p>{comment.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form className="candidate-comment-form" onSubmit={handleAddComment}>
            <input
              type="text"
              placeholder="כתבו תגובה..."
              aria-label="כתיבת תגובה"
              maxLength={500}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />

            <button type="submit" disabled={!commentText.trim()}>
              שליחה
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}