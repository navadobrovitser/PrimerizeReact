
import { useState } from "react";
import "./CandidatePost.css";

export interface CandidatePostData {
  id: number;
  name: string;
  role: string;
  city: string;
  imageUrl: string;
  description: string;
  likes: number;
  comments: CandidateComment[];
}

export interface CandidateComment {
  id: number;
  author: string;
  text: string;
}

interface CandidatePostProps {
  candidate: CandidatePostData;
}

export default function CandidatePost({
  candidate,
}: CandidatePostProps) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(candidate.likes);
  const [comments, setComments] = useState(candidate.comments);
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

  return (
    <article className="candidate-post">
      <div className="candidate-post-image">
        {candidate.imageUrl ? (
          <img
            src={candidate.imageUrl}
            alt={candidate.name}
          />
        ) : (
          <div className="candidate-post-placeholder">
            <span>👤</span>
          </div>
        )}
      </div>

      <div className="candidate-post-content">
        <div className="candidate-post-info">
          <h2>{candidate.name}</h2>
          <div className="candidate-post-role">
            {candidate.role}
          </div>
          <div className="candidate-post-city">
            📍 {candidate.city}
          </div>
        </div>

        <p className="candidate-post-description">
          {candidate.description}
        </p>

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
                <div
                  key={comment.id}
                  className="candidate-comment"
                >
                  <div className="candidate-comment-avatar">
                    {comment.author.charAt(0)}
                  </div>

                  <div className="candidate-comment-body">
                    <strong>{comment.author}</strong>
                    <p>{comment.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form
            className="candidate-comment-form"
            onSubmit={handleAddComment}
          >
            <input
              type="text"
              placeholder="כתבו תגובה..."
              aria-label="כתיבת תגובה"
              maxLength={500}
              value={commentText}
              onChange={(e) =>
                setCommentText(e.target.value)
              }
            />

            <button
              type="submit"
              disabled={!commentText.trim()}
            >
              שליחה
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
