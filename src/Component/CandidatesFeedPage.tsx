import { useEffect, useState } from "react";
import type { FormEvent, ChangeEvent } from "react";

import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchPosts, createPost } from "../store/posts/postsThunks";
import CandidatePost from "./CandidatePost";

import "./CandidatesFeedPage.css";

export function CandidatesFeedPage() {
  const dispatch = useAppDispatch();

  const { items: posts, loading, creating, error } =
    useAppSelector((state) => state.posts);

  const { role, isAuthenticated } =
    useAppSelector((state) => state.auth);

  const isCandidate =
    isAuthenticated && role === "Candidate";

  const [showAddPost, setShowAddPost] = useState(false);
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  useEffect(() => {
    dispatch(fetchPosts());
  }, [dispatch]);

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setMediaFile(event.target.files?.[0] ?? null);
  };

  const handleCreatePost = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!isCandidate || !content.trim()) return;

    try {
      await dispatch(
        createPost({
          content: content.trim(),
          mediaFile,
        })
      ).unwrap();

      setContent("");
      setMediaFile(null);
      setShowAddPost(false);

      dispatch(fetchPosts());
    } catch {
      // השגיאה מוצגת מתוך Redux
    }
  };

  return (
    <div className="candidates-feed-page" dir="rtl">
      <div className="candidates-feed-heading">
        <span>תנופה | הקול של המועמדים</span>

        <h1>הפוסטים של המועמדים</h1>

        <p>
          כאן תוכלו להתעדכן בפעילות המועמדים,
          לקרוא את הפוסטים ולהכיר את העשייה שלהם.
        </p>

        {isCandidate && (
          <button
            type="button"
            className="add-post-button"
            onClick={() => setShowAddPost((prev) => !prev)}
          >
            {showAddPost ? "ביטול" : "+ הוספת פוסט"}
          </button>
        )}
      </div>

      {isCandidate && showAddPost && (
        <form
          className="create-post-form"
          onSubmit={handleCreatePost}
        >
          <h2>פרסום פוסט חדש</h2>

          <label htmlFor="post-content">
            מה תרצו לשתף?
          </label>

          <textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="כתבו כאן את תוכן הפוסט..."
            rows={6}
            required
          />

          <label htmlFor="post-media">
            הוספת תמונה (לא חובה)
          </label>

          <input
            id="post-media"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />

          <button
            type="submit"
            className="publish-post-button"
            disabled={creating || !content.trim()}
          >
            {creating ? "מפרסם..." : "פרסום הפוסט"}
          </button>
        </form>
      )}

      {error && (
        <p className="posts-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="posts-status">
          טוען פוסטים מהשרת...
        </p>
      ) : posts.length === 0 ? (
        <p className="posts-status">
          עדיין אין פוסטים להצגה.
        </p>
      ) : (
        <div className="candidates-posts-list">
          {posts.map((post) => (
            <CandidatePost
              key={post.postId}
              post={post}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CandidatesFeedPage;