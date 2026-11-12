import { useEffect, useState } from "react";
import type {
  FormEvent,
  ChangeEvent,
} from "react";

import {
  useAppDispatch,
  useAppSelector,
} from "../store/hooks";

import {
  fetchPosts,
  fetchPostById,
  createPost,
} from "../store/posts/postsThunks";

import {
  clearSelectedPost,
  clearPostsError,
} from "../store/posts/postsSlice";

import CandidatePost from "./CandidatePost";

import "./CandidatesFeedPage.css";

interface CandidatesFeedPageProps {
  selectedPostId?: number | null;
  isCandidate?: boolean;
  onClearSelectedPost?: () => void;
  onBackToNews?: () => void;
}

export function CandidatesFeedPage({
  selectedPostId = null,
  isCandidate = false,
  onClearSelectedPost,
  onBackToNews,
}: CandidatesFeedPageProps) {
  const dispatch = useAppDispatch();

  const {
    items: posts,
    loading,
    creating,
    error,
    selectedPost,
    selectedPostLoading,
    selectedPostError,
  } = useAppSelector((state) => state.posts);

  const [showAddPost, setShowAddPost] =
    useState(false);

  const [content, setContent] =
    useState("");

  const [mediaFile, setMediaFile] =
    useState<File | null>(null);

  const isSinglePost =
    selectedPostId !== null &&
    selectedPostId !== undefined;

  // =====================================
  // טעינת פוסטים מהשרת
  // =====================================

  useEffect(() => {
    if (selectedPostId != null) {
      dispatch(clearPostsError());

      const request = dispatch(
        fetchPostById(selectedPostId)
      );

      return () => {
        request.abort();
      };
    }

    dispatch(clearSelectedPost());

    const request = dispatch(fetchPosts());

    return () => {
      request.abort();
    };
  }, [dispatch, selectedPostId]);

  // =====================================
  // בחירת קובץ מדיה
  // =====================================

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setMediaFile(
      event.target.files?.[0] ?? null
    );
  };

  // =====================================
  // פרסום פוסט חדש
  // =====================================

  const handleCreatePost = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!isCandidate || !content.trim()) {
      return;
    }

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

      void dispatch(fetchPosts());
    } catch {
      // השגיאה מוצגת מתוך Redux
    }
  };

  // =====================================
  // מיון הפוסטים מהחדש לישן
  // =====================================

  const sortedPosts = [...posts].sort((a, b) => {
    const dateA = new Date(
      a.createdAt ?? 0
    ).getTime();

    const dateB = new Date(
      b.createdAt ?? 0
    ).getTime();

    return (
      dateB - dateA ||
      b.postId - a.postId
    );
  });

  // =====================================
  // הצגת פוסט בודד מתוך החדשות
  // =====================================

  if (isSinglePost) {
    return (
      <div
        className="candidates-feed-page"
        dir="rtl"
      >
        <div className="candidates-feed-heading">
          <span>
            תנופה | הקול של המועמדים
          </span>

          <h1>הפוסט המלא</h1>

          <div className="single-post-navigation">
            {onBackToNews && (
              <button
                type="button"
                className="single-post-back-button"
                onClick={onBackToNews}
              >
                חזרה לחדשות ועדכונים
              </button>
            )}

            {onClearSelectedPost && (
              <button
                type="button"
                className="single-post-all-button"
                onClick={onClearSelectedPost}
              >
                הצגת כל הפוסטים
              </button>
            )}
          </div>
        </div>

        {selectedPostLoading ? (
          <p className="posts-status">
            טוען את הפוסט...
          </p>
        ) : selectedPostError ? (
          <p
            className="posts-error"
            role="alert"
          >
            {selectedPostError}
          </p>
        ) : selectedPost &&
          Number(selectedPost.postId) ===
            Number(selectedPostId) ? (
          <div className="single-post-list">
            <CandidatePost
              key={selectedPost.postId}
              post={selectedPost}
            />
          </div>
        ) : (
          <p className="posts-status">
            הפוסט המבוקש לא נמצא.
          </p>
        )}
      </div>
    );
  }

  // =====================================
  // הצגת כל הפוסטים
  // =====================================

  return (
    <div
      className="candidates-feed-page"
      dir="rtl"
    >
      <div className="candidates-feed-heading">
        <span>
          תנופה | הקול של המועמדים
        </span>

        <h1>
          הפוסטים של המועמדים
        </h1>

        <p>
          כאן תוכלו להתעדכן בפעילות המועמדים,
          לקרוא את הפוסטים ולהכיר
          את העשייה שלהם.
        </p>

        {/* הוספת פוסט למועמד רשום בלבד */}
        {isCandidate && (
          <button
            type="button"
            className="add-post-button"
            onClick={() =>
              setShowAddPost((prev) => !prev)
            }
          >
            {showAddPost
              ? "ביטול"
              : "+ הוספת פוסט"}
          </button>
        )}
      </div>

      {/* טופס פרסום פוסט חדש */}
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
            onChange={(event) =>
              setContent(event.target.value)
            }
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
            disabled={
              creating || !content.trim()
            }
          >
            {creating
              ? "מפרסם..."
              : "פרסום הפוסט"}
          </button>
        </form>
      )}

      {/* הצגת שגיאות מהשרת */}
      {error && (
        <p
          className="posts-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* רשימת הפוסטים */}
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
          {sortedPosts.map((post) => (
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